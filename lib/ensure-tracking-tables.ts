import prisma from "@/lib/prisma";

let tablesEnsured = false;

/**
 * Ensures all tracking tables exist. Runs once per process lifecycle.
 * Does NOT create fake backfill data — historical metrics come from the
 * `users` table directly, while session/pageview/install tracking starts
 * from when the code was deployed.
 */
export async function ensureTrackingTables() {
  if (tablesEnsured) return;

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

  tablesEnsured = true;
}

export function detectPlatform(userAgent: string | null): string {
  if (!userAgent) return "web";
  if (
    /CurlySports-iOS/i.test(userAgent) ||
    (/iPhone|iPad|iPod/i.test(userAgent) && /Expo|ReactNative|okhttp/i.test(userAgent))
  )
    return "ios";
  if (
    /CurlySports-Android/i.test(userAgent) ||
    (/Android/i.test(userAgent) && /Expo|ReactNative|okhttp/i.test(userAgent))
  )
    return "android";
  return "web";
}
