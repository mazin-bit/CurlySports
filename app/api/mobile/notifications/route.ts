import { NextResponse } from "next/server";
import { optionalAuth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

interface MobileNotif {
  id: string;
  group: "today" | "earlier";
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

function timeAgo(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TAG_META: Record<string, { icon: string; color: string }> = {
  DEBATE: { icon: "spark",   color: "#ff5b3d" },
  GOAL:   { icon: "live",    color: "#ff4444" },
  NEWS:   { icon: "news",    color: "#38c9ff" },
  HOT:    { icon: "flame",   color: "#c8ff3d" },
};

export async function GET() {
  const user = await optionalAuth();
  const supabase = await createClient();
  const now = new Date();
  const todayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch recent posts for activity feed
  const { data: posts } = await supabase
    .from("posts")
    .select("id, author_name, content, sport, tag, likes_count, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(25);

  const notifs: MobileNotif[] = [];

  if (posts) {
    // My posts that got likes (personalised, shown first)
    if (user) {
      const myLiked = posts.filter(p => p.user_id === user.id && (p.likes_count ?? 0) > 0);
      for (const p of myLiked.slice(0, 3)) {
        const dt = new Date(p.created_at);
        const group = dt >= todayCutoff ? "today" : "earlier";
        notifs.push({
          id: `like-${p.id}`,
          group,
          icon: "heart",
          color: "#ff5d9e",
          title: `Your take got ${p.likes_count} like${p.likes_count !== 1 ? "s" : ""}`,
          body: p.content.slice(0, 90) + (p.content.length > 90 ? "..." : ""),
          time: timeAgo(dt, now),
          unread: group === "today",
        });
      }
    }

    // Others' recent posts as activity notifications
    const others = posts.filter(p => !user || p.user_id !== user.id);
    for (const p of others.slice(0, 12)) {
      const dt = new Date(p.created_at);
      const group = dt >= todayCutoff ? "today" : "earlier";
      const meta = TAG_META[p.tag?.toUpperCase()] ?? { icon: "flame", color: "#c8ff3d" };
      notifs.push({
        id: `post-${p.id}`,
        group,
        icon: meta.icon,
        color: meta.color,
        title: `${p.author_name} dropped a take`,
        body: p.content.slice(0, 90) + (p.content.length > 90 ? "..." : ""),
        time: timeAgo(dt, now),
        unread: group === "today",
      });
    }
  }

  return NextResponse.json(notifs.slice(0, 15));
}
