import { describe, expect, it } from "vitest";
import {
  checkLaunchReadiness,
  draftChannelCopy,
  extractTasksFromBrief,
  findMissingDetails,
  generateOwnerChecklists
} from "../src/lib/launch-desk/deterministic-tools";
import { buildLaunchPrompt, launchPlanRequestSchema } from "../src/lib/launch-desk/agent";
import type { LaunchBrief } from "../src/lib/launch-desk/schema";

const brief: LaunchBrief = {
  productBrief: "Launch an engineering release readiness dashboard with QA evidence, feature flag rollout controls, metrics, and support notes for launch managers.",
  audience: "Engineering managers and product leads coordinating B2B SaaS releases.",
  launchDate: "2026-09-22",
  constraints: "Security approval is required before public launch.",
  availableAssets: "Screenshots, QA checklist, draft docs, and support FAQ."
};

describe("Launch Desk tools", () => {
  it("extracts prioritized tasks with owners and workstreams", () => {
    const tasks = extractTasksFromBrief(brief);

    expect(tasks.length).toBeGreaterThanOrEqual(4);
    expect(tasks[0].priority).toBe("P0");
    expect(tasks.some((task) => task.ownerRole === "Engineering lead")).toBe(true);
    expect(tasks.every((task) => task.title.length > 8)).toBe(true);
  });

  it("checks readiness and returns follow-up questions for missing details", () => {
    const sparse: LaunchBrief = { ...brief, constraints: "", availableAssets: "", productBrief: "Launch a new workflow for product teams with basic announcement copy." };
    const tasks = extractTasksFromBrief(sparse);
    const readiness = checkLaunchReadiness(sparse, tasks);
    const questions = findMissingDetails(sparse, readiness);

    expect(readiness).toHaveLength(5);
    expect(readiness.some((item) => item.status === "blocked")).toBe(true);
    expect(questions.some((question) => question.includes("constraints"))).toBe(true);
    expect(questions.some((question) => question.includes("assets"))).toBe(true);
  });

  it("generates owner checklists and channel-specific copy", () => {
    const tasks = extractTasksFromBrief(brief);
    const readiness = checkLaunchReadiness(brief, tasks);
    const checklists = generateOwnerChecklists(tasks, readiness);
    const copy = draftChannelCopy(brief);

    expect(checklists.some((item) => item.ownerRole === "Engineering lead")).toBe(true);
    expect(copy.map((item) => item.channel)).toEqual(["Email", "Blog", "In-app", "Social", "Sales enablement"]);
    expect(copy.every((item) => item.draft.length > 20)).toBe(true);
  });

  it("validates request payloads and delimits user-provided context in the prompt", () => {
    expect(launchPlanRequestSchema.safeParse({ brief }).success).toBe(true);
    expect(launchPlanRequestSchema.safeParse({ brief: { ...brief, productBrief: "Too short" } }).success).toBe(false);

    const prompt = buildLaunchPrompt(brief);
    expect(prompt).toContain("<product_brief>");
    expect(prompt).toContain("</available_assets>");
    expect(prompt).toContain("Security approval");
  });
});
