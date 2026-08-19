import type { ApplicationStatus } from "@prisma/client";

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  DISCOVERED: ["SHORTLISTED", "ARCHIVED"],
  SHORTLISTED: ["DRAFTING", "APPLIED", "WITHDRAWN", "ARCHIVED"],
  DRAFTING: ["APPLIED", "WITHDRAWN", "ARCHIVED"],
  APPLIED: ["RECRUITER_SCREEN", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  RECRUITER_SCREEN: ["HIRING_MANAGER", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  HIRING_MANAGER: ["TECHNICAL_ROUND", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  TECHNICAL_ROUND: ["FINAL_ROUND", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  FINAL_ROUND: ["OFFER", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  OFFER: ["REJECTED", "WITHDRAWN", "ARCHIVED"],
  REJECTED: ["SHORTLISTED", "ARCHIVED"],
  WITHDRAWN: ["SHORTLISTED", "ARCHIVED"],
  ARCHIVED: ["SHORTLISTED"]
};

export function canTransitionApplicationStatus(current: ApplicationStatus, next: ApplicationStatus) {
  return current === next || transitions[current].includes(next);
}
