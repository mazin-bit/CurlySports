import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: "Admin password not configured" }, { status: 500 });
  }

  const a = Buffer.from(password ?? "");
  const b = Buffer.from(adminPassword);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (match) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
}
