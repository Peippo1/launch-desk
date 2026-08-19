"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ImageIcon, Loader2, Sparkles } from "lucide-react";
import type { CampaignStudioResult } from "@/lib/campaign-studio";

const channelOptions = ["Email", "LinkedIn", "Paid social", "Landing page", "Search ads", "Display", "Webinar", "Retail"];

const sampleBrief = {
  brief: "Launch a campaign for a lightweight analytics workspace that helps small B2B teams spot churn risks before renewal season.",
  audience: "Revenue leaders and customer success managers at 50 to 500 person SaaS companies.",
  product: "A collaborative dashboard that combines product usage, support signals, and account notes into a renewal health view.",
  tone: "Clear, commercially sharp, reassuring, and practical.",
  channels: ["Email", "LinkedIn", "Landing page"],
};

type FormState = typeof sampleBrief;

export function CampaignStudioClient() {
  const [form, setForm] = useState<FormState>({ brief: "", audience: "", product: "", tone: "", channels: ["Email", "LinkedIn"] });
  const [result, setResult] = useState<CampaignStudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return form.brief.trim().length >= 12 && Boolean(form.audience.trim()) && Boolean(form.product.trim()) && Boolean(form.tone.trim()) && form.channels.length > 0 && !loading;
  }, [form, loading]);

  function updateField(field: keyof Omit<FormState, "channels">, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleChannel(channel: string) {
    setForm((current) => {
      const exists = current.channels.includes(channel);
      return {
        ...current,
        channels: exists ? current.channels.filter((item) => item !== channel) : [...current.channels, channel],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaign-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Campaign generation failed.");
      setResult(payload as CampaignStudioResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Campaign generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return <>
    <header className="topbar campaign-topbar">
      <div>
        <p className="eyebrow">Campaign studio</p>
        <h1>Concept, copy, launch plan, and visuals</h1>
        <p className="subtle">Turn a short marketing brief into an editable campaign direction with generated concept imagery.</p>
      </div>
      <button className="secondary-action" type="button" onClick={() => { setForm(sampleBrief); setError(null); }}>
        <Sparkles size={17} /> Use sample brief
      </button>
    </header>

    <section className="campaign-layout">
      <form className="panel campaign-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inputs</p>
            <h2>Campaign brief</h2>
          </div>
        </div>

        <label>
          Short brief
          <textarea value={form.brief} onChange={(event) => updateField("brief", event.target.value)} placeholder="What are you launching and why now?" />
        </label>
        <label>
          Target audience
          <textarea value={form.audience} onChange={(event) => updateField("audience", event.target.value)} placeholder="Who should this persuade?" />
        </label>
        <label>
          Product details
          <textarea value={form.product} onChange={(event) => updateField("product", event.target.value)} placeholder="Core offer, proof points, constraints, differentiators." />
        </label>
        <label>
          Tone
          <input value={form.tone} onChange={(event) => updateField("tone", event.target.value)} placeholder="Confident, playful, premium, technical..." />
        </label>

        <fieldset>
          <legend>Channels</legend>
          <div className="channel-grid">
            {channelOptions.map((channel) => (
              <label className="channel-option" key={channel}>
                <input checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)} type="checkbox" />
                <span>{channel}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <p className="form-error campaign-error" role="alert"><AlertCircle size={17} /> {error}</p> : null}

        <button className="primary-action campaign-submit" type="submit" disabled={!canSubmit}>
          {loading ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
          {loading ? "Generating campaign" : "Generate campaign"}
        </button>
      </form>

      <section className="campaign-results" aria-live="polite">
        {loading ? <LoadingState /> : null}
        {!loading && !result ? <EmptyState /> : null}
        {!loading && result ? <ResultView result={result} /> : null}
      </section>
    </section>
  </>;
}

function LoadingState() {
  return <div className="panel campaign-state"><Loader2 className="spin" size={28} /><h2>Building campaign direction</h2><p className="subtle">Generating structured strategy, copy, checklist, image prompts, and concept images.</p><div className="skeleton-stack"><span /><span /><span /></div></div>;
}

function EmptyState() {
  return <div className="panel campaign-state"><ImageIcon size={30} /><h2>No campaign generated yet</h2><p className="subtle">Fill in the brief and generate a direction. Results will appear here with copy variants, checklist items, image prompts, and generated visuals.</p></div>;
}

function ResultView({ result }: { result: CampaignStudioResult }) {
  return <div className="campaign-output">
    <section className="panel concept-panel">
      <p className="eyebrow">Concept</p>
      <h2>{result.concept.name}</h2>
      <p>{result.concept.summary}</p>
      <p className="quiet">{result.concept.strategicRationale}</p>
      <div className="settings-row"><span>{result.settings.textModel}</span><span>{result.settings.imageModel}</span><span>{result.settings.imageSize}</span></div>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Copy</p><h2>Variants</h2></div></div>
      <div className="copy-grid">
        {result.copyVariants.map((variant, index) => <article className="copy-card" key={`${variant.headline}-${index}`}><span>Variant {index + 1}</span><h3>{variant.headline}</h3><p>{variant.body}</p><small>{variant.channelFit}</small></article>)}
      </div>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Launch</p><h2>Checklist</h2></div></div>
      <div className="checklist">
        {result.launchChecklist.map((item) => <article key={`${item.task}-${item.timing}`}><CheckCircle2 size={17} /><div><h3>{item.task}</h3><p>{item.owner} · {item.timing}</p></div></article>)}
      </div>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Visuals</p><h2>Image prompts and generated images</h2></div><span className="image-count">{result.settings.generatedImages}/{result.images.length}</span></div>
      <div className="image-grid">
        {result.images.map((image) => <article className="image-card" key={image.title}>
          <div className="generated-image">{image.dataUrl ? <img alt={`${image.title} generated campaign direction`} src={image.dataUrl} /> : <div><ImageIcon size={28} /><span>Image unavailable</span></div>}</div>
          <h3>{image.title}</h3>
          <p>{image.usage}</p>
          <details><summary>Prompt</summary><p>{image.prompt}</p></details>
        </article>)}
      </div>
    </section>
  </div>;
}
