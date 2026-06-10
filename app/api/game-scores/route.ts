import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/game-scores?game_type=quiz&week=1 — weekly leaderboard (top 10)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const game_type = searchParams.get("game_type") ?? "quiz";

  // Weekly window: Monday 00:00 UTC to Sunday 23:59 UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("game_scores")
    .select("id, username, sport, score, created_at")
    .eq("game_type", game_type)
    .gte("created_at", weekStart.toISOString())
    .order("score", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ leaderboard: [] });
  return NextResponse.json({ leaderboard: data ?? [], week_start: weekStart.toISOString() });
}

// POST /api/game-scores — submit a game score
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { game_type, sport, score } = await req.json() as {
    game_type: "quiz" | "player_guess";
    sport: string;
    score: number;
  };

  if (!game_type || !sport || typeof score !== "number") {
    return NextResponse.json({ error: "game_type, sport and score required" }, { status: 400 });
  }

  const username = user.user_metadata?.full_name
    ?? user.user_metadata?.name
    ?? user.email?.split("@")[0]
    ?? "Player";

  const { data, error } = await supabase
    .from("game_scores")
    .insert({ user_id: user.id, username, game_type, sport, score })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
