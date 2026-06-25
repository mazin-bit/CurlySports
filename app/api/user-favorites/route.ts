import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

// GET /api/user-favorites — list authenticated user's favorites
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data ?? [] });
}

// POST /api/user-favorites — add a favorite
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const supabase = await createClient();

  const { type, espn_id, data: itemData } = await req.json() as {
    type: "team" | "player";
    espn_id: string;
    data: Record<string, unknown>;
  };

  if (!type || !espn_id) return NextResponse.json({ error: "type and espn_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_favorites")
    .upsert({ user_id: user.id, type, espn_id, data: itemData ?? {} }, { onConflict: "user_id,type,espn_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/user-favorites — remove a favorite
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const supabase = await createClient();

  const { type, espn_id } = await req.json() as { type: string; espn_id: string };

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("type", type)
    .eq("espn_id", espn_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
