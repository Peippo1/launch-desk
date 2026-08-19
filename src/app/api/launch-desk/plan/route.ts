import { NextResponse } from "next/server";
import { getWorkspaceIdentity, shouldBypassLocalE2EDatabase } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { launchPlanRequestSchema, streamLaunchPlan, type LaunchDeskStreamEvent } from "@/lib/launch-desk/agent";
import { assertWorkspaceWithinQuota, createLaunchPlanRecord } from "@/lib/product/repository";
import { checkFixedWindowLimit, enforceRequestContentLength, enforceSameOrigin, getClientIp } from "@/lib/security/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const identity = await getWorkspaceIdentity(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bypassDatabase = shouldBypassLocalE2EDatabase(request);

  const originGuard = enforceSameOrigin(request);
  if (!originGuard.ok) return NextResponse.json({ error: originGuard.message }, { status: originGuard.status });

  const sizeGuard = enforceRequestContentLength(request, 72_000);
  if (!sizeGuard.ok) return NextResponse.json({ error: sizeGuard.message }, { status: sizeGuard.status });

  const rateLimit = checkFixedWindowLimit({ bucket: "launch-desk", key: `${identity.userId}:${getClientIp(request)}`, limit: 10, windowMs: 60_000 });
  if (!rateLimit.ok) return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } });

  if (!bypassDatabase) {
    const quota = await assertWorkspaceWithinQuota(db, identity);
    if (!quota.ok) return NextResponse.json({ error: quota.message, usage: quota.usage, quota: quota.quota }, { status: quota.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = launchPlanRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Launch brief is incomplete or invalid.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json({ error: "AI generation is not configured on the server." }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let toolEvents = 0;
      let textChars = 0;
      try {
        for await (const event of streamLaunchPlan(parsed.data.brief, request.signal)) {
          if (event.type === "tool_progress") toolEvents += 1;
          if (event.type === "text_delta") textChars += event.data.delta.length;
          if (event.type === "done" && !bypassDatabase) {
            await createLaunchPlanRecord(db, identity, {
              brief: parsed.data.brief,
              finalOutput: event.data.finalOutput,
              toolEvents,
              textChars,
            });
          }
          controller.enqueue(encoder.encode(serializeEvent(event)));
        }
      } catch (error) {
        const message = error instanceof Error && process.env.NODE_ENV !== "production" ? error.message : "Launch Desk failed to generate a plan.";
        controller.enqueue(encoder.encode(serializeEvent({ type: "error", data: { message } })));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

function serializeEvent(event: LaunchDeskStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
