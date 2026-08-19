import type { SourceAdapter, SourceAdapterContext, SourceRunResult } from "./types";

export async function runSourceAdapter(adapter: SourceAdapter, context: SourceAdapterContext = {}): Promise<SourceRunResult> {
  try {
    return { ok: true, platform: adapter.platform, result: await adapter.discover(context) };
  } catch {
    return { ok: false, platform: adapter.platform, error: "adapter-failure" };
  }
}
