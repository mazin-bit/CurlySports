import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";

// In-memory flags store — persists across requests within the same server process.
// For multi-instance deployments, swap this for Redis or database storage.
let flags: AdminFlags = { ...DEFAULT_FLAGS };

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
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

  return NextResponse.json(flags);
}
