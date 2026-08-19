import { describe, expect, it } from "vitest";
import { renderDigest } from "../src/lib/digest";

describe("renderDigest", () => {
  it("uses human overrides for deterministic ranking and records input counts", () => {
    const result = renderDigest({
      generatedAt: new Date("2026-07-30T12:00:00Z"),
      roles: [
        { title: "Applied AI Engineer", company: { name: "Northstar" }, scores: [{ overall: 72, humanOverride: 61 }] },
        { title: "Forward Deployed Engineer", company: { name: "Signalworks" }, scores: [{ overall: 70, humanOverride: 88 }] }
      ],
      applications: [{ nextAction: "Send follow-up", role: { company: { name: "Northstar" } } }]
    });

    expect(result.content).toContain("**Forward Deployed Engineer** at Signalworks (88)");
    expect(result.content.indexOf("Signalworks")).toBeLessThan(result.content.indexOf("Northstar"));
    expect(result.inputCounts).toEqual({ roles: 2, highFit: 1, followUps: 1 });
  });
});
