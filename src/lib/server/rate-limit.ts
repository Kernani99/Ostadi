import 'server-only';

/**
 * محدِّد معدّل بنافذة منزلقة في الذاكرة، لكل مفتاح (معرّف المستخدم).
 * على منصات serverless كل نسخة لها ذاكرتها، فهو حاجز أول ضد الإفراط وليس حصة صارمة؛
 * للحصص الصارمة استعمل مخزناً مشتركاً (Redis/Upstash) أو حدود الإنفاق في لوحة Anthropic.
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}
