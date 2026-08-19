import { requireAuth } from "@/lib/auth/server";
import { CampaignStudioClient } from "./studio-client";

export const dynamic = "force-dynamic";

export default async function CampaignStudioPage() {
  await requireAuth();
  return <CampaignStudioClient />;
}
