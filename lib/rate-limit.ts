import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting using Upstash Redis (already a project dependency).
 * Falls back to no-op when Upstash is not configured (local dev).
 */

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

// Pre-configured rate limiters for different tiers
const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, tokens: number, window: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const key = `${name}:${tokens}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
        analytics: true,
        prefix: `rl:${name}`,
      })
    );
  }
  return limiters.get(key)!;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit. Returns null if allowed, or a 429 response if exceeded.
 */
export async function rateLimit(
  req: NextRequest,
  opts: { name: string; tokens: number; window: string; identifier?: string }
): Promise<NextResponse | null> {
  const limiter = getLimiter(opts.name, opts.tokens, opts.window);
  if (!limiter) return null; // No Redis = no rate limiting (dev)

  const id = opts.identifier || getClientIp(req);
  const { success, limit, remaining, reset } = await limiter.limit(id);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

// Pre-built rate limit checkers
export const rateLimiters = {
  /** Auth endpoints: 5 requests per minute per IP */
  auth: (req: NextRequest) => rateLimit(req, { name: "auth", tokens: 5, window: "1m" }),
  /** Admin auth: 3 requests per minute per IP */
  adminAuth: (req: NextRequest) => rateLimit(req, { name: "admin-auth", tokens: 3, window: "1m" }),
  /** Post creation: 10 per hour per user */
  createPost: (req: NextRequest, userId: string) =>
    rateLimit(req, { name: "create-post", tokens: 10, window: "1h", identifier: userId }),
  /** Comments: 30 per hour per user */
  createComment: (req: NextRequest, userId: string) =>
    rateLimit(req, { name: "create-comment", tokens: 30, window: "1h", identifier: userId }),
  /** General API: 60 requests per minute per IP */
  api: (req: NextRequest) => rateLimit(req, { name: "api", tokens: 60, window: "1m" }),
};
