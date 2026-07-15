import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTrackingTables } from "@/lib/ensure-tracking-tables";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

interface CountRow {
  count: bigint;
}

interface PlatformRow {
  platform: string;
  count: bigint;
}

interface CountryRow {
  country: string | null;
  count: bigint;
}

interface DailyRow {
  date: string;
  count: bigint;
}

interface DateRow {
  earliest: Date | null;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTrackingTables();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsersResult,
      activeTodayResult,
      newThisWeekResult,
      totalPageViewsResult,
      sessionPlatformBreakdown,
      installPlatformBreakdown,
      topCountriesResult,
      dailyActiveResult,
      dailyNewResult,
      trackingStartResult,
      firstUserResult,
    ] = await Promise.all([
      // totalUsers — from users table (all-time, day 1)
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as count FROM users`,

      // activeToday — real sessions today only
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(DISTINCT "userId") as count FROM user_sessions
        WHERE "createdAt" >= ${todayStart}
      `,

      // newThisWeek — from users table (real registrations)
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM users
        WHERE "createdAt" >= ${weekAgo}
      `,

      // totalPageViews — from page_views table
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as count FROM page_views`,

      // platformBreakdown — from real sessions only (no fake backfill)
      prisma.$queryRaw<PlatformRow[]>`
        SELECT platform, COUNT(DISTINCT "userId") as count FROM user_sessions
        GROUP BY platform
      `,

      // installs by platform
      prisma.$queryRaw<PlatformRow[]>`
        SELECT platform, COUNT(*) as count FROM app_installs
        GROUP BY platform
      `,

      // topCountries — from real sessions with country data
      prisma.$queryRaw<CountryRow[]>`
        SELECT country, COUNT(DISTINCT "userId") as count FROM user_sessions
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `,

      // dailyActive (last 14 days) — real sessions only
      prisma.$queryRaw<DailyRow[]>`
        SELECT DATE("createdAt") as date, COUNT(DISTINCT "userId") as count
        FROM user_sessions
        WHERE "createdAt" >= ${fourteenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // dailyNew (last 14 days) — from users table (real registrations)
      prisma.$queryRaw<DailyRow[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM users
        WHERE "createdAt" >= ${fourteenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // When tracking started (earliest session record)
      prisma.$queryRaw<DateRow[]>`
        SELECT MIN("createdAt") as earliest FROM user_sessions
      `,

      // When first user registered
      prisma.$queryRaw<DateRow[]>`
        SELECT MIN("createdAt") as earliest FROM users
      `,
    ]);

    // Build platform breakdown object
    const platformBreakdown: Record<string, number> = { ios: 0, android: 0, web: 0 };
    for (const row of sessionPlatformBreakdown) {
      platformBreakdown[row.platform] = Number(row.count);
    }

    // Build installs object
    const installs: Record<string, number> = { ios: 0, android: 0 };
    for (const row of installPlatformBreakdown) {
      if (row.platform === "ios" || row.platform === "android") {
        installs[row.platform] = Number(row.count);
      }
    }

    // Build topCountries array
    const topCountries = topCountriesResult.map((row) => ({
      country: row.country,
      count: Number(row.count),
    }));

    // Build daily arrays
    const dailyActive = dailyActiveResult.map((row) => ({
      date: String(row.date),
      count: Number(row.count),
    }));

    const dailyNew = dailyNewResult.map((row) => ({
      date: String(row.date),
      count: Number(row.count),
    }));

    // Tracking metadata
    const trackingStartDate = trackingStartResult[0]?.earliest
      ? new Date(trackingStartResult[0].earliest).toISOString()
      : null;
    const firstUserDate = firstUserResult[0]?.earliest
      ? new Date(firstUserResult[0].earliest).toISOString()
      : null;

    return NextResponse.json({
      totalUsers: Number(totalUsersResult[0].count),
      activeToday: Number(activeTodayResult[0].count),
      newThisWeek: Number(newThisWeekResult[0].count),
      totalPageViews: Number(totalPageViewsResult[0].count),
      platformBreakdown,
      installs,
      topCountries,
      dailyActive,
      dailyNew,
      trackingStartDate,
      firstUserDate,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch analytics", debug: msg }, { status: 500 });
  }
}
