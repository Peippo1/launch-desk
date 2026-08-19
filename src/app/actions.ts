"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normaliseCompanyName } from "@/lib/catalog";
import { parseCsv } from "@/lib/csv";
import { renderDigest } from "@/lib/digest";
import { createOpenAiProvider } from "@/lib/ai/openai-provider";
import { generateApplicationDraft as generateDraftWithProvider } from "@/lib/ai/provider";
import { calculateScore } from "@/lib/scoring";
import { getApplicationById, getCompanyById, getDefaultProfile, getDigestInputs, getLatestScore, getLatestScoreOrThrow, getProjects, getRoleById, getRoleWithCompany } from "@/lib/repositories";
import { formToApplicationUpdate, formToCompany, formToContact, formToInterview, formToNote, formToProject, formToRole, formToRoleStatus, formToScoreOverride } from "@/lib/validation";
import { canTransitionApplicationStatus } from "@/lib/workflow";
import { requireAuth } from "@/lib/auth/server";

function refresh(...paths: string[]) { paths.forEach((path) => revalidatePath(path)); }

export async function createCompany(form: FormData) {
  await requireAuth();
  const input = formToCompany(form);
  const normalizedName = normaliseCompanyName(input.name);
  await db.company.upsert({
    where: { normalizedName },
    create: { ...input, normalizedName },
    update: { ...input }
  });
  refresh("/", "/companies", "/roles");
  redirect("/companies");
}

export async function updateCompany(form: FormData) {
  await requireAuth();
  const id = String(form.get("id"));
  const input = formToCompany(form);
  const normalizedName = normaliseCompanyName(input.name);
  await db.company.update({ where: { id }, data: { ...input, normalizedName } });
  refresh("/", "/companies", "/roles");
}

export async function archiveCompany(form: FormData) {
  await requireAuth();
  const id = String(form.get("id"));
  await db.company.update({ where: { id }, data: { watchStatus: "ARCHIVED", targetTier: "ARCHIVE" } });
  refresh("/", "/companies", "/roles");
}

export async function importCompanies(form: FormData) {
  await requireAuth();
  const csv = String(form.get("csv") ?? "").trim();
  if (!csv) redirect("/companies?import=empty");
  const parsed = parseCsv(csv);
  if (parsed.errors.some((error) => error.row === 1 && error.reason.includes("name"))) redirect("/companies?import=missing-name");
  let importedRows = 0;
  const errors = [...parsed.errors];

  for (const [index, row] of parsed.rows.entries()) {
    const value = (name: string) => row[name.toLowerCase()] || undefined;
    const name = value("name")?.trim();
    if (!name || name.length < 2) { errors.push({ row: index + 2, reason: "Name is required." }); continue; }
    const tier = value("targettier")?.toUpperCase();
    const watch = value("watchstatus")?.toUpperCase();
    await db.company.upsert({
      where: { normalizedName: normaliseCompanyName(name) },
      create: {
        name, normalizedName: normaliseCompanyName(name), websiteUrl: value("websiteurl"), careersUrl: value("careersurl"), stage: value("stage"),
        sectors: value("sectors")?.split("|").filter(Boolean) ?? [], hiringRegions: value("hiringregions")?.split("|").filter(Boolean) ?? [],
        targetTier: tier === "A" || tier === "B" || tier === "C" ? tier : "B", watchStatus: watch === "PAUSED" || watch === "ARCHIVED" ? watch : "ACTIVE", rationale: value("rationale")
      },
      update: { websiteUrl: value("websiteurl"), careersUrl: value("careersurl"), stage: value("stage"), rationale: value("rationale") }
    });
    importedRows += 1;
  }
  await db.importRun.create({ data: { kind: "target-50-csv", totalRows: parsed.rows.length + parsed.errors.length, importedRows, errors } });
  refresh("/", "/companies", "/roles");
  redirect(`/companies?imported=${importedRows}&errors=${errors.length}`);
}

export async function createRole(form: FormData) {
  await requireAuth();
  const input = formToRole(form);
  const profile = await getDefaultProfile();
  const role = await db.role.create({ data: { ...input, closingDate: input.closingDate ? new Date(input.closingDate) : undefined } });
  const company = await getCompanyById(role.companyId);
  const score = calculateScore(role, company, profile);
  await db.score.create({ data: { roleId: role.id, targetProfileId: profile.id, overall: score.overall, confidence: score.confidence, label: score.label.replace(" ", "_").toUpperCase() as "STRONG_APPLY" | "CONSIDER" | "STRETCH" | "LOW_FIT" | "AVOID", recommendation: score.recommendation, strengths: score.strengths, gaps: score.gaps, questions: score.questions, breakdown: score.breakdown as unknown as Prisma.InputJsonValue } });
  refresh("/", "/roles");
  redirect(`/roles/${role.id}`);
}

export async function regenerateScore(form: FormData) {
  await requireAuth();
  const roleId = String(form.get("roleId"));
  const role = await getRoleWithCompany(roleId);
  const profile = await getDefaultProfile();
  const current = await getLatestScore(roleId);
  const score = calculateScore(role, role.company, profile);
  await db.score.create({ data: { roleId, targetProfileId: profile.id, overall: score.overall, confidence: score.confidence, label: score.label.replace(" ", "_").toUpperCase() as "STRONG_APPLY" | "CONSIDER" | "STRETCH" | "LOW_FIT" | "AVOID", recommendation: score.recommendation, strengths: score.strengths, gaps: score.gaps, questions: score.questions, breakdown: score.breakdown as unknown as Prisma.InputJsonValue, humanOverride: current?.humanOverride } });
  refresh("/", `/roles/${roleId}`);
}

