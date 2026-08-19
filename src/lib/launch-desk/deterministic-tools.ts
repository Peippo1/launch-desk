import type { ChannelCopy, LaunchBrief, LaunchTask, OwnerChecklistItem, ReadinessItem } from "./schema";

const WORKSTREAM_KEYWORDS: Array<[LaunchTask["workstream"], RegExp]> = [
  ["Legal", /\b(legal|privacy|terms|compliance|security|approval|gdpr|soc2)\b/i],
  ["Data", /\b(metric|analytics|dashboard|telemetry|experiment|tracking|kpi)\b/i],
  ["Support", /\b(support|faq|docs|help|ticket|training)\b/i],
  ["Sales", /\b(sales|customer|account|enablement|pricing|demo)\b/i],
  ["Marketing", /\b(marketing|copy|launch|blog|email|social|announcement)\b/i],
  ["Engineering", /\b(api|infra|migration|bug|release|flag|rollout|qa|test)\b/i],
  ["Product", /\b(product|user|workflow|feature|beta|scope)\b/i]
];

export function extractTasksFromBrief(input: LaunchBrief): LaunchTask[] {
  const source = `${input.productBrief}\n${input.constraints}\n${input.availableAssets}`;
  const fragments = source.split(/[\n.;]+/).map((part) => part.trim()).filter((part) => part.length > 18);
  const seeded = fragments.length ? fragments.slice(0, 8) : [input.productBrief];
  const tasks: LaunchTask[] = seeded.map((fragment, index) => {
    const workstream = inferWorkstream(fragment);
    const priority: LaunchTask["priority"] = index < 3 ? "P0" : index < 6 ? "P1" : "P2";
    return {
      title: toTaskTitle(fragment, workstream),
      ownerRole: ownerFor(workstream),
      priority,
      workstream,
      dueOffsetDays: priority === "P0" ? -14 + index * 2 : priority === "P1" ? -7 + index : -3,
      rationale: fragment.length > 180 ? `${fragment.slice(0, 177)}...` : fragment
    };
  });

  return ensureBaselineTasks(tasks);
}

export function checkLaunchReadiness(input: LaunchBrief, tasks: LaunchTask[]): ReadinessItem[] {
  const combined = `${input.productBrief} ${input.audience} ${input.constraints} ${input.availableAssets}`.toLowerCase();
  const checks = [
    ["Audience and positioning", /\b(audience|segment|persona|buyer|user|customer)\b/, "Name the primary segment, buyer/user, and launch promise."],
    ["Release quality", /\b(qa|test|bug|rollback|monitor|slo|feature flag|flag)\b/, "Confirm QA owner, rollback path, monitoring, and launch flag plan."],
    ["Go-to-market assets", /\b(email|blog|deck|demo|faq|docs|copy|social|enablement)\b/, "Prepare final copy, visual assets, FAQs, and sales/support notes."],
    ["Operational readiness", /\b(support|on-call|incident|runbook|training|handoff)\b/, "Assign launch-day coverage, support routing, and escalation owners."],
    ["Measurement", /\b(metric|kpi|analytics|dashboard|tracking|telemetry|success)\b/, "Define success metrics, baseline, dashboard owner, and review date."]
  ] as const;

  return checks.map(([area, pattern, nextStep]) => {
    const matched = pattern.test(combined);
    const relatedTask = tasks.find((task) => task.rationale.toLowerCase().includes(area.split(" ")[0].toLowerCase()));
    return {
      area,
      status: matched ? "ready" : relatedTask ? "watch" : "blocked",
      evidence: matched ? "The brief includes signals for this readiness area." : "The brief does not include enough concrete detail yet.",
      nextStep
    };
  });
}

export function generateOwnerChecklists(tasks: LaunchTask[], readiness: ReadinessItem[]): OwnerChecklistItem[] {
  const byOwner = new Map<string, string[]>();
  for (const task of tasks) {
    const due = task.dueOffsetDays < 0 ? `${Math.abs(task.dueOffsetDays)} days before launch` : "launch week";
    const item = `${task.priority}: ${task.title} (${due})`;
    byOwner.set(task.ownerRole, [...(byOwner.get(task.ownerRole) ?? []), item]);
  }
  for (const item of readiness.filter((check) => check.status !== "ready")) {
    const owner = item.area === "Measurement" ? "Data lead" : item.area === "Release quality" ? "Engineering lead" : "Launch lead";
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), `${item.status.toUpperCase()}: ${item.nextStep}`]);
  }
  return Array.from(byOwner, ([ownerRole, checklist]) => ({ ownerRole, checklist: checklist.slice(0, 6) }));
}

