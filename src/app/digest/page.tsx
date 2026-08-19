import { generateDigest } from "@/app/actions";
import { Download } from "lucide-react";
import Link from "next/link";
import { getLatestDigest } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function DigestPage() {
  const digest = await getLatestDigest();
  return <><header className="topbar"><div><p className="eyebrow">Daily briefing</p><h1>Digest</h1><p className="subtle">A portable, Markdown-first view of the current opportunity state.</p></div><div className="button-row"><form action={generateDigest}><button className="primary-action">Generate digest</button></form>{digest ? <Link href="/api/digest/export" className="secondary-action"><Download size={16} /> Export Markdown</Link> : null}</div></header><section className="panel digest-panel">{digest ? <><p className="subtle">Generated {digest.createdAt.toLocaleString("en-GB")}</p><pre>{digest.content}</pre></> : <p className="empty-state">Generate the first digest after roles and applications have been added.</p>}</section></>;
}
