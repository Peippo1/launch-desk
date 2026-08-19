import type { CampaignStudioInput, CampaignStudioResult } from "@/lib/campaign-studio";
import type { LaunchBrief } from "@/lib/launch-desk/schema";

export type WorkspaceIdentity = {
  userId: string;
  orgId?: string | null;
  orgSlug?: string | null;
};

export type ProductRepositoryDb = {
  workspace: {
    upsert(args: {
      where: { clerkOrgId: string };
      create: { clerkOrgId: string; name: string; createdByClerkId: string };
      update: { name: string };
    }): Promise<{ id: string; clerkOrgId: string; name: string }>;
  };
  launchPlan: {
    create(args: { data: Record<string, unknown> }): Promise<any>;
    findMany(args: { where: { workspaceId: string }; orderBy?: { createdAt: "desc" }; take?: number }): Promise<any[]>;
  };
  campaignProject: {
    create(args: { data: Record<string, unknown> }): Promise<any>;
    findMany(args: { where: { workspaceId: string }; orderBy?: { createdAt: "desc" }; take?: number }): Promise<any[]>;
  };
  aiUsageEvent: {
    create(args: { data: Record<string, unknown> }): Promise<any>;
    findMany(args: { where: { workspaceId: string; createdAt: { gte: Date } } }): Promise<Array<{ estimatedTextChars: number; generatedImages: number }>>;
  };
};

export type LaunchPlanCreateInput = {
  brief: LaunchBrief;
  finalOutput: string;
  toolEvents: number;
  textChars: number;
};

export type CampaignProjectCreateInput = {
  input: CampaignStudioInput;
  result: CampaignStudioResult;
  generatedImages: number;
};

export function resolveWorkspaceKey(identity: WorkspaceIdentity) {
  if (identity.orgId) {
    return { clerkOrgId: identity.orgId, name: identity.orgSlug || "Team workspace" };
  }
  return { clerkOrgId: `personal:${identity.userId}`, name: "Personal workspace" };
}

export async function ensureWorkspace(db: ProductRepositoryDb, identity: WorkspaceIdentity) {
  const key = resolveWorkspaceKey(identity);
  return db.workspace.upsert({
    where: { clerkOrgId: key.clerkOrgId },
    create: { clerkOrgId: key.clerkOrgId, name: key.name, createdByClerkId: identity.userId },
    update: { name: key.name },
  });
}

export async function createLaunchPlanRecord(db: ProductRepositoryDb, identity: WorkspaceIdentity, input: LaunchPlanCreateInput) {
  const workspace = await ensureWorkspace(db, identity);
  const record = await db.launchPlan.create({
    data: {
      workspaceId: workspace.id,
      createdBy: identity.userId,
      productBrief: input.brief.productBrief,
      audience: input.brief.audience,
      launchDate: input.brief.launchDate,
      constraints: input.brief.constraints || null,
      availableAssets: input.brief.availableAssets || null,
      finalOutput: input.finalOutput,
      toolEvents: input.toolEvents,
      textChars: input.textChars,
    },
  });
  await logAiUsage(db, identity, { feature: "launch-desk", estimatedTextChars: input.textChars, generatedImages: 0 });
  return record;
}

export async function createCampaignProjectRecord(db: ProductRepositoryDb, identity: WorkspaceIdentity, input: CampaignProjectCreateInput) {
  const workspace = await ensureWorkspace(db, identity);
  const record = await db.campaignProject.create({
    data: {
      workspaceId: workspace.id,
      createdBy: identity.userId,
      brief: input.input.brief,
      audience: input.input.audience,
      product: input.input.product,
      tone: input.input.tone,
      channels: input.input.channels,
      result: input.result,
      generatedImages: input.generatedImages,
    },
  });
  await logAiUsage(db, identity, {
    feature: "campaign-studio",
    estimatedTextChars: JSON.stringify(input.result).length,
    generatedImages: input.generatedImages,
  });
  return record;
}

export async function getWorkspaceHistory(db: ProductRepositoryDb, identity: WorkspaceIdentity) {
  const workspace = await ensureWorkspace(db, identity);
  const [launchPlans, campaignProjects] = await Promise.all([
    db.launchPlan.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.campaignProject.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { workspace, launchPlans, campaignProjects };
}

export async function logAiUsage(db: ProductRepositoryDb, identity: WorkspaceIdentity, usage: { feature: string; estimatedTextChars: number; generatedImages: number }) {
  const workspace = await ensureWorkspace(db, identity);
  return db.aiUsageEvent.create({
    data: {
      workspaceId: workspace.id,
      createdBy: identity.userId,
      feature: usage.feature,
      estimatedTextChars: usage.estimatedTextChars,
      generatedImages: usage.generatedImages,
    },
  });
}

export async function getWorkspaceUsageSummary(db: ProductRepositoryDb, identity: WorkspaceIdentity, now = new Date()) {
  const workspace = await ensureWorkspace(db, identity);
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const events = await db.aiUsageEvent.findMany({ where: { workspaceId: workspace.id, createdAt: { gte: startOfMonth } } });
  return {
    workspace,
    requestsThisMonth: events.length,
    estimatedTextCharacters: events.reduce((sum, event) => sum + event.estimatedTextChars, 0),
    generatedImages: events.reduce((sum, event) => sum + event.generatedImages, 0),
  };
}

export function getMonthlyQuota() {
  const raw = Number(process.env.LAUNCH_DESK_MONTHLY_AI_REQUEST_LIMIT ?? 100);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
}

export async function assertWorkspaceWithinQuota(db: ProductRepositoryDb, identity: WorkspaceIdentity, now = new Date()) {
  const usage = await getWorkspaceUsageSummary(db, identity, now);
  const quota = getMonthlyQuota();
  if (usage.requestsThisMonth >= quota) {
    return { ok: false as const, status: 429 as const, message: "Workspace AI quota exceeded for this month.", usage, quota };
  }
  return { ok: true as const, usage, quota };
}
