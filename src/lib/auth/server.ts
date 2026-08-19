import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { WorkspaceIdentity } from "@/lib/product/repository";

export function getLocalE2EIdentityFromRequest(request?: Request): WorkspaceIdentity | null {
  if (!request || process.env.NODE_ENV === "production") return null;

  const expectedToken = process.env.LAUNCH_DESK_E2E_AUTH_TOKEN?.trim();
  if (!expectedToken) return null;

  const suppliedToken = request.headers.get("x-launch-desk-e2e-token");
  if (suppliedToken !== expectedToken) return null;

  return {
    userId: "local-e2e-user",
    orgId: "local-e2e-workspace",
    orgSlug: "Local E2E",
  };
}

export function shouldBypassLocalE2EDatabase(request?: Request): boolean {
  return Boolean(getLocalE2EIdentityFromRequest(request)) && process.env.LAUNCH_DESK_E2E_SKIP_DB === "1";
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return Boolean(session.userId);
}

export async function requireAuth(): Promise<void> {
  if (!await isAuthenticated()) redirect("/sign-in");
}

export async function getWorkspaceIdentity(request?: Request): Promise<WorkspaceIdentity | null> {
  const localIdentity = getLocalE2EIdentityFromRequest(request);
  if (localIdentity) return localIdentity;

  const session = await auth();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    orgId: session.orgId,
    orgSlug: session.orgSlug,
  };
}

export async function requireWorkspace(): Promise<WorkspaceIdentity> {
  const identity = await getWorkspaceIdentity();
  if (!identity) redirect("/sign-in");
  return identity;
}
