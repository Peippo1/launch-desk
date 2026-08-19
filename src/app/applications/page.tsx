import { addNote, generateApplicationDraft, updateApplication } from "@/app/actions";
import { applicationStatusLabels, applicationStatuses } from "@/lib/catalog";
import { getApplications } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ error?: string; generated?: string }> }) {
  const params = await searchParams;
  const applications = await getApplications();

  return <>
    <header className="topbar">
      <div>
        <p className="eyebrow">Pipeline</p>
        <h1>Applications</h1>
        <p className="subtle">Keep each application anchored to a concrete next action.</p>
      </div>
    </header>

    {params.error === "invalid-transition" ? <p className="form-error" role="alert">That status change skips a workflow stage. Move the application through the next stage first.</p> : null}
    {params.error === "ai-not-configured" ? <p className="form-error" role="alert">AI drafting is not configured. Add an OpenAI API key to the server environment first.</p> : null}
    {params.error?.startsWith("ai-") && params.error !== "ai-not-configured" ? <p className="form-error" role="alert">The AI draft could not be created. Nothing was submitted or sent.</p> : null}
    {params.generated ? <p className="notice" role="status">Draft generated in the Additional info field. Review and edit it before use.</p> : null}
    <section className="panel table-panel">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Role</th><th>Status</th><th>Follow-up</th><th>Submitted</th><th>Additional info</th><th>Next action</th><th>Outcome</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {applications.map((application) => {
              const formId = `application-${application.id}`;
              return <tr key={application.id}>
                <td>
                  <strong>{application.role.title}</strong>
                  <small>{application.role.company.name}</small>
                  <form id={formId} action={updateApplication}><input type="hidden" name="id" value={application.id} /></form>
                </td>
                <td><select form={formId} name="status" defaultValue={application.status}>{applicationStatuses.map((status) => <option key={status} value={status}>{applicationStatusLabels[status]}</option>)}</select></td>
                <td><input form={formId} name="followUpDate" type="date" defaultValue={application.followUpDate?.toISOString().slice(0, 10)} /></td>
                <td>
                  <input form={formId} name="cvVersion" defaultValue={application.cvVersion ?? ""} placeholder="CV version" />
                  <div className="salary-row">
                    <input form={formId} name="submittedSalary" type="number" min="1" defaultValue={application.submittedSalary ?? ""} placeholder="Salary" />
                    <select form={formId} name="submittedCurrency" defaultValue={application.submittedCurrency ?? ""} aria-label="Submitted salary currency">
                      <option value="">Currency</option>
                      {["GBP", "USD", "EUR", "AUD"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                    </select>
                  </div>
                </td>
                <td><textarea form={formId} name="additionalInfo" defaultValue={application.additionalInfo ?? ""} placeholder="Application response or context" /></td>
                <td><textarea form={formId} name="nextAction" defaultValue={application.nextAction ?? ""} placeholder="Define next action" /></td>
                <td><textarea form={formId} name="outcomeReason" defaultValue={application.outcomeReason ?? ""} placeholder="Reason, blocker, or lesson" /></td>
                <td><small>{application.notes[0]?.body ?? "No note yet."}</small><form action={addNote} className="note-form"><input type="hidden" name="scope" value="APPLICATION" /><input type="hidden" name="entityId" value={application.id} /><textarea name="body" placeholder="Add note" required /><button className="secondary-action" type="submit">Add note</button></form></td>
                <td><button form={formId} className="icon-button" aria-label={`Update ${application.role.title}`}>Save</button><form action={generateApplicationDraft}><input type="hidden" name="applicationId" value={application.id} /><button className="secondary-action" type="submit">Draft with AI</button></form></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!applications.length ? <p className="empty-state">Create an application from a role review.</p> : null}
      </div>
    </section>
  </>;
}
