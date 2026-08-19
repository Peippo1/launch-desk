import { z } from "zod";

export const launchBriefSchema = z.object({
  productBrief: z.string().trim().min(20).max(6000),
  audience: z.string().trim().min(3).max(1200),
  launchDate: z.string().trim().min(4).max(80),
  constraints: z.string().trim().max(2000).optional().default(""),
  availableAssets: z.string().trim().max(2000).optional().default("")
});

export type LaunchBrief = z.infer<typeof launchBriefSchema>;

export type LaunchTask = {
  title: string;
  ownerRole: string;
  priority: "P0" | "P1" | "P2";
  workstream: "Product" | "Engineering" | "Marketing" | "Sales" | "Support" | "Data" | "Legal";
  dueOffsetDays: number;
  rationale: string;
};

export type ReadinessItem = {
  area: string;
  status: "ready" | "watch" | "blocked";
  evidence: string;
  nextStep: string;
};

export type OwnerChecklistItem = {
  ownerRole: string;
  checklist: string[];
};

export type ChannelCopy = {
  channel: "Email" | "Blog" | "In-app" | "Social" | "Sales enablement";
  draft: string;
  note: string;
};

export type LaunchDeskToolProgress = {
  toolName: string;
  label: string;
  status: "started" | "completed";
};
