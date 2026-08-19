import { z } from "zod";

const optionalUrl = z.union([z.string().url(), z.literal("")]).transform((value) => value || undefined);
const list = (value: FormDataEntryValue | null) => String(value ?? "").split(/\n|,/).map((item) => item.trim()).filter(Boolean);
const optionalString = (max: number) => z.string().trim().max(max).transform((value) => value || undefined);
const nullableString = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const nullablePositiveInt = z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().int().positive().nullable());

export const companyInput = z.object({
  name: z.string().trim().min(2).max(120), websiteUrl: optionalUrl, careersUrl: optionalUrl, stage: optionalString(80),
  sectors: z.array(z.string().max(80)).default([]), hiringRegions: z.array(z.string().max(80)).default([]), targetTier: z.enum(["A", "B", "C", "ARCHIVE"]),
  watchStatus: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]), rationale: optionalString(2000)
});

export const roleInput = z.object({
  companyId: z.string().min(1), title: z.string().trim().min(2).max(160), roleFamily: z.enum(["AI_DEPLOYMENT", "FORWARD_DEPLOYED_ENGINEERING", "SOLUTIONS_ENGINEERING", "CUSTOMER_ENGINEERING", "APPLIED_AI_ENGINEERING", "AI_CONSULTING", "TECHNICAL_PRODUCT_AI_PRODUCT", "CONTRACT_FRACTIONAL_AI", "PURE_SOFTWARE_ENGINEERING", "GROWTH_OPERATOR", "CUSTOMER_SUCCESS", "OTHER"]), location: z.string().trim().max(160).optional(),
  remoteType: z.enum(["REMOTE", "HYBRID", "ON_SITE", "FLEXIBLE"]), employmentType: z.enum(["PERMANENT", "CONTRACT", "FRACTIONAL"]),
  salaryMin: z.coerce.number().int().positive().optional(), salaryMax: z.coerce.number().int().positive().optional(), currency: z.enum(["GBP", "USD", "EUR", "AUD"]),
  sourcePlatform: z.string().trim().max(80).optional(), sourceUrl: z.string().url(), closingDate: z.string().optional(), summary: z.string().trim().max(6000).optional(),
  requirements: z.array(z.string().max(1000)).default([]), responsibilities: z.array(z.string().max(1000)).default([]), rawSnapshot: z.string().trim().max(30000).optional()
}).refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMin <= input.salaryMax, { message: "Minimum salary cannot exceed maximum salary." });

export const applicationUpdateInput = z.object({
  id: z.string().min(1),
  status: z.enum(["DISCOVERED", "SHORTLISTED", "DRAFTING", "APPLIED", "RECRUITER_SCREEN", "HIRING_MANAGER", "TECHNICAL_ROUND", "FINAL_ROUND", "OFFER", "REJECTED", "WITHDRAWN", "ARCHIVED"]),
  nextAction: nullableString(500),
  followUpDate: z.string().transform((value) => value || null),
  cvVersion: nullableString(80),
  submittedSalary: nullablePositiveInt,
  submittedCurrency: z.enum(["", "GBP", "USD", "EUR", "AUD"]).transform((value) => value || null),
  additionalInfo: nullableString(6000),
  outcomeReason: nullableString(500)
});

export const roleStatusInput = z.object({ roleId: z.string().min(1), status: z.enum(["NEW", "REVIEWED", "ARCHIVED"]) });
export const scoreOverrideInput = z.object({ roleId: z.string().min(1), humanOverride: z.union([z.literal(""), z.coerce.number().int().min(0).max(100)]).transform((value) => value === "" ? undefined : value) });
export const noteInput = z.object({ scope: z.enum(["COMPANY", "ROLE", "APPLICATION", "PROJECT"]), entityId: z.string().min(1), body: z.string().trim().min(2).max(4000) });
export const projectInput = z.object({
  name: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(2).max(6000),
  stack: z.array(z.string().max(100)).default([]),
  relevanceTags: z.array(z.string().max(100)).default([]),
  interviewStory: z.string().trim().min(2).max(4000),
  caveats: z.array(z.string().max(500)).default([])
});
export const contactInput = z.object({
  companyId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  title: optionalString(160),
  email: z.union([z.string().email(), z.literal("")]).transform((value) => value || undefined),
  profileUrl: optionalUrl,
  notes: optionalString(4000)
});
export const interviewInput = z.object({
  roleId: z.string().min(1),
  applicationId: z.union([z.string().min(1), z.literal("")]).transform((value) => value || undefined),
  stage: z.enum(["RECRUITER_SCREEN", "HIRING_MANAGER", "TECHNICAL_ROUND", "FINAL_ROUND", "OTHER"]),
  scheduledAt: z.string().trim().min(1).refine((value) => !Number.isNaN(new Date(value).getTime()), "Interview date is invalid."),
  outcome: z.enum(["PENDING", "PASSED", "FAILED", "CANCELLED"]),
  notes: optionalString(4000)
});

export function formToCompany(form: FormData) { return companyInput.parse({ ...Object.fromEntries(form), sectors: list(form.get("sectors")), hiringRegions: list(form.get("hiringRegions")) }); }
export function formToRole(form: FormData) { return roleInput.parse({ ...Object.fromEntries(form), requirements: list(form.get("requirements")), responsibilities: list(form.get("responsibilities")), salaryMin: form.get("salaryMin") || undefined, salaryMax: form.get("salaryMax") || undefined }); }
export function formToApplicationUpdate(form: FormData) { return applicationUpdateInput.parse({ ...Object.fromEntries(form), additionalInfo: form.get("additionalInfo") ?? "", submittedSalary: form.get("submittedSalary") || undefined }); }
export function formToRoleStatus(form: FormData) { return roleStatusInput.parse(Object.fromEntries(form)); }
export function formToScoreOverride(form: FormData) { return scoreOverrideInput.parse(Object.fromEntries(form)); }
export function formToNote(form: FormData) { return noteInput.parse(Object.fromEntries(form)); }
export function formToProject(form: FormData) { return projectInput.parse({ ...Object.fromEntries(form), stack: list(form.get("stack")), relevanceTags: list(form.get("relevanceTags")), caveats: list(form.get("caveats")) }); }
export function formToContact(form: FormData) { return contactInput.parse(Object.fromEntries(form)); }
export function formToInterview(form: FormData) { return interviewInput.parse(Object.fromEntries(form)); }
