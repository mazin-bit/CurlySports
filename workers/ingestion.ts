/**
 * Curly Sports — Production Ingestion Worker
 *
 * Architecture:
 * 1. BullMQ processes jobs from "curly-sports" queue
 * 2. Each job fetches data from the appropriate source
 * 3. Results are written to Redis cache
 * 4. Redis Pub/Sub notifies SSE endpoints of updates
 * 5. SSE endpoints push updates to all connected browsers
 *
 * Run: npx tsx workers/ingestion.ts
 *
 * Environment:
 *   REDIS_URL or REDIS_HOST/REDIS_PORT — BullMQ connection
 *   UPSTASH_REDIS_REST_URL/TOKEN — Upstash cache (optional)
 */

import "dotenv/config";
import { createWorker, scheduleScoreFetches, getRedisConnection, getQueueStats } from "@/lib/queue";
import type { JobPayload } from "@/lib/queue";
import type { Job } from "bullmq";
import IORedis from "ioredis";

// Use direct Redis for pub/sub (not HTTP Upstash)
const redis = getRedisConnection();

// ─── Redis pub/sub publisher ─────────────────────────────────────────────

async function publish(channel: string, data: unknown) {
  try {
    await redis.publish(channel, JSON.stringify(data));
  } catch (e) {
    console.error("Pub/sub publish error:", e);
  }
}

// ─── ESPN helpers ─────────────────────────────────────────────────────────

const ESPN_BASE = process.env.ESPN_BASE_URL ?? "https://site.api.espn.com/apis/site/v2/sports";

const SPORT_PATHS: Record<string, { path: string; leagueId: string; leagueName: string; leagueShortName: string }[]> = {
  football: [
    { path: "soccer/eng.1", leagueId: "eng.1", leagueName: "Premier League", leagueShortName: "EPL" },
    { path: "soccer/esp.1", leagueId: "esp.1", leagueName: "La Liga", leagueShortName: "LaLiga" },
    { path: "soccer/ger.1", leagueId: "ger.1", leagueName: "Bundesliga", leagueShortName: "BL" },
    { path: "soccer/ita.1", leagueId: "ita.1", leagueName: "Serie A", leagueShortName: "SA" },
    { path: "soccer/fra.1", leagueId: "fra.1", leagueName: "Ligue 1", leagueShortName: "L1" },
    { path: "soccer/uefa.champions", leagueId: "uefa.champions", leagueName: "Champions League", leagueShortName: "UCL" },
    { path: "soccer/usa.1", leagueId: "usa.1", leagueName: "MLS", leagueShortName: "MLS" },
  ],
  basketball: [
    { path: "basketball/nba", leagueId: "nba", leagueName: "NBA", leagueShortName: "NBA" },
    { path: "basketball/wnba", leagueId: "wnba", leagueName: "WNBA", leagueShortName: "WNBA" },
  ],
  nfl: [
    { path: "football/nfl", leagueId: "nfl", leagueName: "NFL", leagueShortName: "NFL" },
  ],
  hockey: [
    { path: "hockey/nhl", leagueId: "nhl", leagueName: "NHL", leagueShortName: "NHL" },
  ],
  baseball: [
    { path: "baseball/mlb", leagueId: "mlb", leagueName: "MLB", leagueShortName: "MLB" },
  ],
  tennis: [
    { path: "tennis/atp.1", leagueId: "atp.1", leagueName: "ATP Tour", leagueShortName: "ATP" },
    { path: "tennis/wta.1", leagueId: "wta.1", leagueName: "WTA Tour", leagueShortName: "WTA" },
  ],
  f1: [
    { path: "racing/f1", leagueId: "f1", leagueName: "Formula 1", leagueShortName: "F1" },
  ],
  mma: [
    { path: "mma/ufc", leagueId: "ufc", leagueName: "UFC", leagueShortName: "UFC" },
  ],
  golf: [
    { path: "golf/pga", leagueId: "pga", leagueName: "PGA Tour", leagueShortName: "PGA" },
  ],
  cricket: [
    { path: "cricket/icc.worldcup", leagueId: "icc.worldcup", leagueName: "ICC World Cup", leagueShortName: "CWC" },
    { path: "cricket/ipl", leagueId: "ipl", leagueName: "IPL", leagueShortName: "IPL" },
  ],
};

