import { describe, expect, it, vi } from "vitest";
import { checkFixedWindowLimit, enforceRequestContentLength, enforceSameOrigin, getClientIp, resetRateLimitBucket } from "../src/lib/security/request-guards";
import { getLocalE2EIdentityFromRequest, shouldBypassLocalE2EDatabase } from "../src/lib/auth/server";
import { tokensMatch } from "../src/lib/auth/shared";
import nextConfig from "../next.config";

describe("security request guards", () => {
  it("rejects oversized JSON requests before reading the body", () => {
    const request = new Request("https://app.test/api/campaign-studio", {
      method: "POST",
      headers: { "content-length": String(65_001) },
    });

    expect(enforceRequestContentLength(request, 65_000)).toEqual({
      ok: false,
      status: 413,
      message: "Request body is too large.",
    });
  });

  it("extracts a stable client key from forwarded headers", () => {
    const request = new Request("https://app.test/api/campaign-studio", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.2" },
    });

    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("rejects cross-origin state-changing requests", () => {
    const request = new Request("https://app.test/api/campaign-studio", {
      method: "POST",
      headers: { origin: "https://evil.test" },
    });

    expect(enforceSameOrigin(request)).toEqual({
      ok: false,
      status: 403,
      message: "Cross-origin requests are not allowed.",
    });
  });

  it("limits expensive AI requests per client in a fixed window", () => {
    vi.setSystemTime(new Date("2026-08-18T12:00:00Z"));
    resetRateLimitBucket("test-route");

    expect(checkFixedWindowLimit({ bucket: "test-route", key: "203.0.113.7", limit: 2, windowMs: 60_000 })).toEqual({ ok: true });
    expect(checkFixedWindowLimit({ bucket: "test-route", key: "203.0.113.7", limit: 2, windowMs: 60_000 })).toEqual({ ok: true });
    expect(checkFixedWindowLimit({ bucket: "test-route", key: "203.0.113.7", limit: 2, windowMs: 60_000 })).toEqual({
      ok: false,
      status: 429,
      message: "Too many requests. Try again shortly.",
      retryAfterSeconds: 60,
    });
  });

  it("compares access tokens without exposing raw token material", async () => {
    await expect(tokensMatch("correct-token", "correct-token")).resolves.toBe(true);
    await expect(tokensMatch("correct-token", "wrong-token")).resolves.toBe(false);
    await expect(tokensMatch("", "correct-token")).resolves.toBe(false);
  });

  it("allows local E2E identity only when the non-production token matches", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LAUNCH_DESK_E2E_AUTH_TOKEN", "test-only-token");

    const allowed = new Request("https://app.test/api/launch-desk/plan", {
      headers: { "x-launch-desk-e2e-token": "test-only-token" },
    });
    const denied = new Request("https://app.test/api/launch-desk/plan", {
      headers: { "x-launch-desk-e2e-token": "wrong-token" },
    });

    expect(getLocalE2EIdentityFromRequest(allowed)).toMatchObject({
      userId: "local-e2e-user",
      orgId: "local-e2e-workspace",
    });
    expect(getLocalE2EIdentityFromRequest(denied)).toBeNull();

    vi.stubEnv("NODE_ENV", "production");
    expect(getLocalE2EIdentityFromRequest(allowed)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("only skips database writes for explicitly enabled local E2E requests", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LAUNCH_DESK_E2E_AUTH_TOKEN", "test-only-token");

    const request = new Request("https://app.test/api/launch-desk/plan", {
      headers: { "x-launch-desk-e2e-token": "test-only-token" },
    });

    expect(shouldBypassLocalE2EDatabase(request)).toBe(false);
    vi.stubEnv("LAUNCH_DESK_E2E_SKIP_DB", "1");
    expect(shouldBypassLocalE2EDatabase(request)).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(shouldBypassLocalE2EDatabase(request)).toBe(false);
    vi.unstubAllEnvs();
  });

  it("sets a production security header baseline", async () => {
    const headers = await nextConfig.headers?.();
    const values = headers?.flatMap((entry) => entry.headers.map((header) => header.key)) ?? [];

    expect(values).toEqual(expect.arrayContaining([
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy",
    ]));
  });
});
