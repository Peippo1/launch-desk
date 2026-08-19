import type { ApplicationStatus, RoleFamily, RoleStatus, TargetTier, WatchStatus } from "@prisma/client";

export const roleFamilyLabels: Record<RoleFamily, string> = {
  AI_DEPLOYMENT: "AI Deployment", FORWARD_DEPLOYED_ENGINEERING: "Forward Deployed Engineering",
  SOLUTIONS_ENGINEERING: "Solutions Engineering", CUSTOMER_ENGINEERING: "Customer Engineering",
  APPLIED_AI_ENGINEERING: "Applied AI Engineering", AI_CONSULTING: "AI Consulting",
  TECHNICAL_PRODUCT_AI_PRODUCT: "Technical Product / AI Product", CONTRACT_FRACTIONAL_AI: "Contract / Fractional AI",
  PURE_SOFTWARE_ENGINEERING: "Pure Software Engineering", GROWTH_OPERATOR: "Growth / Operator",
  CUSTOMER_SUCCESS: "Customer Success", OTHER: "Other"
};

export const roleFamilies = Object.entries(roleFamilyLabels) as [RoleFamily, string][];
export const applicationStatuses = ["DISCOVERED", "SHORTLISTED", "DRAFTING", "APPLIED", "RECRUITER_SCREEN", "HIRING_MANAGER", "TECHNICAL_ROUND", "FINAL_ROUND", "OFFER", "REJECTED", "WITHDRAWN", "ARCHIVED"] as ApplicationStatus[];
export const applicationStatusLabels: Record<ApplicationStatus, string> = Object.fromEntries(applicationStatuses.map((status) => [status, status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())])) as Record<ApplicationStatus, string>;
export const roleStatuses = ["NEW", "REVIEWED", "ARCHIVED"] as RoleStatus[];
export const targetTiers = ["A", "B", "C", "ARCHIVE"] as TargetTier[];
export const watchStatuses = ["ACTIVE", "PAUSED", "ARCHIVED"] as WatchStatus[];

export function readable(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not set";
}

export function normaliseCompanyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