export async function createApplication(form: FormData) {
  await requireAuth();
  const roleId = String(form.get("roleId"));
  const role = await getRoleById(roleId);
  await db.application.upsert({ where: { roleId }, create: { roleId, status: "SHORTLISTED", nextAction: "Review role details and choose an application approach." }, update: {} });
  await db.role.update({ where: { id: role.id }, data: { status: "REVIEWED" } });
  refresh("/", "/applications", `/roles/${roleId}`);
  redirect("/applications");
}

export async function updateRoleStatus(form: FormData) {
  await requireAuth();
  const input = formToRoleStatus(form);
  await db.role.update({ where: { id: input.roleId }, data: { status: input.status } });
  refresh("/", "/roles", `/roles/${input.roleId}`);
}

export async function setScoreOverride(form: FormData) {
  await requireAuth();
  const input = formToScoreOverride(form);
  const current = await getLatestScoreOrThrow(input.roleId);
  await db.score.update({ where: { id: current.id }, data: { humanOverride: input.humanOverride } });
  refresh("/", "/roles", `/roles/${input.roleId}`);
}

export async function addNote(form: FormData) {
  await requireAuth();
  const input = formToNote(form);
  const relation = input.scope === "COMPANY" ? { companyId: input.entityId } : input.scope === "ROLE" ? { roleId: input.entityId } : input.scope === "APPLICATION" ? { applicationId: input.entityId } : { projectId: input.entityId };
  await db.note.create({ data: { scope: input.scope, body: input.body, ...relation } });
  refresh("/", "/companies", "/applications", "/portfolio", `/roles/${input.entityId}`);
}

export async function createProject(form: FormData) {
  await requireAuth();
  const input = formToProject(form);
  await db.project.create({ data: input });
  refresh("/portfolio", "/roles");
  redirect("/portfolio");
}

export async function updateProject(form: FormData) {
  await requireAuth();
  const id = String(form.get("id"));
  const input = formToProject(form);
  await db.project.update({ where: { id }, data: input });
  refresh("/portfolio", "/roles");
}

export async function updateApplication(form: FormData) {
  await requireAuth();
  const input = formToApplicationUpdate(form);
  const current = await getApplicationById(input.id);
  if (!canTransitionApplicationStatus(current.status, input.status)) redirect("/applications?error=invalid-transition");
  await db.application.update({
    where: { id: input.id },
    data: {
      status: input.status,
      nextAction: input.nextAction,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      applicationDate: input.status === "APPLIED" && !current.applicationDate ? new Date() : current.applicationDate,
      cvVersion: input.cvVersion,
      submittedSalary: input.submittedSalary,
      submittedCurrency: input.submittedCurrency,
      additionalInfo: input.additionalInfo,
      outcomeReason: input.outcomeReason
    }
  });
  refresh("/", "/applications");
}

export async function generateApplicationDraft(form: FormData) {
  await requireAuth();
  const applicationId = String(form.get("applicationId") ?? "");
  const application = await getApplicationById(applicationId);
  const projects = await getProjects();
  const provider = createOpenAiProvider();
  if (!provider) redirect("/applications?error=ai-not-configured");

  const result = await generateDraftWithProvider(provider, {
    roleTitle: application.role.title,
    companyName: application.role.company.name,
    roleText: [application.role.summary, ...application.role.requirements, ...application.role.responsibilities, application.role.rawSnapshot].filter(Boolean).join("\n"),
    candidateEvidence: projects.map((project) => `${project.name}: ${project.summary} Stack: ${project.stack.join(", ")}`)
  });
  if (!result.ok) redirect(`/applications?error=ai-${result.error}`);

  const assumptions = result.value.assumptions.length ? `\n\nAssumptions to review:\n${result.value.assumptions.map((item) => `- ${item}`).join("\n")}` : "";
  const sources = result.value.sourceRefs.length ? `\n\nEvidence used:\n${result.value.sourceRefs.map((item) => `- ${item}`).join("\n")}` : "";
  await db.application.update({ where: { id: applicationId }, data: { status: "DRAFTING", additionalInfo: `${result.value.body}${assumptions}${sources}` } });
  refresh("/", "/applications");
  redirect("/applications?generated=1");
}

export async function createContact(form: FormData) {
  await requireAuth();
  const input = formToContact(form);
  await db.contact.create({ data: input });
  refresh("/", "/relationships", "/companies");
  redirect("/relationships");
}

export async function updateContact(form: FormData) {
  await requireAuth();
  const id = String(form.get("id") ?? "");
  const input = formToContact(form);
  await db.contact.update({ where: { id }, data: input });
  refresh("/", "/relationships", "/companies");
}

export async function createInterview(form: FormData) {
  await requireAuth();
  const input = formToInterview(form);
  await db.interview.create({ data: { ...input, scheduledAt: new Date(input.scheduledAt), applicationId: input.applicationId ?? null } });
  refresh("/", "/relationships", "/roles", "/applications");
  redirect("/relationships");
}

export async function updateInterview(form: FormData) {
  await requireAuth();
  const id = String(form.get("id") ?? "");
  const input = formToInterview(form);
  await db.interview.update({ where: { id }, data: { ...input, scheduledAt: new Date(input.scheduledAt), applicationId: input.applicationId ?? null } });
  refresh("/", "/relationships", "/roles", "/applications");
}

export async function generateDigest() {
  await requireAuth();
  const now = new Date();
  const [roles, applications] = await getDigestInputs(now);
  const digest = renderDigest({ generatedAt: now, roles, applications });
  await db.digest.create({ data: { content: digest.content, inputCounts: digest.inputCounts } });
  refresh("/", "/digest");
  redirect("/digest");
}
