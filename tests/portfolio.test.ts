import { describe, expect, it } from "vitest";
import { matchProjectsToRole } from "../src/lib/portfolio";

describe("matchProjectsToRole", () => {
  it("ranks explicit relevance signals and keeps the result grounded in project data", () => {
    const result = matchProjectsToRole(
      {
        title: "AI Solutions Engineer",
        roleFamily: "SOLUTIONS_ENGINEERING",
        summary: "Help customers evaluate enterprise AI workflows.",
        requirements: ["Customer demos", "APIs", "LLM evaluation"],
        responsibilities: ["Run stakeholder workshops"]
      },
      [
        { id: "project-a", name: "AI Discovery", summary: "Ran practical AI discovery.", stack: ["Discovery"], relevanceTags: ["ai", "customer", "stakeholder"], interviewStory: "Translate ambiguity into delivery.", caveats: ["Anchor claims in workshop outputs."] },
        { id: "project-b", name: "Calendar", summary: "Built workflow tooling.", stack: ["TypeScript"], relevanceTags: ["workflow"], interviewStory: "Explain reliable operating processes.", caveats: [] }
      ]
    );

    expect(result[0]).toMatchObject({ project: { id: "project-a" }, matchedTags: ["ai", "customer", "stakeholder"] });
    expect(result[0].pitch).toContain("AI Discovery");
    expect(result[0].technicalAngle).toContain("Discovery");
    expect(result[0].stakeholderAngle).toContain("Translate ambiguity");
    expect(result[0].objections).toEqual(["Anchor claims in workshop outputs."]);
    expect(result[1].project.id).toBe("project-b");
  });
});
