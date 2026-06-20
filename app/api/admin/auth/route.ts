import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { parseBody, adminAuthSchema } from "@/lib/validation";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Rate limit: 3 attempts per minute per IP
  const limited = await rateLimiters.adminAuth(req);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(adminAuthSchema, body);
  if (!parsed.success) return parsed.response;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 500 });
  }

  const a = Buffer.from(parsed.data.password);
  const b = Buffer.from(adminPassword);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (match) {
    logger.info("admin auth success");
    return NextResponse.json({ ok: true });
  }

  logger.warn("admin auth failed");
  return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
}
