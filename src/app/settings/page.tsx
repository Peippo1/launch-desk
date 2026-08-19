import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getMonthlyQuota, getWorkspaceHistory, getWorkspaceUsageSummary } from "@/lib/product/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const identity = await requireWorkspace();
  const [{ workspace }, usage] = await Promise.all([
    getWorkspaceHistory(db, identity),
    getWorkspaceUsageSummary(db, identity),
  ]);
  const quota = getMonthlyQuota();

  return <>
    <header className="topbar"><div><p className="eyebrow">Settings</p><h1>Workspace controls</h1><p className="subtle">Usage and deployment configuration for {workspace.name}.</p></div></header>
    <section className="summary-grid">
      <Metric label="AI requests" value={`${usage.requestsThisMonth}/${quota}`} detail="Monthly workspace quota" />
      <Metric label="Text chars" value={String(usage.estimatedTextCharacters)} detail="Estimated generated output" />
      <Metric label="Images" value={String(usage.generatedImages)} detail="Generated campaign images" />
      <Metric label="Workspace" value={workspace.name} detail={workspace.clerkOrgId} />
    </section>
    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Environment</p><h2>Required production configuration</h2></div></div><ul><li>Set Clerk keys in Vercel via the Clerk integration.</li><li>Set `DATABASE_URL` to the Neon Postgres connection string.</li><li>Set `OPENAI_API_KEY` as a server-side Vercel secret.</li><li>Run `npx prisma migrate deploy` before first production use.</li></ul></section>
  </>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric"><div><span>{label}</span><strong>{value}</strong><p>{detail}</p></div></article>;
}
