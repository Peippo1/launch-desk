import Link from "next/link";
import { notFound } from "next/navigation";
import { addNote, createApplication, regenerateScore, setScoreOverride, updateRoleStatus } from "@/app/actions";
import { ScoreBadge } from "@/components/score-badge";
import { readable, roleFamilyLabels } from "@/lib/catalog";
import { matchProjectsToRole } from "@/lib/portfolio";
import { getProjects, getRoleDetail } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getRoleDetail(id);
  if (!role) notFound();

  const [score, projects] = [role.scores[0], await getProjects()];
  const matches = matchProjectsToRole(role, projects);

  return <>
    <header className="topbar">
      <div>
        <p className="eyebrow">Role review</p>
        <h1>{role.title}</h1>
        <p className="subtle">{role.company.name} · {role.location ?? "Location to confirm"} · {readable(role.employmentType)}</p>
      </div>
      <Link className="text-link" href="/roles">Back to roles</Link>
    </header>

    <div className="detail-grid">
      <section className="panel score-panel">
        <div className="score-summary">
          <ScoreBadge score={score?.humanOverride ?? score?.overall ?? 0} label={score ? readable(score.label) : "Unscored"} />
          <div>
            <p className="eyebrow">{score ? readable(score.label) : "Unscored"}</p>
            <h2>{score?.recommendation ?? "Score this role before deciding."}</h2>
            <p className="subtle">Confidence {score?.confidence ?? 0}% · {roleFamilyLabels[role.roleFamily]}</p>
          </div>
        </div>
        <div className="button-row">
          <form action={regenerateScore}>
            <input type="hidden" name="roleId" value={role.id} />
            <button className="secondary-action">Regenerate score</button>
          </form>
          {role.application ? <Link className="primary-action" href="/applications">Open application</Link> : (
            <form action={createApplication}>
              <input type="hidden" name="roleId" value={role.id} />
              <button className="primary-action">Create application</button>
            </form>
          )}
          <form action={updateRoleStatus}>
            <input type="hidden" name="roleId" value={role.id} />
            <input type="hidden" name="status" value={role.status === "ARCHIVED" ? "REVIEWED" : "ARCHIVED"} />
            <button className="secondary-action">{role.status === "ARCHIVED" ? "Reopen role" : "Archive role"}</button>
          </form>
        </div>
        {score ? (
          <form action={setScoreOverride} className="inline-control">
            <input type="hidden" name="roleId" value={role.id} />
            <label>Human override<input name="humanOverride" type="number" min="0" max="100" defaultValue={score.humanOverride ?? ""} placeholder={String(score.overall)} /></label>
            <button className="icon-button">Save</button>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Score breakdown</h2></div>
        <div className="breakdown">
          {Object.entries((score?.breakdown ?? {}) as Record<string, number>).map(([key, value]) => (
            <div key={key}><span>{readable(key)}</span><strong>{value}</strong><div className="meter"><i style={{ width: `${value}%` }} /></div></div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Strengths and gaps</h2></div>
        <div className="insight-columns">
          <div><h3>Strengths</h3><ul>{score?.strengths.map((value) => <li key={value}>{value}</li>)}</ul></div>
          <div><h3>Validate</h3><ul>{[...(score?.gaps ?? []), ...(score?.questions ?? [])].map((value) => <li key={value}>{value}</li>)}</ul></div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Portfolio matches</h2></div>
        {matches.map(({ project, matchedTags, pitch, technicalAngle, stakeholderAngle, objections }) => <article className="project-match" key={project.id}><h3>{project.name}</h3><p>{pitch}</p><p>{technicalAngle}</p><p>{stakeholderAngle}</p><span className="tag">{matchedTags.length ? `${matchedTags.length} relevance signals` : "Review manually"}</span>{objections.length ? <ul><li>{objections.join(" ")}</li></ul> : null}</article>)}
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Notes</h2></div>
        <form action={addNote} className="note-form">
          <input type="hidden" name="scope" value="ROLE" />
          <input type="hidden" name="entityId" value={role.id} />
          <textarea name="body" placeholder="Capture decision notes, risks, or application angle" required />
          <button className="secondary-action">Add note</button>
        </form>
        <div className="note-list">
          {role.notes.map((note) => <p key={note.id}>{note.body}</p>)}
          {!role.notes.length ? <p className="subtle">No notes yet.</p> : null}
        </div>
      </section>

      <section className="panel span-two">
        <div className="section-heading"><h2>Source reference</h2><a className="text-link" href={role.sourceUrl} target="_blank" rel="noreferrer">Open posting</a></div>
        <p>{role.summary}</p>
        <h3>Requirements</h3>
        <ul>{role.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
        <h3>Raw snapshot</h3>
        <pre>{role.rawSnapshot ?? "No raw snapshot captured."}</pre>
      </section>
    </div>
  </>;
}