export function draftChannelCopy(input: LaunchBrief): ChannelCopy[] {
  const product = compact(input.productBrief, 120);
  const audience = compact(input.audience, 90);
  return [
    { channel: "Email", draft: `Subject: New for ${audience}: ${product}\n\nWe are launching a focused improvement for ${audience}. It helps teams move faster with clearer ownership, fewer launch surprises, and a tighter path from idea to release.`, note: "Use for customer or internal stakeholder announcement." },
    { channel: "Blog", draft: `${product}\n\nToday we are introducing a launch designed for ${audience}. The release focuses on the operational moments that decide whether a launch is clear, coordinated, and measurable.`, note: "Expand with proof points, screenshots, and customer context." },
    { channel: "In-app", draft: `New: ${product}. Review what changed, see the recommended next action, and share feedback with the launch team.`, note: "Keep in-app copy short and action-led." },
    { channel: "Social", draft: `Launching: ${product}. Built for ${audience}, with a practical release path from planning to rollout.`, note: "Add visual asset and launch URL when available." },
    { channel: "Sales enablement", draft: `Positioning: ${product}\nAudience: ${audience}\nLead with the launch outcome, confirm fit, then use the readiness checklist to handle implementation questions.`, note: "Pair with objection handling and demo notes." }
  ];
}

export function findMissingDetails(input: LaunchBrief, readiness: ReadinessItem[]): string[] {
  const questions = readiness.filter((item) => item.status !== "ready").map((item) => `What is the confirmed ${item.area.toLowerCase()} plan?`);
  if (!input.constraints.trim()) questions.push("What constraints, dependencies, approvals, or release blockers should the plan respect?");
  if (!input.availableAssets.trim()) questions.push("Which launch assets already exist, and which still need to be created?");
  return Array.from(new Set(questions)).slice(0, 6);
}

function inferWorkstream(text: string): LaunchTask["workstream"] {
  return WORKSTREAM_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? "Product";
}

function ownerFor(workstream: LaunchTask["workstream"]): string {
  return ({
    Product: "Product lead",
    Engineering: "Engineering lead",
    Marketing: "Marketing lead",
    Sales: "Sales lead",
    Support: "Support lead",
    Data: "Data lead",
    Legal: "Legal owner"
  })[workstream];
}

function toTaskTitle(fragment: string, workstream: LaunchTask["workstream"]): string {
  const cleaned = compact(fragment.replace(/^(we need to|need to|must|should)\s+/i, ""), 86);
  return `${workstream}: ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function ensureBaselineTasks(tasks: LaunchTask[]): LaunchTask[] {
  const baseline: LaunchTask[] = [
    { title: "Engineering: Confirm release candidate, rollback path, and monitoring", ownerRole: "Engineering lead", priority: "P0", workstream: "Engineering", dueOffsetDays: -10, rationale: "Every launch plan needs a concrete release-readiness checkpoint." },
    { title: "Marketing: Finalize announcement copy and channel calendar", ownerRole: "Marketing lead", priority: "P0", workstream: "Marketing", dueOffsetDays: -7, rationale: "Launch copy and timing must be ready before launch week." },
    { title: "Support: Prepare FAQ, escalation route, and launch-day coverage", ownerRole: "Support lead", priority: "P1", workstream: "Support", dueOffsetDays: -5, rationale: "Customer-facing teams need enough context to handle launch questions." },
    { title: "Data: Define success dashboard and review cadence", ownerRole: "Data lead", priority: "P1", workstream: "Data", dueOffsetDays: -4, rationale: "The launch needs measurable outcomes and a post-launch review loop." }
  ];
  const existingWorkstreams = new Set(tasks.map((task) => task.workstream));
  return [...tasks, ...baseline.filter((task) => !existingWorkstreams.has(task.workstream))].slice(0, 10);
}

function compact(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
}
