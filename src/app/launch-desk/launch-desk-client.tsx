"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Loader2, Megaphone, Send, Sparkles } from "lucide-react";

type BriefState = {
  productBrief: string;
  audience: string;
  launchDate: string;
  constraints: string;
  availableAssets: string;
};

type ProgressEvent = {
  id: string;
  label: string;
  status: "started" | "completed";
};

const sampleBrief: BriefState = {
  productBrief: "We are launching Launch Quality Score, a dashboard and workflow that helps engineering managers see whether a release has clear owners, QA evidence, rollout controls, support readiness, and success metrics before launch day.",
  audience: "Engineering managers, product managers, and launch leads at B2B SaaS companies coordinating multi-team releases.",
  launchDate: "2026-09-22",
  constraints: "Beta customers need two weeks of notice. Security review must complete before public announcement. The first launch should avoid paid acquisition.",
  availableAssets: "Product screenshots, internal QA checklist, beta customer quotes, draft docs page, feature flag rollout plan."
};

export function LaunchDeskClient() {
  const [brief, setBrief] = useState<BriefState>(sampleBrief);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return brief.productBrief.trim().length >= 20 && brief.audience.trim().length >= 3 && brief.launchDate.trim().length >= 4 && status !== "streaming";
  }, [brief, status]);

  async function submitPlan() {
    if (!canSubmit) return;
    setAnswer("");
    setProgress([]);
    setError("");
    setStatus("streaming");

    try {
      const response = await fetch("/api/launch-desk/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief })
      });

      if (!response.ok || !response.body) {
        const fallback = await response.json().catch(() => null);
        throw new Error(fallback?.error ?? "Launch Desk could not start.");
      }

      await readServerEvents(response.body, {
        onToolProgress(event) {
          setProgress((current) => [...current, { id: `${event.toolName}-${event.status}-${current.length}`, label: event.label, status: event.status }]);
        },
        onTextDelta(delta) {
          setAnswer((current) => current + delta);
        },
        onError(message) {
          throw new Error(message);
        }
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch Desk failed.");
      setStatus("error");
    }
  }

  return <div className="launch-desk">
    <header className="topbar launch-topbar">
      <div>
        <p className="eyebrow">Launch Desk</p>
        <h1>Turn a rough launch idea into a release plan</h1>
        <p className="subtle">Enter the brief, audience, date, constraints, and assets. The agent runs launch-planning tools and streams the plan back as it works.</p>
      </div>
      <button className="primary-action launch-submit" type="button" onClick={submitPlan} disabled={!canSubmit}>
        {status === "streaming" ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
        Generate plan
      </button>
    </header>

    <section className="launch-metrics">
      <LaunchMetric icon={ClipboardList} label="Plan" value="Prioritized" />
      <LaunchMetric icon={AlertTriangle} label="Risks" value="Rubric-led" />
      <LaunchMetric icon={CheckCircle2} label="Owners" value="Checklist" />
      <LaunchMetric icon={Megaphone} label="Copy" value="5 channels" />
    </section>

    <section className="launch-layout">
      <form className="panel launch-form" onSubmit={(event) => { event.preventDefault(); void submitPlan(); }}>
        <div className="section-heading"><div><p className="eyebrow">Brief intake</p><h2>Launch inputs</h2></div><CalendarDays size={19} /></div>
        <label>Product brief<textarea value={brief.productBrief} onChange={(event) => setBrief({ ...brief, productBrief: event.target.value })} minLength={20} required /></label>
        <label>Audience<textarea value={brief.audience} onChange={(event) => setBrief({ ...brief, audience: event.target.value })} required /></label>
        <label>Launch date<input value={brief.launchDate} onChange={(event) => setBrief({ ...brief, launchDate: event.target.value })} required /></label>
        <label>Constraints<textarea value={brief.constraints} onChange={(event) => setBrief({ ...brief, constraints: event.target.value })} /></label>
        <label>Available assets<textarea value={brief.availableAssets} onChange={(event) => setBrief({ ...brief, availableAssets: event.target.value })} /></label>
        <div className="button-row"><button className="primary-action" type="submit" disabled={!canSubmit}>{status === "streaming" ? "Planning..." : "Generate launch plan"}</button><button className="secondary-action" type="button" onClick={() => setBrief(sampleBrief)}>Use sample brief</button></div>
      </form>

      <aside className="panel launch-progress" aria-live="polite">
        <div className="section-heading"><div><p className="eyebrow">Agent stream</p><h2>Progress</h2></div><Sparkles size={19} /></div>
        {progress.length ? <ol>{progress.map((event) => <li key={event.id} className={event.status}><span>{event.status === "completed" ? <CheckCircle2 size={15} /> : <Loader2 size={15} className="spin" />}</span>{event.label}</li>)}</ol> : <p className="empty-state">Tool progress appears here once the agent starts.</p>}
        {status === "error" ? <p className="form-error" role="alert">{error}</p> : null}
      </aside>

      <section className="panel launch-output">
        <div className="section-heading"><div><p className="eyebrow">Release plan</p><h2>Agent response</h2></div></div>
        {answer ? <div className="streamed-plan">{renderMarkdownLite(answer)}</div> : <p className="empty-state">The streamed launch plan will appear here.</p>}
      </section>
    </section>
  </div>;
}

function LaunchMetric({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return <article className="metric"><Icon size={20} /><div><span>{label}</span><strong>{value}</strong><p>Agent output</p></div></article>;
}

async function readServerEvents(body: ReadableStream<Uint8Array>, handlers: {
  onToolProgress(event: { toolName: string; label: string; status: "started" | "completed" }): void;
  onTextDelta(delta: string): void;
  onError(message: string): void;
}) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const parsed = parseServerEvent(frame);
      if (!parsed) continue;
      if (parsed.event === "tool_progress" && isToolProgress(parsed.data)) handlers.onToolProgress(parsed.data);
      if (parsed.event === "text_delta" && typeof parsed.data.delta === "string") handlers.onTextDelta(parsed.data.delta);
      if (parsed.event === "error") handlers.onError(parsed.data.message ?? "Launch Desk failed.");
    }
  }
}

function parseServerEvent(frame: string): { event: string; data: Record<string, any> } | null {
  const event = frame.split("\n").find((line) => line.startsWith("event: "))?.slice(7);
  const data = frame.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
  if (!event || !data) return null;
  return { event, data: JSON.parse(data) };
}

function isToolProgress(value: Record<string, any>): value is { toolName: string; label: string; status: "started" | "completed" } {
  return typeof value.toolName === "string" && typeof value.label === "string" && (value.status === "started" || value.status === "completed");
}

function renderMarkdownLite(value: string) {
  return value.split("\n").map((line, index) => {
    if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
    if (line.startsWith("- ")) return <p className="plan-bullet" key={index}>{line.slice(2)}</p>;
    if (!line.trim()) return <br key={index} />;
    return <p key={index}>{line}</p>;
  });
}
