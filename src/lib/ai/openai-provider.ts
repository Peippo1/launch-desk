import type { StructuredAiProvider, StructuredGenerationRequest, StructuredGenerationResponse } from "./provider";

const applicationDraftSchema = {
  type: "object",
  properties: {
    body: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    sourceRefs: { type: "array", items: { type: "string" } }
  },
  required: ["body", "assumptions", "sourceRefs"],
  additionalProperties: false
};

type OpenAiResponse = {
  status?: string;
  output_text?: unknown;
};

class OpenAiProvider implements StructuredAiProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResponse> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        store: false,
        input: [
          { role: "system", content: "You produce grounded, editable application drafts. Never invent candidate experience." },
          { role: "user", content: request.prompt }
        ],
        text: { format: { type: "json_schema", name: "application_draft", strict: true, schema: applicationDraftSchema } }
      }),
      signal: AbortSignal.timeout(30_000)
    });

    if (!response.ok) throw new Error("AI provider request failed.");
    const payload = await response.json() as OpenAiResponse;
    if (payload.status && payload.status !== "completed") throw new Error("AI provider response was incomplete.");
    if (typeof payload.output_text !== "string" || !payload.output_text.trim()) throw new Error("AI provider returned no draft.");
    return { rawText: payload.output_text };
  }
}

export function createOpenAiProvider(): StructuredAiProvider | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAiProvider(apiKey, process.env.OPENAI_MODEL?.trim() || "gpt-5.6");
}
