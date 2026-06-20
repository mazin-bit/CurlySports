import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";
import { logger } from "@/lib/logger";

// In-memory flags store — persists across requests within the same server process.
// For multi-instance deployments, swap this for Redis or database storage.
let flags: AdminFlags = { ...DEFAULT_FLAGS };

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  // Use constant-time comparison for admin token check
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

// Public read
export async function GET() {
  const { pageViews: _pv, activityLog: _al, ...publicFlags } = flags;
  return NextResponse.json(publicFlags, {
    headers: { "Cache-Control": "no-store" },
  });
}

// Admin-only full read
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(flags);
}

// Admin-only update
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await req.json();
  const log = flags.activityLog ?? [];
  if (updates._action) {
    log.unshift({ action: updates._action, at: new Date().toISOString() });
    if (log.length > 50) log.length = 50;
    delete updates._action;
  }

  flags = {
    ...flags,
    ...updates,
    sports: updates.sports ? { ...flags.sports, ...updates.sports } : flags.sports,
    features: updates.features ? { ...flags.features, ...updates.features } : flags.features,
    activityLog: log,
  };

  logger.info("admin flags updated");
  return NextResponse.json(flags);
}
