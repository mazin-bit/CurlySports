import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";

const FLAGS_PATH = path.join(process.cwd(), "data", "flags.json");

export async function POST(req: NextRequest) {
  const { page } = await req.json().catch(() => ({ page: "unknown" }));

  try {
    let flags: AdminFlags = DEFAULT_FLAGS;
    if (fs.existsSync(FLAGS_PATH)) {
      flags = JSON.parse(fs.readFileSync(FLAGS_PATH, "utf-8"));
    }
    flags.pageViews = flags.pageViews ?? {};
    flags.pageViews[page] = (flags.pageViews[page] ?? 0) + 1;
    fs.mkdirSync(path.dirname(FLAGS_PATH), { recursive: true });
    fs.writeFileSync(FLAGS_PATH, JSON.stringify(flags, null, 2));
  } catch {
    // Silently fail — tracking should never break the app
  }

  return NextResponse.json({ ok: true });
}
