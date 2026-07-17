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

// ─── In-memory cache fallback (used when Redis is not configured) ──────────

const memCache = new Map<string, { value: unknown; expiresAt: number }>();

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function memSet<T>(key: string, value: T, ttlSeconds: number): void {
  memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string): void {
  memCache.delete(key);
}

// Periodic cleanup of expired entries (every 60s)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memCache) {
      if (now > v.expiresAt) memCache.delete(k);
    }
  }, 60_000).unref?.();
}

// ─── Cache helpers ─────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return memGet<T>(key);
  try {
    const val = await r.get<T>(key);
    return val ?? null;
  } catch {
    return memGet<T>(key);
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  // Always write to memory cache (fast local fallback)
  memSet(key, value, ttlSeconds);
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch {
    // Non-critical — silently fail, memory cache is already set
  }
}

export async function cacheDel(key: string): Promise<void> {
  memDel(key);
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
