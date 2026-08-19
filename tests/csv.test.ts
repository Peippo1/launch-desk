import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/lib/csv";

describe("parseCsv", () => {
  it("parses quoted commas and escaped quotes", () => {
    const result = parseCsv('name,rationale\n"Example, Inc","Says ""AI"" on the tin"');

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([{ name: "Example, Inc", rationale: 'Says "AI" on the tin' }]);
  });

  it("reports malformed rows without dropping valid rows", () => {
    const result = parseCsv('name,websiteUrl\nValid,https://example.com\n"Broken,https://bad.example');

    expect(result.rows).toEqual([{ name: "Valid", websiteurl: "https://example.com" }]);
    expect(result.errors).toEqual([{ row: 3, reason: "Unclosed quoted field." }]);
  });
});
