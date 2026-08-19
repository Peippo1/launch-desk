import { describe, expect, it } from "vitest";
import {
  createLaunchPlanRecord,
  createCampaignProjectRecord,
  getWorkspaceHistory,
  getWorkspaceUsageSummary,
  resolveWorkspaceKey,
  type ProductRepositoryDb,
} from "../src/lib/product/repository";

function createDb(): ProductRepositoryDb {
  const state = {
    workspaces: [] as any[],
    launchPlans: [] as any[],
    campaignProjects: [] as any[],
    usage: [] as any[],
  };

  return {
    workspace: {
      async upsert({ where, create, update }: any) {
        const existing = state.workspaces.find((workspace) => workspace.clerkOrgId === where.clerkOrgId);
        if (existing) return Object.assign(existing, update);
        const workspace = { id: `workspace-${state.workspaces.length + 1}`, ...create };
        state.workspaces.push(workspace);
        return workspace;
      },
    },
    launchPlan: {
      async create({ data }: any) {
        const record = { id: `launch-${state.launchPlans.length + 1}`, createdAt: new Date("2026-08-18T12:00:00Z"), ...data };
        state.launchPlans.push(record);
        return record;
      },
      async findMany({ where }: any) {
        return state.launchPlans.filter((record) => record.workspaceId === where.workspaceId);
      },
    },
    campaignProject: {
      async create({ data }: any) {
        const record = { id: `campaign-${state.campaignProjects.length + 1}`, createdAt: new Date("2026-08-18T12:00:00Z"), ...data };
        state.campaignProjects.push(record);
        return record;
      },
      async findMany({ where }: any) {
        return state.campaignProjects.filter((record) => record.workspaceId === where.workspaceId);
      },
    },
    aiUsageEvent: {
      async create({ data }: any) {
        const record = { id: `usage-${state.usage.length + 1}`, createdAt: new Date("2026-08-18T12:00:00Z"), ...data };
        state.usage.push(record);
        return record;
      },
      async findMany({ where }: any) {
        return state.usage.filter((record) => record.workspaceId === where.workspaceId && record.createdAt >= where.createdAt.gte);
      },
    },
  };
}

describe("product workspace repository", () => {
  it("resolves Clerk organization workspaces before personal fallbacks", () => {
    expect(resolveWorkspaceKey({ userId: "user_1", orgId: "org_1", orgSlug: "team" })).toEqual({
      clerkOrgId: "org_1",
      name: "team",
    });

    expect(resolveWorkspaceKey({ userId: "user_1", orgId: null, orgSlug: null })).toEqual({
      clerkOrgId: "personal:user_1",
      name: "Personal workspace",
    });
  });

  it("keeps launch plans and campaigns scoped to the workspace", async () => {
    const db = createDb();
    const alpha = { userId: "user_a", orgId: "org_alpha", orgSlug: "alpha" };
    const beta = { userId: "user_b", orgId: "org_beta", orgSlug: "beta" };

    await createLaunchPlanRecord(db, alpha, {
      brief: { productBrief: "Launch a readiness dashboard for release teams.", audience: "Release leads", launchDate: "2026-09-01", constraints: "", availableAssets: "" },
      finalOutput: "Alpha plan",
      toolEvents: 4,
      textChars: 500,
    });
    await createCampaignProjectRecord(db, beta, {
      input: { brief: "Campaign", audience: "Marketers", product: "Desk", tone: "Clear", channels: ["Email"] },
      result: { concept: { name: "Beta", summary: "Summary", strategicRationale: "Reason" }, copyVariants: [], launchChecklist: [], imageDirections: [], images: [], settings: { textModel: "gpt-5.6", imageModel: "gpt-image-2", imageSize: "1024x1024", generatedImages: 0 } },
      generatedImages: 0,
    });

    const alphaHistory = await getWorkspaceHistory(db, alpha);
    expect(alphaHistory.launchPlans.map((record) => record.finalOutput)).toEqual(["Alpha plan"]);
    expect(alphaHistory.campaignProjects).toEqual([]);
  });

  it("summarizes usage for a workspace without including other workspaces", async () => {
    const db = createDb();
    const alpha = { userId: "user_a", orgId: "org_alpha", orgSlug: "alpha" };
    const beta = { userId: "user_b", orgId: "org_beta", orgSlug: "beta" };

    await createLaunchPlanRecord(db, alpha, {
      brief: { productBrief: "Launch a readiness dashboard for release teams.", audience: "Release leads", launchDate: "2026-09-01", constraints: "", availableAssets: "" },
      finalOutput: "Alpha plan",
      toolEvents: 3,
      textChars: 750,
    });
    await createLaunchPlanRecord(db, beta, {
      brief: { productBrief: "Launch another readiness dashboard.", audience: "Managers", launchDate: "2026-09-01", constraints: "", availableAssets: "" },
      finalOutput: "Beta plan",
      toolEvents: 3,
      textChars: 1000,
    });

    await expect(getWorkspaceUsageSummary(db, alpha, new Date("2026-08-18T12:00:00Z"))).resolves.toMatchObject({
      requestsThisMonth: 1,
      estimatedTextCharacters: 750,
      generatedImages: 0,
    });
  });
});
