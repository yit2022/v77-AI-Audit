type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = opts.now ?? Date.now();
  const existing = buckets.get(opts.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterSec: Math.ceil(opts.windowMs / 1000) };
  }
  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  buckets.set(opts.key, existing);
  return { ok: true, remaining: opts.limit - existing.count, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
}

/** Test helper */
export function resetRateLimits() {
  buckets.clear();
}
