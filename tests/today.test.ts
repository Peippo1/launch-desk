import { describe, expect, it } from "vitest";
import { buildTodayActions, getApplicationAging, getUpcomingDeadlines, getUpcomingInterviews } from "../src/lib/today";

const now = new Date("2026-07-31T12:00:00.000Z");

describe("Today signals", () => {
  it("identifies aging applications and near-term deadlines", () => {
    const application = { id: "application-1", status: "APPLIED" as const, applicationDate: new Date("2026-07-20T12:00:00.000Z"), followUpDate: null, nextAction: "Check in", role: { id: "role-1", title: "AI Engineer", company: { name: "Northstar" } } };
    const role = { id: "role-1", title: "AI Engineer", status: "NEW" as const, closingDate: new Date("2026-08-03T12:00:00.000Z"), company: { name: "Northstar" }, scores: [{ overall: 82, humanOverride: null }] };

    expect(getApplicationAging([application], now)).toEqual([{ application, days: 11 }]);
    expect(getUpcomingDeadlines([role], now)).toEqual([{ role, days: 3 }]);
  });

  it("orders the top five actions deterministically by urgency then score", () => {
    const actions = buildTodayActions({
      now,
      roles: [
        { id: "role-1", title: "AI Engineer", status: "NEW", closingDate: new Date("2026-08-03T12:00:00.000Z"), company: { name: "Northstar" }, scores: [{ overall: 82, humanOverride: null }] },
        { id: "role-2", title: "Solutions Engineer", status: "NEW", closingDate: null, company: { name: "Signalworks" }, scores: [{ overall: 91, humanOverride: null }] }
      ],
      applications: [{ id: "application-1", status: "APPLIED", applicationDate: new Date("2026-07-20T12:00:00.000Z"), followUpDate: new Date("2026-07-30T12:00:00.000Z"), nextAction: "Send follow-up", role: { id: "role-1", title: "AI Engineer", company: { name: "Northstar" } } }]
    });

    expect(actions.slice(0, 3).map((action) => action.kind)).toEqual(["FOLLOW_UP", "DEADLINE", "AGING"]);
    expect(actions[3]?.title).toContain("Signalworks");
    expect(actions[3]?.detail).toContain("Solutions Engineer");
  });

  it("surfaces pending interviews inside the next seven days", () => {
    const interviews = [{ id: "interview-1", stage: "TECHNICAL_ROUND", scheduledAt: new Date("2026-08-02T12:00:00.000Z"), role: { id: "role-1", title: "AI Engineer", company: { name: "Northstar" } } }];

    expect(getUpcomingInterviews(interviews, now)).toEqual([{ interview: interviews[0], days: 2 }]);
    expect(buildTodayActions({ now, roles: [], applications: [], interviews })[0]).toMatchObject({ kind: "INTERVIEW", entityId: "interview-1" });
  });
});
