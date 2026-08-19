import { z } from "zod";

export const applicationDraftOutput = z.object({
  body: z.string().trim().min(1).max(10_000),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(20),
  sourceRefs: z.array(z.string().trim().min(1).max(200)).max(20),
}).strict();

export type ApplicationDraftOutput = z.infer<typeof applicationDraftOutput>;

export type StructuredOutputResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "invalid-json" | "schema-mismatch" };

export function parseStructuredOutput<T>(raw: string, schema: z.ZodType<T>): StructuredOutputResult<T> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid-json" };
  }

  const result = schema.safeParse(parsed);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: "schema-mismatch" };
}
