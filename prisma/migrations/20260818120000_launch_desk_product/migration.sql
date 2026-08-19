CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "clerkOrgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdByClerkId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LaunchPlan" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "productBrief" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "launchDate" TEXT NOT NULL,
  "constraints" TEXT,
  "availableAssets" TEXT,
  "finalOutput" TEXT NOT NULL,
  "toolEvents" INTEGER NOT NULL DEFAULT 0,
  "textChars" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaunchPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignProject" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "brief" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "tone" TEXT NOT NULL,
  "channels" TEXT[],
  "result" JSONB NOT NULL,
  "generatedImages" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiUsageEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "estimatedTextChars" INTEGER NOT NULL DEFAULT 0,
  "generatedImages" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_clerkOrgId_key" ON "Workspace"("clerkOrgId");
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_clerkUserId_key" ON "WorkspaceMember"("workspaceId", "clerkUserId");
CREATE INDEX "WorkspaceMember_clerkUserId_idx" ON "WorkspaceMember"("clerkUserId");
CREATE INDEX "LaunchPlan_workspaceId_createdAt_idx" ON "LaunchPlan"("workspaceId", "createdAt");
CREATE INDEX "CampaignProject_workspaceId_createdAt_idx" ON "CampaignProject"("workspaceId", "createdAt");
CREATE INDEX "AiUsageEvent_workspaceId_createdAt_idx" ON "AiUsageEvent"("workspaceId", "createdAt");
CREATE INDEX "AiUsageEvent_feature_createdAt_idx" ON "AiUsageEvent"("feature", "createdAt");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaunchPlan" ADD CONSTRAINT "LaunchPlan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignProject" ADD CONSTRAINT "CampaignProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
