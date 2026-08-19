CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "TargetTier" AS ENUM ('A', 'B', 'C', 'ARCHIVE');
CREATE TYPE "WatchStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "RoleFamily" AS ENUM ('AI_DEPLOYMENT', 'FORWARD_DEPLOYED_ENGINEERING', 'SOLUTIONS_ENGINEERING', 'CUSTOMER_ENGINEERING', 'APPLIED_AI_ENGINEERING', 'AI_CONSULTING', 'TECHNICAL_PRODUCT_AI_PRODUCT', 'CONTRACT_FRACTIONAL_AI', 'PURE_SOFTWARE_ENGINEERING', 'GROWTH_OPERATOR', 'CUSTOMER_SUCCESS', 'OTHER');
CREATE TYPE "RemoteType" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE', 'FLEXIBLE');
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'FRACTIONAL');
CREATE TYPE "RoleStatus" AS ENUM ('NEW', 'REVIEWED', 'ARCHIVED');
CREATE TYPE "ApplicationStatus" AS ENUM ('DISCOVERED', 'SHORTLISTED', 'DRAFTING', 'APPLIED', 'RECRUITER_SCREEN', 'HIRING_MANAGER', 'TECHNICAL_ROUND', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');
CREATE TYPE "FitLabel" AS ENUM ('STRONG_APPLY', 'CONSIDER', 'STRETCH', 'LOW_FIT', 'AVOID');
CREATE TYPE "NoteScope" AS ENUM ('COMPANY', 'ROLE', 'APPLICATION', 'PROJECT');
CREATE TYPE "ReminderStatus" AS ENUM ('OPEN', 'DONE', 'DISMISSED');

CREATE TABLE "TargetProfile" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "roleFamilies" "RoleFamily"[], "keywords" TEXT[], "regions" TEXT[], "minimumSalaryGbp" INTEGER NOT NULL, "isDefault" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TargetProfile_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Company" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "normalizedName" TEXT NOT NULL, "websiteUrl" TEXT, "careersUrl" TEXT, "stage" TEXT, "sectors" TEXT[], "hiringRegions" TEXT[], "targetTier" "TargetTier" NOT NULL DEFAULT 'B', "watchStatus" "WatchStatus" NOT NULL DEFAULT 'ACTIVE', "rationale" TEXT, "lastCheckedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Company_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Role" ("id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "title" TEXT NOT NULL, "roleFamily" "RoleFamily" NOT NULL DEFAULT 'OTHER', "location" TEXT, "remoteType" "RemoteType" NOT NULL DEFAULT 'FLEXIBLE', "employmentType" "EmploymentType" NOT NULL DEFAULT 'PERMANENT', "salaryMin" INTEGER, "salaryMax" INTEGER, "currency" TEXT NOT NULL DEFAULT 'GBP', "sourcePlatform" TEXT, "sourceUrl" TEXT NOT NULL, "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "closingDate" TIMESTAMP(3), "status" "RoleStatus" NOT NULL DEFAULT 'NEW', "summary" TEXT, "requirements" TEXT[], "responsibilities" TEXT[], "rawSnapshot" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Role_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Score" ("id" TEXT NOT NULL, "roleId" TEXT NOT NULL, "targetProfileId" TEXT NOT NULL, "overall" INTEGER NOT NULL, "confidence" INTEGER NOT NULL, "label" "FitLabel" NOT NULL, "recommendation" TEXT NOT NULL, "strengths" TEXT[], "gaps" TEXT[], "questions" TEXT[], "breakdown" JSONB NOT NULL, "humanOverride" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Score_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Application" ("id" TEXT NOT NULL, "roleId" TEXT NOT NULL, "status" "ApplicationStatus" NOT NULL DEFAULT 'DISCOVERED', "applicationDate" TIMESTAMP(3), "cvVersion" TEXT, "submittedSalary" INTEGER, "submittedCurrency" TEXT, "followUpDate" TIMESTAMP(3), "nextAction" TEXT, "outcomeReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Application_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Project" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "summary" TEXT NOT NULL, "stack" TEXT[], "relevanceTags" TEXT[], "interviewStory" TEXT NOT NULL, "caveats" TEXT[], "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Project_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Note" ("id" TEXT NOT NULL, "body" TEXT NOT NULL, "scope" "NoteScope" NOT NULL, "companyId" TEXT, "roleId" TEXT, "applicationId" TEXT, "projectId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Note_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Reminder" ("id" TEXT NOT NULL, "applicationId" TEXT, "title" TEXT NOT NULL, "dueAt" TIMESTAMP(3) NOT NULL, "status" "ReminderStatus" NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Digest" ("id" TEXT NOT NULL, "content" TEXT NOT NULL, "inputCounts" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Digest_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ImportRun" ("id" TEXT NOT NULL, "kind" TEXT NOT NULL, "totalRows" INTEGER NOT NULL, "importedRows" INTEGER NOT NULL, "errors" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "Company_normalizedName_key" ON "Company"("normalizedName");
CREATE UNIQUE INDEX "Role_sourceUrl_key" ON "Role"("sourceUrl");
CREATE INDEX "Score_roleId_createdAt_idx" ON "Score"("roleId", "createdAt");
CREATE UNIQUE INDEX "Application_roleId_key" ON "Application"("roleId");
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Score" ADD CONSTRAINT "Score_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Score" ADD CONSTRAINT "Score_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "TargetProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
