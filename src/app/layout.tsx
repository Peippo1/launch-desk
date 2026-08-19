import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navigation } from "@/components/navigation";
import { isAuthenticated } from "@/lib/auth/server";
import "@/styles/main.css";

export const metadata: Metadata = { title: "Launch Desk", description: "Launch planning and campaign generation workspace" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authenticated = await isAuthenticated();
  return <ClerkProvider><html lang="en"><body><div className={authenticated ? "app-shell" : "auth-app-shell"}>{authenticated ? <Navigation /> : null}<main className="workspace">{children}</main></div></body></html></ClerkProvider>;
}
