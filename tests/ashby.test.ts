import { describe, expect, it } from "vitest";
import { AshbyAdapter } from "../src/lib/sources/ashby";

describe("Ashby adapter", () => {
  it("maps listed public postings into grounded role candidates", async () => {
    const adapter = new AshbyAdapter({
      boardName: "nereid",
      companyName: "Nereid",
      fetchImpl: async () => new Response(JSON.stringify({ jobs: [
        { title: " AI Engineer ", location: "London", department: "Engineering", team: "Applied AI", jobUrl: "https://jobs.ashbyhq.com/nereid/ai", isListed: true },
        { title: "Hidden role", location: "Remote", jobUrl: "https://jobs.ashbyhq.com/nereid/hidden", isListed: false }
      ] }), { status: 200, headers: { "Content-Type": "application/json" } })
    });

    await expect(adapter.discover()).resolves.toEqual({
      warnings: [],
      roles: [{ title: "AI Engineer", companyName: "Nereid", sourcePlatform: "ashby", sourceUrl: "https://jobs.ashbyhq.com/nereid/ai", location: "London", requirements: ["Engineering", "Applied AI"], responsibilities: [], rawSnapshot: expect.any(String) }]
    });
  });

  it("records malformed postings as warnings instead of aborting the board", async () => {
    const adapter = new AshbyAdapter({
      boardName: "nereid",
      companyName: "Nereid",
      fetchImpl: async () => new Response(JSON.stringify({ jobs: [{ location: "London", jobUrl: "https://jobs.ashbyhq.com/nereid/bad" }] }), { status: 200 })
    });

    await expect(adapter.discover()).resolves.toMatchObject({ roles: [], warnings: ["One Ashby posting could not be parsed."] });
  });
});
