import { db } from "@/lib/db";
import type { Prisma, TargetTier, WatchStatus } from "@prisma/client";

export type CompanyFilters = {
  targetTier?: TargetTier;
  watchStatus?: WatchStatus;
  sector?: string;
  region?: string;
};

export async function getDefaultProfile() {
  return db.targetProfile.findFirstOrThrow({ where: { isDefault: true } });
}

export async function getCompanies(filters: CompanyFilters = {}) {
  const where: Prisma.CompanyWhereInput = {
    ...(filters.targetTier ? { targetTier: filters.targetTier } : {}),
    ...(filters.watchStatus ? { watchStatus: filters.watchStatus } : {}),
    ...(filters.sector ? { sectors: { has: filters.sector } } : {}),
    ...(filters.region ? { hiringRegions: { has: filters.region } } : {})
  };
  return db.company.findMany({ where, include: { notes: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: [{ targetTier: "asc" }, { name: "asc" }] });
}

export async function getCompanyFacets() {
  const companies = await db.company.findMany({ select: { sectors: true, hiringRegions: true } });
  return {
    sectors: [...new Set(companies.flatMap((company) => company.sectors))].sort(),
    regions: [...new Set(companies.flatMap((company) => company.hiringRegions))].sort()
  };
}

export async function getActiveCompanies() {
  return db.company.findMany({ where: { watchStatus: "ACTIVE" }, orderBy: { name: "asc" } });
}

export async function getRolesOverview() {
  return db.role.findMany({ include: { company: true, scores: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { discoveredAt: "desc" } });
}

export async function getApplications() {
  return db.application.findMany({ include: { role: { include: { company: true } }, notes: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
}

export async function getProjects() {
  return db.project.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function getContacts() {
  return db.contact.findMany({ include: { company: true }, orderBy: [{ company: { name: "asc" } }, { name: "asc" }] });
}

export async function getInterviews() {
  return db.interview.findMany({ include: { role: { include: { company: true } }, application: true }, orderBy: { scheduledAt: "asc" } });
}

export async function getLatestDigest() {
  return db.digest.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function getCompanyById(id: string) {
  return db.company.findUniqueOrThrow({ where: { id } });
}

export async function getRoleById(id: string) {
  return db.role.findUniqueOrThrow({ where: { id } });
}

export async function getRoleWithCompany(id: string) {
  return db.role.findUniqueOrThrow({ where: { id }, include: { company: true } });
}

export async function getLatestScore(roleId: string) {
  return db.score.findFirst({ where: { roleId }, orderBy: { createdAt: "desc" } });
}

export async function getLatestScoreOrThrow(roleId: string) {
  return db.score.findFirstOrThrow({ where: { roleId }, orderBy: { createdAt: "desc" } });
}

export async function getApplicationById(id: string) {
  return db.application.findUniqueOrThrow({ where: { id }, include: { role: { include: { company: true } } } });
}

export async function getDigestInputs(now: Date) {
  return Promise.all([
    db.role.findMany({ where: { status: { not: "ARCHIVED" } }, include: { company: true, scores: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    db.application.findMany({ where: { followUpDate: { lte: now } }, include: { role: { include: { company: true } } } })
  ]);
}

export async function getDashboard(now = new Date()) {
  const [roles, applications, companies, projects, interviews] = await Promise.all([
    db.role.findMany({ where: { status: { not: "ARCHIVED" } }, include: { company: true, scores: { orderBy: { createdAt: "desc" }, take: 1 }, application: true }, orderBy: { discoveredAt: "desc" } }),
    db.application.findMany({ include: { role: { include: { company: true } } }, orderBy: { updatedAt: "desc" } }),
    db.company.count({ where: { watchStatus: "ACTIVE" } }),
    db.project.findMany({ orderBy: { updatedAt: "desc" } }),
    db.interview.findMany({ where: { scheduledAt: { gte: now }, outcome: "PENDING" }, include: { role: { include: { company: true } } }, orderBy: { scheduledAt: "asc" } })
  ]);
  return { roles, applications, companyCount: companies, projects, interviews };
}

export async function getRoleDetail(id: string) {
  return db.role.findUnique({
    where: { id },
    include: { company: true, application: true, scores: { orderBy: { createdAt: "desc" } }, notes: { orderBy: { createdAt: "desc" } } }
  });
}

export async function getAnalytics() {
  const [applications, roles] = await Promise.all([
    db.application.findMany({ include: { role: true } }),
    db.role.findMany({ where: { status: { not: "ARCHIVED" } }, include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } } })
  ]);
  return { applications, roles };
}
