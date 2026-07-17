import prisma from "@/lib/prisma";

let tablesEnsured = false;

/**
 * Ensures all prediction challenge tables exist.
 * Runs once per process lifecycle — uses CREATE TABLE IF NOT EXISTS
 * and ALTER TABLE ADD COLUMN IF NOT EXISTS for forward-compatibility.
 * Safe to call from pooled connections — failures are non-fatal.
 */
export async function ensureChallengeTables() {
  if (tablesEnsured) return;

  // Quick check: if the table already exists, skip all DDL
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM prediction_challenges LIMIT 0`);
    tablesEnsured = true;
    return;
  } catch {
    // Table doesn't exist — try to create it (may fail on PgBouncer)
  }

  // Tables must be created sequentially (votes references challenges, etc.)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS prediction_challenges (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, "imageUrl" TEXT,
      "teamA" TEXT NOT NULL, "teamB" TEXT NOT NULL, "teamALogo" TEXT, "teamBLogo" TEXT,
      "matchId" TEXT, "matchDate" TIMESTAMP(3) NOT NULL, sport TEXT DEFAULT 'football',
      "leagueId" TEXT, status TEXT DEFAULT 'active', result TEXT,
      "winnerCount" INT DEFAULT 10, "prizeName" TEXT, "prizeValue" TEXT, "prizeImage" TEXT,
      "prizeDelivery" TEXT, "totalVotes" INT DEFAULT 0, "totalEntries" INT DEFAULT 0,
      "maxReferralEntries" INT DEFAULT 20,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create remaining tables + indexes in parallel (all independent)
  await Promise.all([
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS challenge_votes (
        id TEXT PRIMARY KEY, "challengeId" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "selectedTeam" TEXT NOT NULL, "isCorrect" BOOLEAN, entries INT DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("challengeId", "userId")
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE,
        "totalReferrals" INT DEFAULT 0, "totalEntries" INT DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY, "referrerUserId" TEXT NOT NULL, "referredUserId" TEXT NOT NULL UNIQUE,
        "referralCodeId" TEXT NOT NULL, status TEXT DEFAULT 'pending', ip TEXT, "deviceId" TEXT,
        "verifiedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS challenge_entries (
        id TEXT PRIMARY KEY, "challengeId" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "baseEntries" INT DEFAULT 0, "referralEntries" INT DEFAULT 0, "totalEntries" INT DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("challengeId", "userId")
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS challenge_winners (
        id TEXT PRIMARY KEY, "challengeId" TEXT NOT NULL, "userId" TEXT NOT NULL,
        entries INT NOT NULL, "drawnAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        notified BOOLEAN DEFAULT false, UNIQUE("challengeId", "userId")
      )
    `),
  ]);

  // User columns + indexes in parallel
  await Promise.all([
    prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "referredBy" TEXT`).catch(() => {}),
    prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "deviceId" TEXT`).catch(() => {}),
    prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "signupIp" TEXT`).catch(() => {}),
    prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardingDone" BOOLEAN DEFAULT false`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_challenges_status ON prediction_challenges(status)`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_challenges_matchDate ON prediction_challenges("matchDate")`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge ON challenge_votes("challengeId")`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_challenge_votes_user ON challenge_votes("userId")`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals("referrerUserId")`).catch(() => {}),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge ON challenge_entries("challengeId")`).catch(() => {}),
  ]);

  tablesEnsured = true;
}

let notifsTableEnsured = false;

export async function ensureNotificationsTable() {
  if (notifsTableEnsured) return;
  // Quick check: skip DDL if table exists
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM scheduled_notifications LIMIT 0`);
    notifsTableEnsured = true;
    return;
  } catch { /* table doesn't exist — create it */ }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetUsers" TEXT[] DEFAULT '{}',
      "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'scheduled',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  notifsTableEnsured = true;
}

/** Generate a referral code from a username */
export function generateReferralCode(username: string): string {
  const prefix = username.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5).padEnd(3, "X");
  const digits = String(Math.floor(Math.random() * 900) + 100);
  return prefix + digits;
}

/** Generate a CUID-like ID */
export function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rand}`;
}
