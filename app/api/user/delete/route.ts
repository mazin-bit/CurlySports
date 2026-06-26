import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { logger } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const rl = await rateLimit(req, { name: "auth", tokens: 5, window: "1m" });
  if (rl) return rl;

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  // If the user signed up with email/password, require password confirmation
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (dbUser.passwordHash) {
    const body = await req.json().catch(() => ({})) as { password?: string };
    if (!body.password) {
      return NextResponse.json(
        { error: "Password required to delete account", requiresPassword: true },
        { status: 400 }
      );
    }
    const valid = await compare(body.password, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }
  }

  // Delete user — Prisma cascade handles related records
  await prisma.user.delete({ where: { id: user.id } });

  logger.info("User deleted account", { userId: user.id });

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
