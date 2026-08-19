import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getWorkspaceHistory } from "@/lib/product/repository";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const identity = await requireWorkspace();
  const { launchPlans, campaignProjects } = await getWorkspaceHistory(db, identity);

  return <>
    <header className="topbar"><div><p className="eyebrow">History</p><h1>Saved launch work</h1><p className="subtle">Workspace-scoped launch plans and campaign projects.</p></div></header>
    <section className="two-column">
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Launch Desk</p><h2>Release plans</h2></div></div>{launchPlans.length ? <div className="action-list">{launchPlans.map((plan) => <article className="action-item" key={plan.id}><h3>{plan.productBrief}</h3><p>{plan.audience} · {plan.launchDate} · {new Date(plan.createdAt).toLocaleString("en-GB")}</p><pre>{plan.finalOutput}</pre></article>)}</div> : <p className="empty-state">No launch plans saved yet.</p>}</section>
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Campaign Studio</p><h2>Campaign projects</h2></div></div>{campaignProjects.length ? <div className="action-list">{campaignProjects.map((campaign) => <article className="action-item" key={campaign.id}><h3>{campaign.brief}</h3><p>{campaign.audience} · {campaign.channels.join(", ")} · {new Date(campaign.createdAt).toLocaleString("en-GB")}</p></article>)}</div> : <p className="empty-state">No campaign projects saved yet.</p>}</section>
    </section>
  </>;
}
