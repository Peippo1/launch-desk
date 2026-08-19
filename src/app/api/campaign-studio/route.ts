import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  buildCampaignPrompt,
  buildImagePrompt,
  campaignOutputJsonSchema,
  campaignStudioInput,
  extractImageDataUrls,
  parseCampaignOutput,
  type CampaignImage,
  type CampaignStudioResult,
} from "@/lib/campaign-studio";
import { checkFixedWindowLimit, enforceRequestContentLength, enforceSameOrigin, getClientIp } from "@/lib/security/request-guards";
import { assertWorkspaceWithinQuota, createCampaignProjectRecord } from "@/lib/product/repository";

type ResponsesPayload = {
  status?: string;
  output_text?: unknown;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function callResponses(apiKey: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ store: false, ...body }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) throw new Error("OpenAI Responses request failed.");
  const payload = await response.json() as ResponsesPayload;
  if (payload.status && payload.status !== "completed") throw new Error("OpenAI Responses request did not complete.");
  return payload;
}

export async function POST(request: NextRequest) {
  const identity = await getWorkspaceIdentity(request);
  if (!identity) return jsonError("Unauthorized", 401);

  const originGuard = enforceSameOrigin(request);
  if (!originGuard.ok) return jsonError(originGuard.message, originGuard.status);

  const sizeGuard = enforceRequestContentLength(request, 64_000);
  if (!sizeGuard.ok) return jsonError(sizeGuard.message, sizeGuard.status);

  const rateLimit = checkFixedWindowLimit({ bucket: "campaign-studio", key: `${identity.userId}:${getClientIp(request)}`, limit: 8, windowMs: 60_000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, {
      status: rateLimit.status,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) },
    });
  }

  const quota = await assertWorkspaceWithinQuota(db, identity);
  if (!quota.ok) return NextResponse.json({ error: quota.message, usage: quota.usage, quota: quota.quota }, { status: quota.status });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return jsonError("AI generation is not configured on the server.", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsedInput = campaignStudioInput.safeParse(body);
  if (!parsedInput.success) return jsonError(parsedInput.error.issues[0]?.message ?? "Invalid campaign brief.", 400);

  const input = parsedInput.data;
  const textModel = process.env.OPENAI_CAMPAIGN_TEXT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5.6";
  const imageModel = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  const imageSize = process.env.OPENAI_IMAGE_SIZE?.trim() || "1024x1024";

  try {
    const textPayload = await callResponses(apiKey, {
      model: textModel,
      input: [
        {
          role: "system",
          content: "You are a senior campaign strategist. Return only schema-valid JSON for the requested campaign concept.",
        },
        { role: "user", content: buildCampaignPrompt(input) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "campaign_concept_studio",
          strict: true,
          schema: campaignOutputJsonSchema,
        },
      },
    }) as ResponsesPayload;

    if (typeof textPayload.output_text !== "string" || !textPayload.output_text.trim()) {
      throw new Error("OpenAI returned no structured campaign output.");
    }

    const campaign = parseCampaignOutput(textPayload.output_text);
    const imageDirections = campaign.imageDirections.slice(0, 2);
    const images: CampaignImage[] = [];

    for (const direction of imageDirections) {
      const imagePayload = await callResponses(apiKey, {
        model: imageModel,
        input: buildImagePrompt(direction, input),
        tools: [{ type: "image_generation", size: imageSize }],
      });
      images.push({
        title: direction.title,
        prompt: direction.prompt,
        usage: direction.usage,
        dataUrl: extractImageDataUrls(imagePayload)[0] ?? null,
      });
    }

    const result: CampaignStudioResult = {
      ...campaign,
      images,
      settings: {
        textModel,
        imageModel,
        imageSize,
        generatedImages: images.filter((image) => image.dataUrl).length,
      },
    };

    await createCampaignProjectRecord(db, identity, {
      input,
      result,
      generatedImages: result.settings.generatedImages,
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return jsonError("Campaign generation failed. Check model access, API key permissions, and prompt inputs, then retry.", 502);
  }
}
