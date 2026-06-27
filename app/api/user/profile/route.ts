import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/profile — returns the authenticated user's profile
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  // Upsert: create a profile row the first time we see this user
  const profile = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
  });

  return NextResponse.json(profile);
}

// PATCH /api/user/profile — update profile fields (favTeam, name, avatar)
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};

  if (body.favTeam !== undefined) allowed.favTeam = body.favTeam;
  if (typeof body.name === "string") allowed.name = body.name.trim().slice(0, 100);
  if (typeof body.avatar === "string") allowed.avatar = body.avatar.trim().slice(0, 500);

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: allowed,
  });

  return NextResponse.json(updated);
}
