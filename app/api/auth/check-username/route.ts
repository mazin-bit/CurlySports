import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimiters } from "@/lib/rate-limit";

const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

export async function GET(req: NextRequest) {
  const limited = await rateLimiters.auth(req);
  if (limited) return limited;

  const username = req.nextUrl.searchParams.get("username")?.trim();
  if (!username || username.length < 2 || username.length > 30 || !USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
