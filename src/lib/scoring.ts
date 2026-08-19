import type { Company, Role, TargetProfile } from "@prisma/client";
import { scoreRole } from "@/domain/scoring";
import type { RoleFamily } from "@/domain/types";

const roleFamily: Record<string, RoleFamily> = {
  AI_DEPLOYMENT: "AI Deployment", FORWARD_DEPLOYED_ENGINEERING: "Forward Deployed Engineering", SOLUTIONS_ENGINEERING: "Solutions Engineering", CUSTOMER_ENGINEERING: "Customer Engineering", APPLIED_AI_ENGINEERING: "Applied AI Engineering", AI_CONSULTING: "AI Consulting", TECHNICAL_PRODUCT_AI_PRODUCT: "Technical Product / AI Product", CONTRACT_FRACTIONAL_AI: "Contract / Fractional AI", PURE_SOFTWARE_ENGINEERING: "Pure Software Engineering", GROWTH_OPERATOR: "Growth / Operator", CUSTOMER_SUCCESS: "Customer Success", OTHER: "Other"
};

export function calculateScore(role: Role, company: Company, profile: TargetProfile) {
  return scoreRole(
    {
      id: role.id, companyId: role.companyId, title: role.title, roleFamily: roleFamily[role.roleFamily], location: role.location ?? "",
      remoteType: role.remoteType.replace("_", "-") as "Remote" | "Hybrid" | "On-site" | "Flexible",
      employmentType: readableEmployment(role.employmentType), salaryMin: role.salaryMin ?? undefined, salaryMax: role.salaryMax ?? undefined,
      currency: role.currency as "GBP" | "USD" | "EUR" | "AUD", sourcePlatform: role.sourcePlatform ?? "Manual", sourceUrl: role.sourceUrl,
      discoveredAt: role.discoveredAt.toISOString(), closingDate: role.closingDate?.toISOString(), status: readableRoleStatus(role.status), summary: role.summary ?? "",
      requirements: role.requirements, responsibilities: role.responsibilities
    },
    {
      id: company.id, name: company.name, websiteUrl: company.websiteUrl ?? "", careersUrl: company.careersUrl ?? "", stage: company.stage ?? "",
      sectors: company.sectors, hiringRegions: company.hiringRegions, targetTier: company.targetTier === "ARCHIVE" ? "Archive" : company.targetTier,
      watchStatus: company.watchStatus === "ACTIVE" ? "Active" : company.watchStatus === "PAUSED" ? "Paused" : "Archived", rationale: company.rationale ?? "", lastCheckedAt: company.lastCheckedAt?.toISOString() ?? ""
    },
    { id: profile.id, name: profile.name, roleFamilies: profile.roleFamilies.map((value) => roleFamily[value]), keywords: profile.keywords, regions: profile.regions, minimumSalaryGbp: profile.minimumSalaryGbp }
  );
}

function readableEmployment(value: string): "Permanent" | "Contract" | "Fractional" { return value.charAt(0) + value.slice(1).toLowerCase() as "Permanent" | "Contract" | "Fractional"; }
function readableRoleStatus(value: string): "New" | "Reviewed" | "Archived" { return value.charAt(0) + value.slice(1).toLowerCase() as "New" | "Reviewed" | "Archived"; }
