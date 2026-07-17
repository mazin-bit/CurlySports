import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { ensureNotificationsTable } from "@/lib/ensure-challenge-tables";

interface MobileNotif {
  id: string;
  group: "today" | "earlier";
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "admin" | "activity";
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

function detectPlatform(ua: string): "ios" | "android" | "web" {
  const lower = ua.toLowerCase();
  if (lower.includes("curlysports-ios") || lower.includes("expo") && lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) return "ios";
  if (lower.includes("curlysports-android") || lower.includes("expo") && lower.includes("android") || lower.includes("android")) return "android";
  return "web";
}

export async function GET(req: NextRequest) {
  const user = await optionalAuth();
  const supabase = await createClient();
  const now = new Date();
  const todayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const headerStore = await headers();
  const ua = headerStore.get("user-agent") || "";
  const platform = detectPlatform(ua);

  const notifs: MobileNotif[] = [];

  // 1. Fetch admin-sent notifications from scheduled_notifications
  try {
    await ensureNotificationsTable();

    // Get notifications that are due (scheduledAt <= now) and not cancelled
    const adminNotifs = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      body: string;
      targetType: string;
      targetUsers: string[];
      scheduledAt: Date;
      status: string;
      createdAt: Date;
    }>>(
      `SELECT id, title, body, "targetType", "targetUsers", "scheduledAt", status, "createdAt"
       FROM scheduled_notifications
       WHERE "scheduledAt" <= $1
       AND status != 'cancelled'
       ORDER BY "scheduledAt" DESC
       LIMIT 20`,
      now
    );

    for (const n of adminNotifs) {
      // Filter by targetType
      const target = n.targetType;
      if (target === "ios" && platform !== "ios") continue;
      if (target === "android" && platform !== "android") continue;
      if (target === "web" && platform !== "web") continue;
      if (target === "user" && user && n.targetUsers?.length > 0) {
        // Check if current user is in the target list (by email or ID)
        if (!n.targetUsers.includes(user.id) && !n.targetUsers.includes(user.email)) continue;
      } else if (target === "user" && !user) {
        continue; // Can't target anonymous users
      }
      // "all" passes through

      const dt = new Date(n.scheduledAt);
      const group = dt >= todayCutoff ? "today" : "earlier";
      notifs.push({
        id: `admin-${n.id}`,
        group,
        icon: "megaphone",
        color: "#c8ff3d",
        title: n.title,
        body: n.body,
        time: timeAgo(dt, now),
        unread: group === "today",
        type: "admin",
      });

      // Mark as sent if still scheduled
      if (n.status === "scheduled") {
        await prisma.$executeRawUnsafe(
          `UPDATE scheduled_notifications SET status = 'sent', "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          n.id
        );
      }
    }
  } catch {
    // If scheduled_notifications table doesn't exist, just skip
  }

  // 2. Fetch recent posts for activity feed
  const { data: posts } = await supabase
    .from("posts")
    .select("id, author_name, content, sport, tag, likes_count, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(25);

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
          type: "activity",
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
        type: "activity",
      });
    }
  }

  // Sort: admin notifications first, then by recency
  notifs.sort((a, b) => {
    if (a.type === "admin" && b.type !== "admin") return -1;
    if (b.type === "admin" && a.type !== "admin") return 1;
    return 0;
  });

  return NextResponse.json(notifs.slice(0, 20));
}
