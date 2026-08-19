import { readable, roleFamilyLabels } from "@/lib/catalog";
import { getAnalytics } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { applications, roles } = await getAnalytics();
  const sourceCounts = roles.reduce<Record<string, number>>((result, role) => { const key = role.sourcePlatform ?? "Manual"; result[key] = (result[key] ?? 0) + 1; return result; }, {});
  const familyCounts = roles.reduce<Record<string, number>>((result, role) => { const key = roleFamilyLabels[role.roleFamily]; result[key] = (result[key] ?? 0) + 1; return result; }, {});
  const active = applications.filter((application) => !["REJECTED", "WITHDRAWN", "ARCHIVED"].includes(application.status)).length;
  return <><header className="topbar"><div><p className="eyebrow">Learning loop</p><h1>Analytics</h1><p className="subtle">Small, practical signals instead of dashboard theatre.</p></div></header><section className="summary-grid"><article className="metric"><div><span>Applications</span><strong>{applications.length}</strong><p>{active} active</p></div></article><article className="metric"><div><span>Roles reviewed</span><strong>{roles.filter((role) => role.status === "REVIEWED").length}</strong><p>{roles.length} total</p></div></article><article className="metric"><div><span>Interviews</span><strong>{applications.filter((application) => ["RECRUITER_SCREEN", "HIRING_MANAGER", "TECHNICAL_ROUND", "FINAL_ROUND", "OFFER"].includes(application.status)).length}</strong><p>Across pipeline</p></div></article><article className="metric"><div><span>High-fit roles</span><strong>{roles.filter((role) => (role.scores[0]?.humanOverride ?? role.scores[0]?.overall ?? 0) >= 68).length}</strong><p>Score 68+</p></div></article></section><section className="two-column"><Breakdown title="Roles by source" values={sourceCounts}/><Breakdown title="Roles by family" values={familyCounts}/></section></>;
}

function Breakdown({ title, values }: { title: string; values: Record<string, number> }) { return <section className="panel"><div className="section-heading"><h2>{title}</h2></div><div className="breakdown">{Object.entries(values).map(([key, value]) => <div key={key}><span>{readable(key)}</span><strong>{value}</strong><div className="meter"><i style={{ width: `${Math.min(value * 25, 100)}%` }}/></div></div>)}</div></section>; }