async function fetchEspnScoreboard(sportPath: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/${sportPath}/scoreboard`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { events?: unknown[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

async function cacheInRedis(key: string, value: unknown, ttlSeconds: number) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (e) {
    console.warn(`Cache write failed for ${key}:`, e);
  }
}

// ─── Job processors ─────────────────────────────────────────────────────

async function processScores(sport: string) {
  const paths = SPORT_PATHS[sport] ?? [];
  const results = await Promise.allSettled(
    paths.map(async (cfg) => {
      const events = await fetchEspnScoreboard(cfg.path);
      return { ...cfg, events };
    })
  );

  type GroupResult = { path: string; leagueId: string; leagueName: string; leagueShortName: string; events: unknown[] };

  const groups: GroupResult[] = results
    .filter((r): r is PromiseFulfilledResult<GroupResult> => r.status === "fulfilled" && (r as PromiseFulfilledResult<GroupResult>).value.events.length > 0)
    .map((r) => (r as PromiseFulfilledResult<GroupResult>).value);

  const payload = { groups, updatedAt: new Date().toISOString() };

  const hasLive = groups.some((g) =>
    (g.events as { status?: { type?: { name?: string } } }[]).some(
      (e) => e.status?.type?.name?.includes("IN_PROGRESS") || e.status?.type?.name?.includes("HALF")
    )
  );

  await cacheInRedis(`scores:${sport}:now`, payload, hasLive ? 10 : 30);

  // Notify SSE endpoints via pub/sub
  await publish(`sport:scores:${sport}`, payload);

  console.log(`[${sport}] ${groups.reduce((a, g) => a + g.events.length, 0)} events cached. Live: ${hasLive}`);
}

async function processNbaLive() {
  try {
    const res = await fetch("https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;
    const data = await res.json();
    await cacheInRedis("nba:live", data, 15);
    await publish("sport:scores:basketball", { source: "nba_cdn", data, updatedAt: new Date().toISOString() });
  } catch {}
}

async function processNhlLive() {
  try {
    const res = await fetch("https://api-web.nhle.com/v1/schedule/now", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return;
    const data = await res.json();
    await cacheInRedis("nhl:schedule", data, 20);
    await publish("sport:scores:hockey", { source: "nhl", data, updatedAt: new Date().toISOString() });
  } catch {}
}

async function processMlbLive() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return;
    const data = await res.json();
    await cacheInRedis("mlb:schedule", data, 20);
    await publish("sport:scores:baseball", { source: "mlb", data, updatedAt: new Date().toISOString() });
  } catch {}
}

async function processCricketLive() {
  const leagues = ["cricket/icc.worldcup", "cricket/ipl", "cricket/big.bash"];
  for (const league of leagues) {
    try {
      const res = await fetch(`${ESPN_BASE}/${league}/scoreboard`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      await cacheInRedis(`cricket:${league.split("/")[1]}`, data, 30);
    } catch {}
  }
  await publish("sport:scores:cricket", { updatedAt: new Date().toISOString() });
}

async function processTennisLive() {
  const tours = ["tennis/atp.1", "tennis/wta.1", "tennis/atp.slam.french", "tennis/wta.slam.french"];
  for (const tour of tours) {
    try {
      const res = await fetch(`${ESPN_BASE}/${tour}/scoreboard`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      await cacheInRedis(`tennis:${tour.split("/")[1]}`, data, 30);
    } catch {}
  }
  await publish("sport:scores:tennis", { updatedAt: new Date().toISOString() });
}

async function processF1Live() {
  try {
    // OpenF1 latest session
    const [sessionRes, posRes] = await Promise.allSettled([
      fetch("https://api.openf1.org/v1/sessions?session_key=latest"),
      fetch("https://api.openf1.org/v1/position?session_key=latest"),
    ]);

    const sessionData = sessionRes.status === "fulfilled" && sessionRes.value.ok
      ? await sessionRes.value.json() : null;
    const posData = posRes.status === "fulfilled" && posRes.value.ok
      ? await posRes.value.json() : null;

    const payload = { session: sessionData, positions: posData, updatedAt: new Date().toISOString() };
    await cacheInRedis("f1:live", payload, 10);
    await publish("sport:scores:f1", payload);
  } catch {}
}

async function processNews(sport: string) {
  // News fetching is handled by the API route — just invalidate cache
  await redis.del(`news:${sport}`);
  console.log(`[news] Invalidated cache for ${sport}`);
}

// ─── Main worker ──────────────────────────────────────────────────────────

async function processJob(job: Job<JobPayload>) {
  const { type, sport = "football", leagueId, matchId } = job.data;

  switch (type) {
    case "fetch-scores":
      await processScores(sport);
      break;
    case "fetch-nba-live":
      await processNbaLive();
      break;
    case "fetch-nhl-live":
      await processNhlLive();
      break;
    case "fetch-mlb-live":
      await processMlbLive();
      break;
    case "fetch-cricket-live":
      await processCricketLive();
      break;
    case "fetch-tennis-live":
      await processTennisLive();
      break;
    case "fetch-f1-live":
      await processF1Live();
      break;
    case "fetch-news":
      await processNews(sport);
      break;
    default:
      console.warn(`Unknown job type: ${type}`);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────

async function start() {
  console.log("[Worker] Curly Sports Worker starting...");
  console.log(`  Redis: ${process.env.REDIS_URL ? "✓ REDIS_URL" : process.env.REDIS_HOST ?? "localhost:6379"}`);

  // Check Redis connectivity
  try {
    await redis.ping();
    console.log("  Redis: ✓ connected");
  } catch (e) {
    console.error("  Redis: ✗ connection failed:", e);
    console.log("  Running in NO-CACHE mode (will still fetch data)");
  }

  // Start BullMQ worker
  const worker = createWorker(processJob, 10);

  worker.on("completed", (job) => {
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(`  ✓ ${job.data.type} [${job.data.sport ?? "all"}]`);
    }
  });

  worker.on("failed", (job, err) => {
    console.error(`  ✗ ${job?.data.type} failed:`, err.message);
  });

  // Schedule repeating jobs
  await scheduleScoreFetches();
  console.log("  ✓ Job schedules registered");

  // Print stats every 30s
  setInterval(async () => {
    const stats = await getQueueStats();
    console.log(`[Queue] active=${stats.active} waiting=${stats.waiting} failed=${stats.failed} completed=${stats.completed}`);
  }, 30_000);

  console.log("  ✓ Worker listening for jobs");

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down worker...");
    await worker.close();
    await redis.quit();
    process.exit(0);
  });
}

start().catch(console.error);
