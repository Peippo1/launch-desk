import { describe, expect, it } from "vitest";
import { hashAccessToken } from "../src/lib/auth/shared";

describe("access token sessions", () => {
  it("derives a stable non-plaintext session value", async () => {
    const first = await hashAccessToken("a-long-private-token");
    const second = await hashAccessToken("a-long-private-token");

    expect(first).toBe(second);
    expect(first).not.toContain("a-long-private-token");
    expect(first).toHaveLength(64);
  });

  it("changes the session value when the access token changes", async () => {
    expect(await hashAccessToken("token-a")).not.toBe(await hashAccessToken("token-b"));
  });
});
