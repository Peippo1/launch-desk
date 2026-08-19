import type { SourceRoleCandidate } from "./types";

export function normaliseRoleCandidate(candidate: SourceRoleCandidate): SourceRoleCandidate {
  return {
    ...candidate,
    title: candidate.title.trim(),
    companyName: candidate.companyName.trim(),
    sourcePlatform: candidate.sourcePlatform.trim().toLowerCase(),
    sourceUrl: candidate.sourceUrl.trim(),
    location: candidate.location?.trim() || undefined,
    summary: candidate.summary?.trim() || undefined,
    requirements: candidate.requirements.map((item) => item.trim()).filter(Boolean),
    responsibilities: candidate.responsibilities.map((item) => item.trim()).filter(Boolean),
    rawSnapshot: candidate.rawSnapshot.trim(),
  };
}
