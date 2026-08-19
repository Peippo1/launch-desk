import Link from "next/link";
import { History, Megaphone, Settings, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const items = [
  ["Launch Desk", "/launch-desk", Megaphone],
  ["Campaign Studio", "/campaign-studio", Sparkles],
  ["History", "/history", History],
  ["Settings", "/settings", Settings],
] as const;

export function Navigation() {
  return <aside className="sidebar"><Link className="brand" href="/"><Megaphone size={23} /><span>Launch Desk</span></Link><nav>{items.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={17} /><span>{label}</span></Link>)}</nav><div className="sidebar-footer"><p className="sidebar-note">Team launch workspace</p><UserButton /></div></aside>;
}
