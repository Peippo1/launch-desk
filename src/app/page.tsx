import Link from "next/link";
import { ArrowRight, History, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getMonthlyQuota, getWorkspaceHistory, getWorkspaceUsageSummary } from "@/lib/product/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const identity = await requireWorkspace();
  const [{ workspace, launchPlans, campaignProjects }, usage] = await Promise.all([
    getWorkspaceHistory(db, identity),
    getWorkspaceUsageSummary(db, identity),
  ]);
  const quota = getMonthlyQuota();

  return <>
    <header className="topbar">
      <div><p className="eyebrow">Launch Desk</p><h1>{workspace.name}</h1><p className="subtle">Plan releases, shape campaigns, and keep launch work visible for the team.</p></div>
      <Link href="/launch-desk" className="primary-action">Plan a launch <ArrowRight size={17} /></Link>
    </header>
    <section className="summary-grid">
      <Metric icon={Megaphone} label="Launch plans" value={String(launchPlans.length)} detail="Recent workspace plans" />
      <Metric icon={Sparkles} label="Campaigns" value={String(campaignProjects.length)} detail="Recent generated concepts" />
      <Metric icon={TrendingUp} label="AI requests" value={`${usage.requestsThisMonth}/${quota}`} detail="This month" />
      <Metric icon={History} label="Images" value={String(usage.generatedImages)} detail="Generated this month" />
    </section>
    <section className="two-column">
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Release planning</p><h2>Launch Desk</h2></div><Link className="text-link" href="/launch-desk">Open</Link></div><p className="subtle">Turn a product brief into a prioritized plan, risk register, owner checklist, channel copy, and follow-up questions.</p></section>
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Go-to-market</p><h2>Campaign Studio</h2></div><Link className="text-link" href="/campaign-studio">Open</Link></div><p className="subtle">Generate campaign concepts, copy variants, launch checklists, image directions, and visual assets.</p></section>
    </section>
    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Recent work</p><h2>Workspace history</h2></div><Link className="text-link" href="/history">View all</Link></div><ul className="signal-list">{launchPlans.slice(0, 3).map((plan) => <li key={plan.id}><span>{plan.productBrief}</span><span>{new Date(plan.createdAt).toLocaleDateString("en-GB")}</span></li>)}{campaignProjects.slice(0, 3).map((campaign) => <li key={campaign.id}><span>{campaign.brief}</span><span>{new Date(campaign.createdAt).toLocaleDateString("en-GB")}</span></li>)}{!launchPlans.length && !campaignProjects.length ? <li><span>No saved work yet.</span><span>Start with Launch Desk</span></li> : null}</ul></section>
  </>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Megaphone; label: string; value: string; detail: string }) {
  return <article className="metric"><Icon size={20}/><div><span>{label}</span><strong>{value}</strong><p>{detail}</p></div></article>;
}
