import { describe, expect, it } from "vitest";
import { canTransitionApplicationStatus } from "../src/lib/workflow";

describe("application workflow", () => {
  it("allows forward progression and terminal outcomes", () => {
    expect(canTransitionApplicationStatus("APPLIED", "RECRUITER_SCREEN")).toBe(true);
    expect(canTransitionApplicationStatus("FINAL_ROUND", "OFFER")).toBe(true);
    expect(canTransitionApplicationStatus("APPLIED", "WITHDRAWN")).toBe(true);
  });

  it("rejects skipping stages", () => {
    expect(canTransitionApplicationStatus("DISCOVERED", "FINAL_ROUND")).toBe(false);
    expect(canTransitionApplicationStatus("RECRUITER_SCREEN", "DRAFTING")).toBe(false);
  });

  it("keeps terminal outcomes terminal", () => {
    expect(canTransitionApplicationStatus("REJECTED", "APPLIED")).toBe(false);
    expect(canTransitionApplicationStatus("WITHDRAWN", "OFFER")).toBe(false);
    expect(canTransitionApplicationStatus("OFFER", "TECHNICAL_ROUND")).toBe(false);
  });
});
