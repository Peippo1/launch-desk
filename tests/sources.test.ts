import { describe, expect, it } from "vitest";
import { normaliseRoleCandidate } from "../src/lib/sources/normalise";
import { runSourceAdapter } from "../src/lib/sources/runner";
import type { SourceAdapter } from "../src/lib/sources/types";

const candidate = {
  title: "  AI Engineer  ",
  companyName: "  Nereid  ",
  sourcePlatform: "  Greenhouse ",
  sourceUrl: " https://example.com/role ",
  location: " London ",
  summary: " Build things. ",
  requirements: [" TypeScript ", ""],
  responsibilities: [" Ship ", "  "],
  rawSnapshot: " raw posting "
};

describe("source adapter foundation", () => {
  it("normalises a source candidate without changing its evidence", () => {
    expect(normaliseRoleCandidate(candidate)).toEqual({
      title: "AI Engineer",
      companyName: "Nereid",
      sourcePlatform: "greenhouse",
      sourceUrl: "https://example.com/role",
      location: "London",
      summary: "Build things.",
      requirements: ["TypeScript"],
      responsibilities: ["Ship"],
      rawSnapshot: "raw posting"
    });
  });

  it("isolates a failing adapter so one source cannot stop a scout run", async () => {
    const adapter: SourceAdapter = {
      platform: "fixture",
      async discover() { throw new Error("network detail"); },
      async fetch() { return ""; },
      parse() { return candidate; },
      normalise: normaliseRoleCandidate,
      async healthCheck() { return false; }
    };

    await expect(runSourceAdapter(adapter)).resolves.toEqual({
      ok: false,
      platform: "fixture",
      error: "adapter-failure"
    });
  });
});
