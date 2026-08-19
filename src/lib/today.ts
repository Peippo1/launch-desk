type TodayScore = { overall: number; humanOverride: number | null };

export type TodayRole = {
  id: string;
  title: string;
  status: string;
  closingDate: Date | null;
  company: { name: string };
  scores: TodayScore[];
};

export type TodayApplication = {
  id: string;
  status: string;
  applicationDate: Date | null;
  followUpDate: Date | null;
  nextAction: string | null;
  role: { id: string; title: string; company: { name: string } };
};

export type TodayInterview = {
  id: string;
  stage: string;
  scheduledAt: Date;
  role: { id: string; title: string; company: { name: string } };
};

export type TodayAction = {
  kind: "FOLLOW_UP" | "DEADLINE" | "AGING" | "INTERVIEW" | "REVIEW_ROLE";
  title: string;
  detail: string;
  priority: "High" | "Medium";
  entityId: string;
};

const DAY = 24 * 60 * 60 * 1000;
const terminalStatuses = new Set(["REJECTED", "WITHDRAWN", "ARCHIVED"]);
const agingStatuses = new Set(["APPLIED", "RECRUITER_SCREEN", "HIRING_MANAGER", "TECHNICAL_ROUND", "FINAL_ROUND"]);

function wholeDaysBetween(later: Date, earlier: Date) {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / DAY));
}

export function getApplicationAging(applications: TodayApplication[], now: Date, thresholdDays = 7) {
  return applications
    .filter((application) => application.applicationDate && agingStatuses.has(application.status) && wholeDaysBetween(now, application.applicationDate) >= thresholdDays)
    .map((application) => ({ application, days: wholeDaysBetween(now, application.applicationDate!) }))
    .sort((left, right) => right.days - left.days || left.application.id.localeCompare(right.application.id));
}

export function getUpcomingDeadlines(roles: TodayRole[], now: Date, windowDays = 7) {
  return roles
    .filter((role) => role.status !== "ARCHIVED" && role.closingDate && role.closingDate >= now && wholeDaysBetween(role.closingDate, now) <= windowDays)
    .map((role) => ({ role, days: wholeDaysBetween(role.closingDate!, now) }))
    .sort((left, right) => left.days - right.days || left.role.title.localeCompare(right.role.title) || left.role.id.localeCompare(right.role.id));
}

export function getUpcomingInterviews(interviews: TodayInterview[], now: Date, windowDays = 7) {
  return interviews
    .filter((interview) => interview.scheduledAt >= now && wholeDaysBetween(interview.scheduledAt, now) <= windowDays)
    .map((interview) => ({ interview, days: wholeDaysBetween(interview.scheduledAt, now) }))
    .sort((left, right) => left.days - right.days || left.interview.scheduledAt.getTime() - right.interview.scheduledAt.getTime() || left.interview.id.localeCompare(right.interview.id));
}

export function buildTodayActions(input: { now: Date; roles: TodayRole[]; applications: TodayApplication[]; interviews?: TodayInterview[] }): TodayAction[] {
  const actions: Array<TodayAction & { rank: number; sortValue: number; sortText: string }> = [];
  const deadlines = getUpcomingDeadlines(input.roles, input.now);
  getUpcomingInterviews(input.interviews ?? [], input.now).forEach(({ interview, days }) => actions.push({ kind: "INTERVIEW", title: `Prepare for ${interview.role.company.name}`, detail: `${interview.role.title} · ${days === 0 ? "Today" : `${days} days`}`, priority: days <= 1 ? "High" : "Medium", entityId: interview.id, rank: 0, sortValue: interview.scheduledAt.getTime(), sortText: interview.role.company.name }));

  input.applications
    .filter((application) => application.followUpDate && application.followUpDate <= input.now && !terminalStatuses.has(application.status))
    .forEach((application) => actions.push({ kind: "FOLLOW_UP", title: `Follow up: ${application.role.company.name}`, detail: application.nextAction ?? application.role.title, priority: "High", entityId: application.id, rank: 0, sortValue: application.followUpDate!.getTime(), sortText: application.role.company.name }));

  deadlines.forEach(({ role, days }) => actions.push({ kind: "DEADLINE", title: `${role.title} deadline`, detail: `${role.company.name} · ${days === 0 ? "Due today" : `${days} days left`}`, priority: days <= 2 ? "High" : "Medium", entityId: role.id, rank: 1, sortValue: days, sortText: role.title }));

  getApplicationAging(input.applications, input.now).forEach(({ application, days }) => actions.push({ kind: "AGING", title: `Check ${application.role.company.name}`, detail: `${application.role.title} · No response for ${days} days`, priority: days >= 14 ? "High" : "Medium", entityId: application.id, rank: 2, sortValue: -days, sortText: application.role.company.name }));

  input.roles
    .filter((role) => role.status !== "ARCHIVED")
    .map((role) => ({ role, score: role.scores[0]?.humanOverride ?? role.scores[0]?.overall ?? 0 }))
    .filter(({ score }) => score >= 68)
    .forEach(({ role, score }) => actions.push({ kind: "REVIEW_ROLE", title: `Review ${role.company.name}`, detail: `${role.title} · Score ${score}`, priority: "Medium", entityId: role.id, rank: 3, sortValue: -score, sortText: role.company.name }));

  return actions
    .sort((left, right) => left.rank - right.rank || left.sortValue - right.sortValue || left.sortText.localeCompare(right.sortText) || left.entityId.localeCompare(right.entityId))
    .slice(0, 5)
    .map(({ rank: _rank, sortValue: _sortValue, sortText: _sortText, ...action }) => action);
}
