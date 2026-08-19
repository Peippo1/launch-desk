import type { SourceAdapter, SourceAdapterContext, SourceDiscoveryResult, SourceRoleCandidate } from "./types";
import { normaliseRoleCandidate } from "./normalise";

type AshbyJob = {
  title?: unknown;
  location?: unknown;
  secondaryLocations?: Array<{ location?: unknown }>;
  descriptionPlain?: unknown;
  descriptionHtml?: unknown;
  department?: unknown;
  team?: unknown;
  jobUrl?: unknown;
  applyUrl?: unknown;
  isListed?: unknown;
};

type AshbyBoardResponse = { jobs?: unknown };

export type AshbyAdapterOptions = {
  boardName: string;
  companyName: string;
  fetchImpl?: typeof fetch;
};

export class AshbyAdapter implements SourceAdapter {
  readonly platform = "ashby";
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: AshbyAdapterOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async discover(context: SourceAdapterContext = {}): Promise<SourceDiscoveryResult> {
    const response = await this.fetchImpl(this.boardUrl(), { signal: context.signal });
    if (!response.ok) throw new Error("Ashby board request failed.");
    const payload = await response.json() as AshbyBoardResponse;
    if (!Array.isArray(payload.jobs)) throw new Error("Ashby board response was invalid.");

    const warnings: string[] = [];
    const roles = payload.jobs.flatMap((job) => {
      try {
        const value = job as AshbyJob;
        if (value.isListed === false) return [];
        return [this.normalise(this.parse(JSON.stringify(value), String(value.jobUrl ?? value.applyUrl ?? this.boardUrl())))];
      } catch {
        warnings.push("One Ashby posting could not be parsed.");
        return [];
      }
    });
    return { roles, warnings };
  }

  async fetch(sourceUrl: string, context: SourceAdapterContext = {}): Promise<string> {
    const response = await this.fetchImpl(sourceUrl, { signal: context.signal });
    if (!response.ok) throw new Error("Ashby posting request failed.");
    return response.text();
  }

  parse(rawSnapshot: string, sourceUrl: string): SourceRoleCandidate {
    const job = JSON.parse(rawSnapshot) as AshbyJob;
    const title = requiredText(job.title, "title");
    const location = [requiredText(job.location, "location", false), ...(job.secondaryLocations ?? []).map((item) => text(item.location)).filter(Boolean)].filter(Boolean).join("; ") || undefined;
    const summary = text(job.descriptionPlain) || stripHtml(text(job.descriptionHtml));
    const requirements = [text(job.department), text(job.team)].filter(Boolean);
    return {
      title,
      companyName: this.options.companyName,
      sourcePlatform: this.platform,
      sourceUrl,
      location,
      summary: summary || undefined,
      requirements,
      responsibilities: [],
      rawSnapshot
    };
  }

  normalise(candidate: SourceRoleCandidate): SourceRoleCandidate { return normaliseRoleCandidate(candidate); }

  async healthCheck(context: SourceAdapterContext = {}): Promise<boolean> {
    try {
      const response = await this.fetchImpl(this.boardUrl(), { signal: context.signal, method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  private boardUrl() { return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(this.options.boardName)}?listedOnly=true`; }
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function requiredText(value: unknown, field: string, required = true): string { const result = text(value); if (required && !result) throw new Error(`Ashby posting is missing ${field}.`); return result; }
function stripHtml(value: string): string { return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
