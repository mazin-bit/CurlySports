/**
 * BullMQ Queue System
 *
 * Architecture:
 * ┌─────────────┐    ┌────────────────┐    ┌──────────────────┐
 * │  Schedulers │───▶│  BullMQ Queues │───▶│  Worker Threads  │
 * │ (cron-like) │    │  (in Redis)    │    │  (ingestion.ts)  │
 * └─────────────┘    └────────────────┘    └──────────────────┘
 *                                                    │
 *                                         ┌──────────▼──────────┐
 *                                         │ Redis Pub/Sub        │
 *                                         │ channel: sport:scores│
 *                                         └──────────┬───────────┘
 *                                                    │
 *                                         ┌──────────▼──────────┐
 *                                         │  SSE Endpoints      │
 *                                         │  /api/stream/scores │
 *                                         └─────────────────────┘
 *
 * Queue names:
 * - "scores"    - Fetch live scoreboards (10s live, 60s idle)
 * - "news"      - Fetch news (5min intervals)
 * - "standings" - Fetch standings (10min intervals)
 * - "matches"   - Fetch live match details (8s per active match)
 * - "players"   - Fetch player stats (hourly)
 */

import { Queue, Worker, QueueEvents, type Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? undefined;

// BullMQ needs a dedicated Redis connection (not Upstash HTTP client)
// For production with Upstash, use the TLS Redis connection string
function createRedisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });
  }
  return new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
}

// Singleton connections
let _connection: IORedis | null = null;
export function getRedisConnection(): IORedis {
  if (!_connection) _connection = createRedisConnection();
  return _connection;
}

// ─── Queue definitions ─────────────────────────────────────────────────────

export type JobType =
  | "fetch-scores"
  | "fetch-news"
  | "fetch-standings"
  | "fetch-match-detail"
  | "fetch-player-stats"
  | "fetch-f1-live"
  | "fetch-nba-live"
  | "fetch-cricket-live"
  | "fetch-nhl-live"
  | "fetch-mlb-live"
  | "fetch-tennis-live"
  | "fetch-esports-live"
  | "fetch-ufc-events";

export interface JobPayload {
  type: JobType;
  sport?: string;
  leagueId?: string;
  matchId?: string;
  playerId?: string;
  date?: string;
  priority?: "live" | "standard" | "background";
}

let _queue: Queue | null = null;

export function getQueue(): Queue<JobPayload> {
  if (!_queue) {
    _queue = new Queue<JobPayload>("curly-sports", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    });
  }
  return _queue;
}

// ─── Queue helper functions ────────────────────────────────────────────────

/** Add a job to the queue with appropriate priority */
export async function enqueue(payload: JobPayload, opts?: {
  priority?: number;
  delay?: number;
  jobId?: string;
}) {
  const q = getQueue();
  return q.add(payload.type, payload, {
    priority: opts?.priority ?? (payload.priority === "live" ? 1 : payload.priority === "standard" ? 5 : 10),
    delay: opts?.delay,
    jobId: opts?.jobId, // Deduplication key
  });
}

/** Schedule repeating score fetches */
export async function scheduleScoreFetches() {
  const q = getQueue();
  const SPORTS = ["football", "basketball", "nfl", "hockey", "baseball", "tennis", "f1", "cricket", "mma"];

  for (const sport of SPORTS) {
    // Use upsertJobScheduler for repeating jobs (BullMQ v5+)
    await q.upsertJobScheduler(
      `scores-${sport}`,
      { every: 30_000 },                   // every 30s — SSE stream handles 10s polling
      { name: "fetch-scores", data: { type: "fetch-scores", sport, priority: "live" } }
    );
  }

  // F1 and NBA get their own dedicated fetchers
  await q.upsertJobScheduler("f1-live", { every: 8_000 }, {
    name: "fetch-f1-live", data: { type: "fetch-f1-live", sport: "f1", priority: "live" }
  });
  await q.upsertJobScheduler("nba-live", { every: 15_000 }, {
    name: "fetch-nba-live", data: { type: "fetch-nba-live", sport: "basketball", priority: "live" }
  });
  await q.upsertJobScheduler("nhl-live", { every: 15_000 }, {
    name: "fetch-nhl-live", data: { type: "fetch-nhl-live", sport: "hockey", priority: "live" }
  });
  await q.upsertJobScheduler("mlb-live", { every: 20_000 }, {
    name: "fetch-mlb-live", data: { type: "fetch-mlb-live", sport: "baseball", priority: "live" }
  });
  await q.upsertJobScheduler("cricket-live", { every: 30_000 }, {
    name: "fetch-cricket-live", data: { type: "fetch-cricket-live", sport: "cricket", priority: "standard" }
  });
  await q.upsertJobScheduler("tennis-live", { every: 30_000 }, {
    name: "fetch-tennis-live", data: { type: "fetch-tennis-live", sport: "tennis", priority: "standard" }
  });

  // News: every 5 minutes
  const NEWS_SPORTS = ["football", "basketball", "cricket", "f1", "tennis", "baseball", "nfl"];
  for (const sport of NEWS_SPORTS) {
    await q.upsertJobScheduler(`news-${sport}`, { every: 300_000 }, {
      name: "fetch-news", data: { type: "fetch-news", sport, priority: "background" }
    });
  }

  // Standings: every 10 minutes
  for (const sport of ["football", "basketball", "nfl", "hockey", "baseball"]) {
    await q.upsertJobScheduler(`standings-${sport}`, { every: 600_000 }, {
      name: "fetch-standings", data: { type: "fetch-standings", sport, priority: "background" }
    });
  }
}

// ─── Job worker processor ──────────────────────────────────────────────────

export function createWorker(
  processor: (job: Job<JobPayload>) => Promise<void>,
  concurrency = 5
): Worker<JobPayload> {
  return new Worker<JobPayload>(
    "curly-sports",
    processor,
    {
      connection: getRedisConnection(),
      concurrency,
      limiter: {
        max: 20,       // max 20 jobs per duration
        duration: 1000, // per second
      },
    }
  );
}

// ─── Queue monitoring ──────────────────────────────────────────────────────

export async function getQueueStats() {
  const q = getQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}
