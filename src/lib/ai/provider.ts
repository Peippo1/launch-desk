import { applicationDraftOutput, parseStructuredOutput, type ApplicationDraftOutput } from "./contracts";
import { buildApplicationWriterPrompt, type ApplicationWriterPromptInput } from "./guardrails";
import { getPromptDefinition } from "./registry";

export type StructuredGenerationRequest = {
  promptId: "application-writer";
  promptVersion: "v1";
  prompt: string;
};

export type StructuredGenerationResponse = {
  rawText: string;
};

export interface StructuredAiProvider {
  generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResponse>;
}

export type ApplicationDraftResult =
  | { ok: true; value: ApplicationDraftOutput; promptVersion: "v1" }
  | { ok: false; error: "provider-failure" | "invalid-json" | "schema-mismatch" };

export async function generateApplicationDraft(provider: StructuredAiProvider, input: ApplicationWriterPromptInput): Promise<ApplicationDraftResult> {
  const definition = getPromptDefinition("application-writer", "v1");

  let response: StructuredGenerationResponse;
  try {
    response = await provider.generateStructured({
      promptId: definition.id,
      promptVersion: definition.version,
      prompt: buildApplicationWriterPrompt(input),
    });
  } catch {
    return { ok: false, error: "provider-failure" };
  }

  const parsed = parseStructuredOutput(response.rawText, applicationDraftOutput);
  return parsed.ok ? { ok: true, value: parsed.value, promptVersion: definition.version } : parsed;
}
