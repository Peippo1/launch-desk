import { describe, expect, it } from "vitest";
import { formToApplicationUpdate, formToRole } from "../src/lib/validation";

describe("application update validation", () => {
  it("turns blank editable fields into null so stored values can be cleared", () => {
    const form = new FormData();
    form.set("id", "application-1");
    form.set("status", "SHORTLISTED");
    form.set("nextAction", "");
    form.set("followUpDate", "");
    form.set("cvVersion", "");
    form.set("submittedSalary", "");
    form.set("submittedCurrency", "");
    form.set("outcomeReason", "");

    expect(formToApplicationUpdate(form)).toMatchObject({
      nextAction: null,
      followUpDate: null,
      cvVersion: null,
      submittedSalary: null,
      submittedCurrency: null,
      outcomeReason: null
    });
  });
});

describe("role validation", () => {
  it("rejects a salary range whose minimum exceeds its maximum", () => {
    const form = new FormData();
    form.set("companyId", "company-1");
    form.set("title", "AI Engineer");
    form.set("roleFamily", "APPLIED_AI_ENGINEERING");
    form.set("remoteType", "REMOTE");
    form.set("employmentType", "PERMANENT");
    form.set("salaryMin", "120000");
    form.set("salaryMax", "90000");
    form.set("currency", "GBP");
    form.set("sourceUrl", "https://example.com/role");

    expect(() => formToRole(form)).toThrow("Minimum salary cannot exceed maximum salary.");
  });
});
