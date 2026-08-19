import { NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getMonthlyQuota, getWorkspaceUsageSummary } from "@/lib/product/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const usage = await getWorkspaceUsageSummary(db, identity);
  return NextResponse.json({
    requestsThisMonth: usage.requestsThisMonth,
    estimatedTextCharacters: usage.estimatedTextCharacters,
    generatedImages: usage.generatedImages,
    quota: getMonthlyQuota(),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
