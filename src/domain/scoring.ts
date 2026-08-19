import type { Company, FitLabel, Role, RoleScore, TargetProfile } from "./types";

const weights = {
  roleFamily: 20,
  customer: 15,
  technical: 15,
  ai: 15,
  commercial: 10,
  probability: 10,
  company: 10,
  strategic: 5
} as const;

const customerTerms = ["customer", "stakeholder", "demo", "discovery", "workshop", "implementation"];
const technicalTerms = ["python", "api", "cloud", "fastapi", "typescript", "data", "integration"];
const aiTerms = ["llm", "agent", "ai", "evaluation", "observability", "mcp", "rag"];

export function scoreRole(role: Role, company: Company, profile: TargetProfile): RoleScore {
  const searchable = [
    role.title,
    role.summary,
    ...role.requirements,
    ...role.responsibilities,
    ...company.sectors
  ]
    .join(" ")
    .toLowerCase();

  const roleFamily = profile.roleFamilies.includes(role.roleFamily) ? 100 : role.roleFamily.includes("Software") ? 35 : 60;
  const deliveryRole = ["AI Deployment", "Forward Deployed Engineering", "Solutions Engineering", "Customer Engineering", "AI Consulting"].includes(role.roleFamily);
  const customer = deliveryRole ? Math.max(70, keywordScore(searchable, customerTerms)) : keywordScore(searchable, customerTerms);
  const technical = deliveryRole ? Math.max(60, keywordScore(searchable, technicalTerms)) : keywordScore(searchable, technicalTerms);
  const ai = keywordScore(searchable, aiTerms);
  const commercial = commercialScore(role, profile);
  const probability = probabilityScore(role);
  const companyScore = company.targetTier === "A" ? 95 : company.targetTier === "B" ? 78 : 55;
  const strategic = keywordScore(searchable, profile.keywords);

  const overall = Math.round(
    (roleFamily * weights.roleFamily +
      customer * weights.customer +
      technical * weights.technical +
      ai * weights.ai +
      commercial * weights.commercial +
      probability * weights.probability +
      companyScore * weights.company +
      strategic * weights.strategic) /
      100
  );

  return {
    roleId: role.id,
    overall,
    confidence: confidenceScore(role),
    label: fitLabel(overall),
    recommendation: recommendation(overall),
    strengths: buildStrengths({ roleFamily, customer, technical, ai, commercial, companyScore }),
    gaps: buildGaps({ customer, technical, ai, commercial, probability }),
    questions: buildQuestions(role),
    breakdown: {
      roleFamily,
      customer,
      technical,
      ai,
      commercial,
      probability,
      company: companyScore,
      strategic
    }
  };
}

function keywordScore(text: string, terms: string[]): number {
  const hits = terms.filter((term) => text.includes(term.toLowerCase())).length;
  return Math.min(100, Math.round((hits / Math.max(1, Math.min(terms.length, 5))) * 100));
}

function commercialScore(role: Role, profile: TargetProfile): number {
  if (role.employmentType === "Contract" || role.employmentType === "Fractional") return 82;
  if (!role.salaryMax) return 58;

  const salaryGbp = role.currency === "USD" ? role.salaryMax * 0.78 : role.currency === "EUR" ? role.salaryMax * 0.84 : role.salaryMax;
  if (salaryGbp >= profile.minimumSalaryGbp) return 95;
  if (salaryGbp >= profile.minimumSalaryGbp * 0.85) return 72;
  return 45;
}

function probabilityScore(role: Role): number {
  const seniorityPenalty = /principal|staff|director/i.test(role.title) ? 20 : 0;
  const stretchPenalty = role.requirements.some((requirement) => /phd|10\+ years|security clearance/i.test(requirement)) ? 25 : 0;
  return Math.max(35, 82 - seniorityPenalty - stretchPenalty);
}

function confidenceScore(role: Role): number {
  const fields = [role.summary, role.sourceUrl, role.location, role.requirements.join(" "), role.responsibilities.join(" ")];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function fitLabel(score: number): FitLabel {
  if (score >= 82) return "Strong Apply";
  if (score >= 68) return "Consider";
  if (score >= 54) return "Stretch";
  if (score >= 40) return "Low Fit";
  return "Avoid";
}

function recommendation(score: number): string {
  if (score >= 82) return "Prioritise today and prepare a tailored application.";
  if (score >= 68) return "Review requirements and shortlist if the company context is strong.";
  if (score >= 54) return "Treat as a stretch unless there is a warm contact or strategic reason.";
  return "Archive unless new information changes the fit.";
}

function buildStrengths(scores: Record<string, number>): string[] {
  const labels: Record<string, string> = {
    roleFamily: "Role family matches the target search wedge.",
    customer: "Customer-facing language is present.",
    technical: "Technical stack overlaps with the target profile.",
    ai: "AI deployment relevance is explicit.",
    commercial: "Commercial terms look worth attention.",
    companyScore: "Company is already a target."
  };

  return Object.entries(scores)
    .filter(([, score]) => score >= 70)
    .map(([key]) => labels[key])
    .filter(Boolean);
}

function buildGaps(scores: Record<string, number>): string[] {
  const labels: Record<string, string> = {
    customer: "Customer-facing depth needs validation.",
    technical: "Technical overlap is not yet strong from the posting.",
    ai: "AI relevance may be indirect.",
    commercial: "Salary or contract value needs clarification.",
    probability: "Requirements may make this a lower-probability application."
  };

  return Object.entries(scores)
    .filter(([, score]) => score < 60)
    .map(([key]) => labels[key])
    .filter(Boolean);
}

function buildQuestions(role: Role): string[] {
  const questions = ["What implementation ownership would this role have in the first 90 days?"];
  if (!role.salaryMax) questions.push("What salary or day-rate range is available?");
  if (role.remoteType !== "Remote") questions.push("How flexible is the location requirement?");
  return questions;
}
