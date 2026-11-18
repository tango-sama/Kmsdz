import "server-only";

/**
 * Best-effort in-memory rate limiter (per server instance).
 * On Vercel each warm lambda has its own memory, so this stops casual abuse only.
 * For strict global limits, plug in Upstash Redis / Vercel KV here (see README).
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

/** Test helper. */
export function resetRateLimit() {
  hits.clear();
}
