import Link from "next/link";

export const metadata = {
  title: "AI Foundation | Nereid Scout",
  description: "Technical note on the grounded AI foundation in Nereid Scout.",
};

export default function AiFoundationPage() {
  return <>
    <header className="topbar">
      <div>
        <p className="eyebrow">Technical thread</p>
        <h1>Building a grounded AI foundation</h1>
        <p className="subtle">How Nereid Scout adds provider-neutral AI contracts without giving up traceability.</p>
      </div>
    </header>
    <article className="panel article-page">
      <p className="article-meta">1 August 2026 · Nereid Scout</p>
      <p>Nereid Scout is deterministic where the product makes a decision: role scoring, workflow signals, and portfolio matching are inspectable application logic. The AI layer needs to extend that system without becoming an opaque source of claims or an uncontrolled automation surface.</p>
      <h2>The problem</h2>
      <p>Role descriptions and portfolio evidence are useful context, but they are not trusted instructions. A model can also produce polished text that quietly overstates experience. The foundation therefore starts with versioned prompt contracts, strict output validation, and explicit boundaries around untrusted role content.</p>
      <h2>The foundation</h2>
      <p>The new <code>src/lib/ai</code> boundary includes a prompt registry, a Zod schema for editable application drafts, and a guardrail prompt builder. The registry makes prompt changes reviewable in git. The parser rejects invalid JSON, unknown fields, and empty drafts before any result can be shown to a user. The guardrail builder bounds and marks role text and candidate evidence as reference data, never as instructions.</p>
      <p>The initial draft contract contains a body, visible assumptions, and source references. That keeps uncertainty in the product instead of hiding it behind fluent prose.</p>
      <h2>Deliberate limits</h2>
      <p>This increment has no provider SDK, API route, secret, or outbound submission. The contracts and failure behaviour can be tested without coupling Nereid Scout to a model vendor. A later provider adapter can add timeouts, cost controls, structured response mode, and an explicit user review step.</p>
      <h2>Verification</h2>
      <p>The foundation is covered by focused tests for prompt lookup, input bounding, untrusted markers, valid structured output, invalid JSON, and schema mismatch. The full application suite and production build remain release checks for each increment.</p>
      <p><Link className="text-link" href="/portfolio">Back to Portfolio</Link></p>
    </article>
  </>;
}
