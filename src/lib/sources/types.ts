export type SourceRoleCandidate = {
  title: string;
  companyName: string;
  sourcePlatform: string;
  sourceUrl: string;
  location?: string;
  summary?: string;
  requirements: string[];
  responsibilities: string[];
  rawSnapshot: string;
};

export type SourceDiscoveryResult = {
  roles: SourceRoleCandidate[];
  warnings: string[];
};

export type SourceAdapterContext = {
  signal?: AbortSignal;
};

export interface SourceAdapter {
  readonly platform: string;
  discover(context: SourceAdapterContext): Promise<SourceDiscoveryResult>;
  fetch(sourceUrl: string, context: SourceAdapterContext): Promise<string>;
  parse(rawSnapshot: string, sourceUrl: string): SourceRoleCandidate;
  normalise(candidate: SourceRoleCandidate): SourceRoleCandidate;
  healthCheck(context: SourceAdapterContext): Promise<boolean>;
}

export type SourceRunResult =
  | { ok: true; platform: string; result: SourceDiscoveryResult }
  | { ok: false; platform: string; error: "adapter-failure" };
