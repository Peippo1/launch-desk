export type RoleFamily =
  | "AI Deployment"
  | "Forward Deployed Engineering"
  | "Solutions Engineering"
  | "Customer Engineering"
  | "Applied AI Engineering"
  | "AI Consulting"
  | "Technical Product / AI Product"
  | "Contract / Fractional AI"
  | "Pure Software Engineering"
  | "Growth / Operator"
  | "Customer Success"
  | "Other";

export type ApplicationStatus =
  | "Discovered"
  | "Shortlisted"
  | "Drafting"
  | "Applied"
  | "Recruiter screen"
  | "Hiring manager"
  | "Technical round"
  | "Final round"
  | "Offer"
  | "Rejected"
  | "Withdrawn"
  | "Archived";

export type FitLabel = "Strong Apply" | "Consider" | "Stretch" | "Low Fit" | "Avoid";

export interface TargetProfile {
  id: string;
  name: string;
  roleFamilies: RoleFamily[];
  keywords: string[];
  regions: string[];
  minimumSalaryGbp: number;
}

export interface Company {
  id: string;
  name: string;
  websiteUrl: string;
  careersUrl: string;
  stage: string;
  sectors: string[];
  hiringRegions: string[];
  targetTier: "A" | "B" | "C" | "Archive";
  watchStatus: "Active" | "Paused" | "Archived";
  rationale: string;
  lastCheckedAt: string;
}

export interface Role {
  id: string;
  companyId: string;
  title: string;
  roleFamily: RoleFamily;
  location: string;
  remoteType: "Remote" | "Hybrid" | "On-site" | "Flexible";
  employmentType: "Permanent" | "Contract" | "Fractional";
  salaryMin?: number;
  salaryMax?: number;
  currency?: "GBP" | "USD" | "EUR" | "AUD";
  sourcePlatform: string;
  sourceUrl: string;
  discoveredAt: string;
  closingDate?: string;
  status: "New" | "Reviewed" | "Archived";
  summary: string;
  requirements: string[];
  responsibilities: string[];
}

export interface ScoreBreakdown {
  roleFamily: number;
  customer: number;
  technical: number;
  ai: number;
  commercial: number;
  probability: number;
  company: number;
  strategic: number;
}

export interface RoleScore {
  roleId: string;
  overall: number;
  confidence: number;
  label: FitLabel;
  recommendation: string;
  strengths: string[];
  gaps: string[];
  questions: string[];
  breakdown: ScoreBreakdown;
}

export interface Application {
  id: string;
  roleId: string;
  status: ApplicationStatus;
  applicationDate?: string;
  followUpDate?: string;
  nextAction: string;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  relevanceTags: string[];
  interviewStory: string;
  caveats: string[];
}

export interface DigestAction {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
  entityId: string;
}
