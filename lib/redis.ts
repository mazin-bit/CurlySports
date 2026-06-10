import { Redis } from "@upstash/redis";

// Upstash Redis singleton — works in both Edge and Node.js runtimes
// Falls back to no-op when REDIS_URL is not set (local dev without Redis)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const val = await r.get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch {
    // Non-critical — silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {}
}

// Pub/Sub helpers for SSE fanout
export async function redisPub(channel: string, message: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.publish(channel, message);
  } catch {}
}

export default getRedis;
