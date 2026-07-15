import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(process.env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'web',
      "ipAddress" TEXT,
      country TEXT,
      city TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      route TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'web',
      country TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_installs (
      id TEXT PRIMARY KEY,
      "deviceId" TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL,
      "appVersion" TEXT,
      country TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Backfill: create a session record for each user who doesn't have one yet
  // so historical users show up in analytics from day 1
  await prisma.$executeRawUnsafe(`
    INSERT INTO user_sessions (id, "userId", platform, "createdAt")
    SELECT
      'backfill-' || u.id,
      u.id,
      'web',
      u."createdAt"
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM user_sessions s WHERE s."userId" = u.id
    )
    ON CONFLICT (id) DO NOTHING
  `);
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

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTables();

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
    ] = await Promise.all([
      // totalUsers
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as count FROM users`,

      // activeToday
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM user_sessions
        WHERE "createdAt" >= ${todayStart}
      `,

      // newThisWeek
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM users
        WHERE "createdAt" >= ${weekAgo}
      `,

      // totalPageViews
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as count FROM page_views`,

      // platformBreakdown (sessions)
      prisma.$queryRaw<PlatformRow[]>`
        SELECT platform, COUNT(*) as count FROM user_sessions
        GROUP BY platform
      `,

      // installs by platform
      prisma.$queryRaw<PlatformRow[]>`
        SELECT platform, COUNT(*) as count FROM app_installs
        GROUP BY platform
      `,

      // topCountries
      prisma.$queryRaw<CountryRow[]>`
        SELECT country, COUNT(*) as count FROM user_sessions
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `,

      // dailyActive (last 14 days)
      prisma.$queryRaw<DailyRow[]>`
        SELECT DATE("createdAt") as date, COUNT(DISTINCT "userId") as count
        FROM user_sessions
        WHERE "createdAt" >= ${fourteenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // dailyNew (last 14 days)
      prisma.$queryRaw<DailyRow[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM users
        WHERE "createdAt" >= ${fourteenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
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
    });
  } catch (err) {
    console.error("Analytics error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch analytics", debug: msg }, { status: 500 });
  }
}
