import { requireAuth } from "@/lib/auth/server";
import { LaunchDeskClient } from "./launch-desk-client";

export const dynamic = "force-dynamic";

export default async function LaunchDeskPage() {
  await requireAuth();
  return <LaunchDeskClient />;
}
