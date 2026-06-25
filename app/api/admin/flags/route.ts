import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { logger } from "@/lib/logger";

// In-memory cache with TTL to avoid DB reads on every public GET
let cachedFlags: AdminFlags | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

/** Read flags from Supabase, merged with defaults */
async function loadFlags(): Promise<AdminFlags> {
  // Return cache if fresh
  if (cachedFlags && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedFlags;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("admin_flags")
      .select("flags")
      .eq("id", 1)
      .single();

    if (error || !data) {
      logger.warn("admin_flags table not found or empty, using defaults");
      cachedFlags = { ...DEFAULT_FLAGS };
    } else {
      const stored = (data.flags ?? {}) as Partial<AdminFlags>;
      cachedFlags = {
        ...DEFAULT_FLAGS,
        ...stored,
        sports: { ...DEFAULT_FLAGS.sports, ...(stored.sports ?? {}) },
        features: { ...DEFAULT_FLAGS.features, ...(stored.features ?? {}) },
        pageViews: stored.pageViews ?? DEFAULT_FLAGS.pageViews,
        activityLog: stored.activityLog ?? DEFAULT_FLAGS.activityLog,
      };
    }
  } catch {
    logger.warn("Failed to load admin flags from DB, using defaults");
    cachedFlags = { ...DEFAULT_FLAGS };
  }

  cacheTime = Date.now();
  return cachedFlags;
}

/** Write flags to Supabase */
async function saveFlags(flags: AdminFlags): Promise<void> {
  try {
    await supabaseAdmin
      .from("admin_flags")
      .upsert({ id: 1, flags, updated_at: new Date().toISOString() });
  } catch {
    logger.warn("Failed to save admin flags to DB");
  }
  // Update cache immediately
  cachedFlags = flags;
  cacheTime = Date.now();
}

// Public read
export async function GET() {
  const flags = await loadFlags();
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
  const flags = await loadFlags();
  return NextResponse.json(flags);
}

// Admin-only update
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await loadFlags();
  const updates = await req.json();
  const log = flags.activityLog ?? [];
  if (updates._action) {
    log.unshift({ action: updates._action, at: new Date().toISOString() });
    if (log.length > 50) log.length = 50;
    delete updates._action;
  }

  const newFlags: AdminFlags = {
    ...flags,
    ...updates,
    sports: updates.sports ? { ...flags.sports, ...updates.sports } : flags.sports,
    features: updates.features ? { ...flags.features, ...updates.features } : flags.features,
    activityLog: log,
  };

  await saveFlags(newFlags);
  logger.info("admin flags updated");
  return NextResponse.json(newFlags);
}
