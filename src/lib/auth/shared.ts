export const AUTH_COOKIE = "nereid_scout_session";

export async function hashAccessToken(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function tokensMatch(suppliedToken: string, configuredToken: string): Promise<boolean> {
  if (!suppliedToken || !configuredToken) return false;
  const suppliedHash = await hashAccessToken(suppliedToken);
  const configuredHash = await hashAccessToken(configuredToken);

  if (suppliedHash.length !== configuredHash.length) return false;
  let mismatch = 0;
  for (let index = 0; index < configuredHash.length; index += 1) {
    mismatch |= configuredHash.charCodeAt(index) ^ suppliedHash.charCodeAt(index);
  }
  return mismatch === 0;
}
