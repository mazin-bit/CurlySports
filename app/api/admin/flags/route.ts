import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";

const FLAGS_PATH = path.join(process.cwd(), "data", "flags.json");

function readFlags(): AdminFlags {
  try {
    if (!fs.existsSync(FLAGS_PATH)) {
      writeFlags(DEFAULT_FLAGS);
      return DEFAULT_FLAGS;
    }
    return JSON.parse(fs.readFileSync(FLAGS_PATH, "utf-8"));
  } catch {
    return DEFAULT_FLAGS;
  }
}

function writeFlags(flags: AdminFlags) {
  fs.mkdirSync(path.dirname(FLAGS_PATH), { recursive: true });
  fs.writeFileSync(FLAGS_PATH, JSON.stringify(flags, null, 2));
}

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

// Public read — used by AppShell for maintenance/feature checks
export async function GET() {
  const flags = readFlags();
  // Strip page views + activity log from public read to reduce payload
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
  return NextResponse.json(readFlags());
}

// Admin-only update
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await req.json();
  const current = readFlags();

  // Log the action
  const log = current.activityLog ?? [];
  if (updates._action) {
    log.unshift({ action: updates._action, at: new Date().toISOString() });
    if (log.length > 50) log.length = 50;
    delete updates._action;
  }

  const updated: AdminFlags = {
    ...current,
    ...updates,
    sports: updates.sports ? { ...current.sports, ...updates.sports } : current.sports,
    features: updates.features ? { ...current.features, ...updates.features } : current.features,
    activityLog: log,
  };

  writeFlags(updated);
  return NextResponse.json(updated);
}
