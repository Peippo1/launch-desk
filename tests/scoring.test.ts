import { describe, expect, it } from "vitest";
import { companies, roles, targetProfile } from "../src/data/seed";
import { scoreRole } from "../src/domain/scoring";

describe("scoreRole", () => {
  it("prioritises strong AI deployment and solutions roles", () => {
    const role = roles.find((candidate) => candidate.id === "role-002")!;
    const company = companies.find((candidate) => candidate.id === role.companyId)!;

    const score = scoreRole(role, company, targetProfile);

    expect(score.overall).toBeGreaterThanOrEqual(80);
    expect(score.label).toBe("Strong Apply");
    expect(score.strengths).toContain("AI deployment relevance is explicit.");
  });

  it("surfaces commercial uncertainty as a gap when salary is missing", () => {
    const baseRole = roles[0];
    const company = companies.find((candidate) => candidate.id === baseRole.companyId)!;
    const role = { ...baseRole, salaryMin: undefined, salaryMax: undefined };

    const score = scoreRole(role, company, targetProfile);

    expect(score.gaps).toContain("Salary or contract value needs clarification.");
    expect(score.questions).toContain("What salary or day-rate range is available?");
  });

  it("penalises unusually senior or clearance-heavy requirements", () => {
    const baseRole = roles[0];
    const company = companies.find((candidate) => candidate.id === baseRole.companyId)!;
    const role = {
      ...baseRole,
      title: "Principal AI Engineer",
      requirements: ["10+ years experience", "Security clearance"]
    };

    const score = scoreRole(role, company, targetProfile);

    expect(score.breakdown.probability).toBe(37);
    expect(score.gaps).toContain("Requirements may make this a lower-probability application.");
  });
});
