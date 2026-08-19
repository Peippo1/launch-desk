import { PrismaClient, type RoleFamily, type TargetTier } from "@prisma/client";
import { applications, companies, projects, roles, targetProfile } from "../src/data/seed";

const prisma = new PrismaClient();

const roleFamily: Record<string, RoleFamily> = {
  "AI Deployment": "AI_DEPLOYMENT",
  "Forward Deployed Engineering": "FORWARD_DEPLOYED_ENGINEERING",
  "Solutions Engineering": "SOLUTIONS_ENGINEERING",
  "Customer Engineering": "CUSTOMER_ENGINEERING",
  "AI Consulting": "AI_CONSULTING"
};

async function main() {
  await prisma.note.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.application.deleteMany();
  await prisma.score.deleteMany();
  await prisma.role.deleteMany();
  await prisma.company.deleteMany();
  await prisma.project.deleteMany();
  await prisma.targetProfile.deleteMany();

  const profile = await prisma.targetProfile.create({
    data: {
      name: targetProfile.name,
      roleFamilies: targetProfile.roleFamilies.map((value) => roleFamily[value] ?? "OTHER"),
      keywords: targetProfile.keywords,
      regions: targetProfile.regions,
      minimumSalaryGbp: targetProfile.minimumSalaryGbp,
      isDefault: true
    }
  });

  for (const company of companies) {
    await prisma.company.create({
      data: {
        id: company.id,
        name: company.name,
        normalizedName: company.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        websiteUrl: company.websiteUrl,
        careersUrl: company.careersUrl,
        stage: company.stage,
        sectors: company.sectors,
        hiringRegions: company.hiringRegions,
        targetTier: company.targetTier as TargetTier,
        watchStatus: company.watchStatus.toUpperCase() as "ACTIVE" | "PAUSED" | "ARCHIVED",
        rationale: company.rationale,
        lastCheckedAt: new Date(company.lastCheckedAt)
      }
    });
  }

  for (const role of roles) {
    await prisma.role.create({
      data: {
        id: role.id,
        companyId: role.companyId,
        title: role.title,
        roleFamily: roleFamily[role.roleFamily] ?? "OTHER",
        location: role.location,
        remoteType: role.remoteType.replace("-", "_").toUpperCase() as "REMOTE" | "HYBRID" | "ON_SITE" | "FLEXIBLE",
        employmentType: role.employmentType.toUpperCase() as "PERMANENT" | "CONTRACT" | "FRACTIONAL",
        salaryMin: role.salaryMin,
        salaryMax: role.salaryMax,
        currency: role.currency,
        sourcePlatform: role.sourcePlatform,
        sourceUrl: role.sourceUrl,
        discoveredAt: new Date(role.discoveredAt),
        closingDate: role.closingDate ? new Date(role.closingDate) : undefined,
        status: role.status.toUpperCase() as "NEW" | "REVIEWED" | "ARCHIVED",
        summary: role.summary,
        requirements: role.requirements,
        responsibilities: role.responsibilities,
        rawSnapshot: [role.summary, ...role.requirements, ...role.responsibilities].join("\n")
      }
    });
  }

  for (const application of applications) {
    await prisma.application.create({
      data: {
        id: application.id,
        roleId: application.roleId,
        status: application.status.replace(/ /g, "_").toUpperCase() as "APPLIED",
        applicationDate: application.applicationDate ? new Date(application.applicationDate) : undefined,
        followUpDate: application.followUpDate ? new Date(application.followUpDate) : undefined,
        nextAction: application.nextAction
      }
    });
  }

  await prisma.project.createMany({ data: projects });
  console.log(`Seeded ${profile.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
