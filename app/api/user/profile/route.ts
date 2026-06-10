import { NextResponse } from "next/server";
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
      email: user.email!,
      username: user.user_metadata?.username ?? user.email!.split("@")[0],
      name: user.user_metadata?.full_name ?? null,
      avatar: user.user_metadata?.avatar_url ?? null,
    },
  });

  return NextResponse.json(profile);
}
