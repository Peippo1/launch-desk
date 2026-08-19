type GuardFailure = {
  ok: false;
  status: 400 | 403 | 413 | 429;
  message: string;
  retryAfterSeconds?: number;
};

type GuardSuccess = { ok: true };

type RateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
};

const windows = new Map<string, { count: number; resetAt: number }>();

export function enforceRequestContentLength(request: Request, maxBytes: number): GuardSuccess | GuardFailure {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return { ok: true };

  const length = Number(rawLength);
  if (!Number.isFinite(length) || length < 0) return { ok: false, status: 400, message: "Invalid content length." };
  if (length > maxBytes) return { ok: false, status: 413, message: "Request body is too large." };
  return { ok: true };
}

export function enforceSameOrigin(request: Request): GuardSuccess | GuardFailure {
  const origin = request.headers.get("origin");
  if (!origin) return { ok: true };

  if (origin !== new URL(request.url).origin) {
    return { ok: false, status: 403, message: "Cross-origin requests are not allowed." };
  }

  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) return forwardedFor;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkFixedWindowLimit({ bucket, key, limit, windowMs }: RateLimitOptions): GuardSuccess | GuardFailure {
  const now = Date.now();
  const id = `${bucket}:${key}`;
  const current = windows.get(id);

  if (!current || current.resetAt <= now) {
    windows.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      status: 429,
      message: "Too many requests. Try again shortly.",
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { ok: true };
}

export function resetRateLimitBucket(bucket: string) {
  for (const key of windows.keys()) {
    if (key.startsWith(`${bucket}:`)) windows.delete(key);
  }
}
