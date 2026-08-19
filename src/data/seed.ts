import type { Application, Company, Project, Role, TargetProfile } from "../domain/types";

export const targetProfile: TargetProfile = {
  id: "ai-deployment-builder",
  name: "AI Deployment Builder",
  roleFamilies: ["AI Deployment", "Forward Deployed Engineering", "Solutions Engineering", "Customer Engineering", "AI Consulting"],
  keywords: ["implementation", "enterprise", "stakeholder", "llm", "agent", "mcp", "evaluation", "prototype"],
  regions: ["UK", "EMEA", "US remote", "Australia"],
  minimumSalaryGbp: 80000
};

export const companies: Company[] = [
  {
    id: "arize",
    name: "Arize AI",
    websiteUrl: "https://arize.com",
    careersUrl: "https://arize.com/careers",
    stage: "Series B",
    sectors: ["AI observability", "LLM evaluation"],
    hiringRegions: ["US remote", "EMEA"],
    targetTier: "A",
    watchStatus: "Active",
    rationale: "Strong overlap with evaluation, observability, and customer-facing AI adoption.",
    lastCheckedAt: "2026-07-30"
  },
  {
    id: "camunda",
    name: "Camunda",
    websiteUrl: "https://camunda.com",
    careersUrl: "https://camunda.com/careers",
    stage: "Growth",
    sectors: ["process automation", "enterprise workflow"],
    hiringRegions: ["UK", "EMEA"],
    targetTier: "A",
    watchStatus: "Active",
    rationale: "Enterprise automation plus implementation work could map well to Nereid's operating thesis.",
    lastCheckedAt: "2026-07-30"
  },
  {
    id: "permutive",
    name: "Permutive",
    websiteUrl: "https://permutive.com",
    careersUrl: "https://permutive.com/careers",
    stage: "Series B",
    sectors: ["adtech", "data infrastructure"],
    hiringRegions: ["UK", "EMEA"],
    targetTier: "B",
    watchStatus: "Active",
    rationale: "Relevant solutions and customer engineering surface, with a less direct AI wedge.",
    lastCheckedAt: "2026-07-29"
  }
];

export const roles: Role[] = [
  {
    id: "role-001",
    companyId: "camunda",
    title: "Forward Deployed Engineer, AI",
    roleFamily: "Forward Deployed Engineering",
    location: "London or Remote EMEA",
    remoteType: "Flexible",
    employmentType: "Permanent",
    salaryMin: 85000,
    salaryMax: 105000,
    currency: "GBP",
    sourcePlatform: "Company careers",
    sourceUrl: "https://example.com/camunda-forward-deployed-ai",
    discoveredAt: "2026-07-30",
    status: "New",
    summary: "Own customer discovery, rapid prototypes, APIs, and enterprise AI workflow implementations.",
    requirements: ["Python or TypeScript", "Customer workshops", "Cloud APIs", "Enterprise stakeholder management"],
    responsibilities: ["Prototype AI workflow automations", "Run discovery with customers", "Translate requirements into production plans"]
  },
  {
    id: "role-002",
    companyId: "arize",
    title: "AI Solutions Engineer",
    roleFamily: "Solutions Engineering",
    location: "Remote EMEA",
    remoteType: "Remote",
    employmentType: "Permanent",
    salaryMin: 90000,
    salaryMax: 120000,
    currency: "GBP",
    sourcePlatform: "Ashby",
    sourceUrl: "https://example.com/arize-ai-solutions-engineer",
    discoveredAt: "2026-07-30",
    status: "New",
    summary: "Help enterprise teams evaluate LLM applications, debug model behaviour, and deploy observability workflows.",
    requirements: ["LLM evaluation", "Python", "APIs", "Customer demos", "Observability"],
    responsibilities: ["Deliver technical demos", "Advise customers on AI evaluation", "Partner with product on feedback loops"]
  },
  {
    id: "role-003",
    companyId: "permutive",
    title: "Technical Customer Engineer",
    roleFamily: "Customer Engineering",
    location: "London hybrid",
    remoteType: "Hybrid",
    employmentType: "Permanent",
    salaryMin: 70000,
    salaryMax: 82000,
    currency: "GBP",
    sourcePlatform: "Greenhouse",
    sourceUrl: "https://example.com/permutive-technical-customer-engineer",
    discoveredAt: "2026-07-29",
    status: "Reviewed",
    summary: "Support technical customers with data integrations, APIs, implementation planning, and stakeholder enablement.",
    requirements: ["Customer implementation", "SQL", "APIs", "Data platforms"],
    responsibilities: ["Lead onboarding", "Debug integration issues", "Coordinate with product and engineering"]
  }
];

export const applications: Application[] = [
  {
    id: "app-001",
    roleId: "role-003",
    status: "Applied",
    applicationDate: "2026-07-23",
    followUpDate: "2026-07-31",
    nextAction: "Send a concise follow-up if no response by tomorrow."
  }
];

export const projects: Project[] = [
  {
    id: "fabric-mcp",
    name: "Claude x Microsoft Fabric MCP",
    summary: "Built an MCP workflow connecting AI assistance to enterprise data and analytics surfaces.",
    stack: ["MCP", "Claude", "Microsoft Fabric", "APIs"],
    relevanceTags: ["mcp", "enterprise", "implementation", "stakeholder"],
    interviewStory: "Use when a role needs practical agent tooling, enterprise context, and careful integration framing.",
    caveats: ["Avoid overstating production ownership if the deployment scope was exploratory."]
  },
  {
    id: "gfr-calendar",
    name: "GFR Calendar / Regulatory Platform",
    summary: "Created tooling around regulatory workflows, deadlines, and operational clarity.",
    stack: ["TypeScript", "React", "workflow automation"],
    relevanceTags: ["enterprise", "workflow", "stakeholder", "delivery"],
    interviewStory: "Useful for explaining how messy operating processes become reliable product workflows.",
    caveats: ["Clarify domain context quickly before diving into implementation details."]
  },
  {
    id: "jisc-ai-discovery",
    name: "Jisc AI Discovery",
    summary: "Ran AI discovery and stakeholder work to turn ambiguous needs into practical implementation options.",
    stack: ["Discovery", "AI strategy", "stakeholder interviews"],
    relevanceTags: ["customer", "discovery", "stakeholder", "ai"],
    interviewStory: "Best fit for roles needing consultative discovery and translation between users and technical delivery.",
    caveats: ["Anchor claims in specific workshops, outputs, and decisions."]
  }
];
