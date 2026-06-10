# Curly Sports — Production Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                            │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Sofascore│  │  FotMob  │  │   ESPN   │  │ OpenF1   │         │
│  │ (unoff.) │  │ (unoff.) │  │ (unoff.) │  │(official)│         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       └─────────────┴──────────────┴──────────────┘              │
│                              │                                    │
│                   ┌──────────▼──────────┐                        │
│                   │  BullMQ Job Queue   │                        │
│                   │  (Redis-backed)     │                        │
│                   └──────────┬──────────┘                        │
│                              │                                    │
│                   ┌──────────▼──────────┐                        │
│                   │  Worker Processes   │                        │
│                   │  workers/ingestion  │                        │
│                   └──────────┬──────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
          ┌────────────────────▼────────────────────┐
          │              CACHE LAYER                  │
          │                                           │
          │  ┌────────────────┐  ┌─────────────────┐ │
          │  │  Redis Cache   │  │  Redis Pub/Sub  │ │
          │  │  (Upstash)     │  │  Channels       │ │
          │  │  TTL: 10-3600s │  │  sport:scores:* │ │
          │  └───────┬────────┘  └────────┬────────┘ │
          └──────────┼──────────────────────┼─────────┘
                     │                      │
          ┌──────────▼──────────┐  ┌────────▼──────────┐
          │   Next.js API       │  │   SSE Endpoints   │
          │   Routes            │  │   /api/stream/*   │
          │   /api/espn/*       │  │   pub/sub fanout  │
          └──────────┬──────────┘  └────────┬──────────┘
                     │                      │
          ┌──────────▼──────────────────────▼──────────┐
          │              BROWSER                         │
          │  EventSource → useScoresStream hook         │
          │  → LiveScoresClient → renders match rows    │
          └─────────────────────────────────────────────┘
```

---

## Data Sources by Sport

### 1. Football

| Source | Type | Data | Rate Limit |
|--------|------|------|------------|
| **ESPN Unofficial** | JSON REST | Scores, lineups, standings | ~300ms/req |
| **Sofascore Unofficial** | JSON REST | Live events, incidents, xG, ratings | 60 req/min |
| **FotMob Unofficial** | JSON REST | xG, shot maps, momentum, heatmaps | 40 req/min |
| **Ergast** (historical) | JSON REST | F1/historical reference | generous |
| **TheSportsDB** | JSON REST | Team metadata, logos, histories | free tier |

**How to discover hidden APIs:**
1. Open Chrome DevTools → Network tab → Filter: `Fetch/XHR`
2. Navigate to sofascore.com → watch for `api.sofascore.com/api/v1/...`
3. Right-click request → Copy → Copy as cURL
4. The request headers (Referer, Origin, x-fm-req) are what you need to replicate

**Sofascore key endpoints:**
```
GET /sport/football/events/live           → all live football
GET /sport/football/scheduled-events/{YYYY-MM-DD}  → day schedule
GET /event/{id}/incidents                 → goals, cards, subs
GET /event/{id}/statistics                → possession, shots
GET /event/{id}/lineups                   → formations, players
GET /unique-tournament/{id}/standings/total  → league table
GET /player/{id}/unique-tournament/{tid}/season/{sid}/statistics/overall
```

**FotMob key endpoints:**
```
GET /api/matches?date={YYYYMMDD}          → day schedule
GET /api/matchDetails?matchId={id}        → full match: xG, shots, timeline
GET /api/leagues?id={id}&ccode3=GBR       → standings
```

**Anti-bot bypass:**
- Sofascore: Send `Referer: https://www.sofascore.com/` header
- FotMob: Send `x-fm-req: eyJhbGciOiJIUzI1NiJ9` + Referer header
- Both: Standard browser user-agent
- Neither requires captcha solving for JSON API endpoints

**Live goal detection:**
```typescript
// Sofascore incidents polling
const incidents = await sofascore.fetchMatchTimeline(matchId);
const newGoals = incidents.filter(i =>
  i.incidentType === "goal" && !seenIds.has(i.id)
);
if (newGoals.length > 0) {
  await redis.publish(`match:${matchId}:events`, JSON.stringify(newGoals));
}
```

---

### 2. Basketball (NBA)

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **NBA CDN** | JSON | Live scoreboard, boxscore, play-by-play | Free, fast |
| **NBA Stats API** | JSON | Advanced stats (PER, TS%, ORTG) | Needs browser headers |
| **ESPN Unofficial** | JSON | Scores, news | Free |

**NBA CDN endpoints (best for live):**
```
https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json
https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json
https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_{gameId}.json
```

**NBA Stats API (needs these headers):**
```typescript
headers: {
  "Referer": "https://www.nba.com/",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  "User-Agent": "Mozilla/5.0...",
}
```

**Live play-by-play structure:**
```json
{
  "game": {
    "actions": [{
      "actionNumber": 1,
      "period": 1,
      "clock": "PT11M47.00S",
      "teamId": 1610612738,
      "personId": 1629029,
      "description": "Stephen Curry makes 3-pt jump shot",
      "shotDistance": 25.4,
      "xLegacy": -142,
      "yLegacy": 214,
      "actionType": "3pt",
      "qualifiers": ["pointsinthepaint"]
    }]
  }
}
```

---

### 3. Cricket

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **ESPN Cricinfo** | JSON REST | Scores, scorecards, commentary | Free |
| **CricAPI** | REST | Scores, fixtures | 100 req/day free |
| **ESPN Cricket** | JSON | Schedules, results | Free |

**ESPN Cricinfo unofficial API:**
```
https://hs-consumer-api.espncricinfo.com/v1/pages/match/live?matchId={id}
```
Returns full live scorecard with ball-by-ball commentary.

**Cricbuzz** has an unofficial API but changes frequently:
```
https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live
```
(Requires RapidAPI key — limited free tier)

**Live wicket detection:**
```typescript
// Poll commentary API every 15s
const commentary = await cricInfo.fetchCommentary(matchId);
const newWickets = commentary.filter(c =>
  c.ballCommentary?.includes("WICKET") && !seenCommentary.has(c.id)
);
```

**Cricket match event structure:**
```json
{
  "inning": 1,
  "over": 12.3,
  "batsman": "Virat Kohli",
  "bowler": "James Anderson",
  "runs": 4,
  "extraType": null,
  "isWicket": false,
  "wicketType": null,
  "fieldsman": null,
  "commentary": "Flicked off the pads, raced to the boundary"
}
```

---

### 4. Formula 1

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **OpenF1** | REST | Real-time: positions, intervals, laps | Free, no key |
| **Ergast** | REST | Historical: results, standings, lap times | Free, deprecated |
| **ESPN Racing** | REST | Race schedules | Free |

**OpenF1 real-time endpoints:**
```
GET /v1/sessions?session_key=latest        → current session
GET /v1/position?session_key=latest        → live positions
GET /v1/intervals?session_key=latest       → gaps between cars
GET /v1/laps?session_key={key}             → lap times
GET /v1/drivers?session_key={key}          → driver info
GET /v1/race_control?session_key=latest    → safety car, DRS zones
GET /v1/pit?session_key=latest             → pit stops
GET /v1/weather?session_key=latest         → track conditions
```

**Update frequency:** OpenF1 data is ~1-3 second delayed from live timing.
For sub-second latency, Formula 1 sells live timing via their official F1 Timing App API
(€15k/year B2B contract — not feasible for small platforms).

**Live position tracking (fastest approach):**
```typescript
// Poll every 3s during race session
const positions = await fetchF1Positions("latest");
// Build sorted leaderboard
const leaderboard = positions
  .reduce((map, pos) => {
    if (!map[pos.driver_number] || pos.date > map[pos.driver_number].date) {
      map[pos.driver_number] = pos;
    }
    return map;
  }, {} as Record<number, F1Position>);
```

---

### 5. Tennis

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **ESPN Tennis** | REST | Live scores, draws, rankings | Free |
| **ATP/WTA official** | HTML (JS-rendered) | Official rankings | Needs Playwright |

**Hidden ATP API** (discovered via DevTools on atptour.com):
```
https://www.atptour.com/en/scores/current/{tournamentId}/draws
```
Returns HTML but embeds JSON in `window.__INITIAL_STATE__`.

**TennisAbstract** data:
- Match stats CSV: `https://www.tennisabstract.com/charting/{year}/{matchId}.csv`
- No scraping needed — direct CSV download

**Set score structure in ESPN:**
```json
{
  "linescores": [
    {"displayValue": "6"},  // Set 1
    {"displayValue": "4"},  // Set 2
    {"displayValue": "7"}   // Set 3
  ],
  "serveIndicator": 1       // 1 = currently serving
}
```

---

### 6. Baseball (MLB)

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **MLB Stats API** | REST | Official free API | No key needed |
| **Baseball Savant** | CSV download | Statcast data | Free |
| **Baseball Reference** | HTML | Historical stats | HTML parsing |

**MLB live game feed** — updates every ~5 seconds:
```
GET https://statsapi.mlb.com/api/v1.1/game/{gamePk}/feed/live
```

**Statcast (launch angle, exit velocity, spin rate):**
```typescript
// Baseball Savant CSV download
const csv = await fetch(
  `https://baseballsavant.mlb.com/statcast_search/csv?type=batter&mlb_id=${playerId}&year=${year}`
);
// Parse CSV → structured data
```

---

### 7. American Football (NFL)

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **ESPN Unofficial** | REST | Scores, stats, fantasy | Free |
| **NFL official** | REST | Limited official data | Free |

**ESPN NFL live data structure:**
```json
{
  "drive": {
    "description": "12 plays, 75 yards, 7:23",
    "plays": [{
      "type": { "text": "Pass" },
      "description": "Patrick Mahomes pass short right to Travis Kelce for 8 yards",
      "clock": { "displayValue": "7:45" },
      "period": { "number": 2 }
    }]
  }
}
```

---

### 8. MMA / UFC

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **ESPN Unofficial** | REST | Event schedule, results | Free |
| **UFCStats** | HTML | Career fight stats | HTML parsing |
| **Tapology** | HTML | Fight records, odds | HTML parsing |

**UFCStats key stats:**
- SLpM: Significant Strikes Landed per Minute
- StrAcc%: Strike accuracy
- TDAvg: Takedown average per 15 min
- SubAvg: Submission average per 15 min

---

### 9. Hockey (NHL)

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **NHL Official API** | REST | Complete official data | Free, no key |

**NHL API v1 (new 2023):**
```
GET https://api-web.nhle.com/v1/schedule/now    → today's games
GET https://api-web.nhle.com/v1/gamecenter/{id}/boxscore  → live boxscore
GET https://api-web.nhle.com/v1/gamecenter/{id}/play-by-play  → every play
GET https://api-web.nhle.com/v1/standings/now   → NHL standings
GET https://api-web.nhle.com/v1/player/{id}/landing  → player stats
```

**Live goal update detection:**
```typescript
const prev = lastBoxscore?.goals?.length ?? 0;
const curr = boxscore?.goals?.length ?? 0;
if (curr > prev) {
  const newGoals = boxscore.goals.slice(prev);
  await redis.publish(`nhl:${gameId}:goals`, JSON.stringify(newGoals));
}
```

---

### 10. Esports

| Source | Type | Data | Notes |
|--------|------|------|-------|
| **PandaScore** | REST | CS2, LoL, Dota, Val, OW | Free tier: 1k req/hr |
| **HLTV** | HTML/WS | CS2 — heavy Cloudflare | Playwright needed |
| **Liquipedia** | MediaWiki API | Brackets, rosters | Free |
| **Tracker.gg** | REST | Player stats | API key needed |

**HLTV Cloudflare bypass (Playwright):**
```typescript
import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  userAgent: "Mozilla/5.0...",
  extraHTTPHeaders: { "Accept-Language": "en-US" },
});
const page = await context.newPage();
await page.goto("https://www.hltv.org/matches");
const data = await page.evaluate(() => window.__INITIAL_DATA__);
```

---

## Real-Time Update Flow

```
ESPN API (10s poll) ──┐
Sofascore (10s poll) ─┤
FotMob (15s poll) ────┤
OpenF1 (3s poll) ─────┤
NHL API (8s poll) ────┤──▶ BullMQ Worker ──▶ Normalize ──▶ Redis Cache
NBA CDN (5s poll) ────┤                               ──▶ Redis Pub/Sub
MLB API (5s poll) ────┘                                        │
                                                               │
                                          ┌────────────────────▼────────────────────┐
                                          │  /api/stream/scores SSE Handler          │
                                          │  (subscribed to Redis channel)            │
                                          │  Sends "update" event to all browsers    │
                                          └────────────────────┬────────────────────┘
                                                               │
                                          ┌────────────────────▼────────────────────┐
                                          │  Browser EventSource                     │
                                          │  useScoresStream hook                    │
                                          │  React state update → re-render          │
                                          └─────────────────────────────────────────┘
```

**Total latency goal score → browser update:**
- ESPN API lag: 5-30 seconds
- Worker poll interval: 10 seconds
- Redis pub/sub: <1ms
- Browser SSE receive: <1ms
- React render: <16ms (one frame)
- **Total: ~15-40 seconds** (limited by data source freshness)

For sub-5-second updates, you need official data partner contracts:
- Opta/StatsPerform: ~€50k/year
- Sportradar: ~€80k/year
- Stats Perform: ~€40k/year

---

## Redis Caching Strategy

```
Key pattern            | TTL    | Contents
-----------------------|--------|------------------------------------------
scores:{sport}:now     | 10s*   | LeagueGroup[] for live sports
scores:{sport}:{date}  | 120s   | Historical date scores
match:{id}             | 8s*    | Full match detail
news:{sport}           | 300s   | NormalizedNews[] (5 minutes)
standings:{sport}:*    | 600s   | Standings tables (10 minutes)
f1:live                | 10s    | OpenF1 race state
nhl:schedule           | 20s    | NHL today's games
mlb:schedule           | 20s    | MLB today's games
nba:live               | 15s    | NBA CDN scoreboard
player:{id}            | 3600s  | Player stats (1 hour)
team:{id}              | 3600s  | Team roster (1 hour)
health:test            | 10s    | Health check probe

* = shorter TTL when live matches active
```

---

## BullMQ Queue System

```
Queue: "curly-sports"

Job schedulers (repeating):
  scores-football     → every 30s    → processScores("football")
  scores-basketball   → every 30s    → processScores("basketball")
  nba-live            → every 15s    → processNbaLive()
  nhl-live            → every 15s    → processNhlLive()
  mlb-live            → every 20s    → processMlbLive()
  f1-live             → every 8s     → processF1Live()
  cricket-live        → every 30s    → processCricketLive()
  news-football       → every 5min   → processNews("football")
  standings-football  → every 10min  → invalidateStandings("football")

Priority levels:
  1 = LIVE (goals, active matches)
  5 = STANDARD (schedules, standings)
  10 = BACKGROUND (news, player stats)

Concurrency: 10 jobs simultaneously
Rate limiting: max 20 jobs/second
Retry: 3 attempts, exponential backoff (2s, 4s, 8s)
```

---

## Playwright Scraper Setup (for sites with bot protection)

```typescript
// scrapers/utils/browser.ts
import { chromium, type Browser, type BrowserContext } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<BrowserContext> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    viewport: { width: 1280, height: 720 },
    javaScriptEnabled: true,
    // Stealth: don't expose navigator.webdriver
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  // Intercept and extract API calls
  context.on("request", (request) => {
    if (request.url().includes("api.sofascore.com")) {
      console.log("Sofascore API call:", request.url());
    }
  });

  return context;
}
```

---

## Proxy Rotation

For sites that block by IP (HLTV, some Sofascore endpoints):

```typescript
// lib/proxy.ts
const PROXIES = process.env.PROXY_LIST?.split(",") ?? [];

export function getRandomProxy(): string | undefined {
  if (!PROXIES.length) return undefined;
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

// Use with Playwright:
const context = await browser.newContext({
  proxy: { server: getRandomProxy() ?? "" },
});

// Use with fetch (via HTTPS proxy):
import { HttpsProxyAgent } from "https-proxy-agent";
const agent = new HttpsProxyAgent(getRandomProxy());
fetch(url, { agent });
```

Free proxy services: Bright Data (free trial), Oxylabs, IPRoyal.
For production: Residential proxies ~$3-15/GB.

---

## Event Deduplication

```typescript
// Every match event gets a content hash
function hashEvent(event: MatchEvent): string {
  return `${event.matchId}:${event.type}:${event.minute}:${event.playerId ?? ""}`;
}

// Track seen events in Redis (TTL = 24h)
async function isNewEvent(event: MatchEvent): Promise<boolean> {
  const key = `seen_event:${hashEvent(event)}`;
  const exists = await redis.exists(key);
  if (exists) return false;
  await redis.setex(key, 86400, "1");
  return true;
}

// Only publish truly new events
const newEvents = await Promise.all(
  events.map(async (e) => (await isNewEvent(e)) ? e : null)
);
const toPublish = newEvents.filter(Boolean);
```

---

## PostgreSQL Schema (Prisma)

```prisma
model MatchEvent {
  id          String   @id @default(cuid())
  matchId     String
  match       Match    @relation(fields: [matchId], references: [id])
  type        String   // "GOAL", "YELLOW_CARD", "RED_CARD", "SUBSTITUTION"
  minute      Int?
  addedTime   Int?     // +5'
  playerId    String?
  playerName  String?
  teamId      String?
  description String?
  homeScore   Int?     // score at time of event
  awayScore   Int?
  source      String   // "espn", "sofascore", "fotmob"
  hash        String   @unique // for deduplication
  createdAt   DateTime @default(now())
}

model LiveMatchState {
  matchId     String   @id
  homeScore   Int
  awayScore   Int
  status      String
  minute      Int?
  clock       String?
  possession  Float?   // 0-1
  events      Json     // full event array
  stats       Json?    // team stats
  updatedAt   DateTime @updatedAt
}
```

---

## Scaling Strategy

### Phase 1 — Single server (current)
- Next.js app + SSE endpoints on 1 server
- Redis (Upstash) for caching
- Worker process alongside app

### Phase 2 — Horizontal scaling
- Multiple Next.js instances behind load balancer (nginx/Caddy)
- BullMQ workers as separate Docker containers (scale to N)
- Redis pub/sub broadcasts to all SSE instances
- PostgreSQL with read replicas

### Phase 3 — Production-grade
- Kubernetes pods for Next.js (autoscale on CPU)
- Dedicated worker pods (autoscale on queue depth)
- Redis Cluster for pub/sub (multiple shards)
- CDN (Cloudflare) for static assets + API caching
- Monitoring: Grafana + Prometheus + Sentry

### Estimated resource requirements (10k concurrent users):
- Next.js: 4 pods × 2 CPU, 2GB RAM
- Workers: 6 pods × 1 CPU, 512MB RAM
- Redis: 1GB RAM cluster
- PostgreSQL: 2 vCPU, 8GB RAM + read replica

---

## Monitoring

### Health check: `/api/health`
Returns status of all dependencies (Redis, ESPN, OpenF1).

### Metrics to track:
- Queue depth (alert if >100 jobs waiting)
- Worker processing time per job type
- ESPN API error rate
- Redis cache hit rate (target >80%)
- SSE connections count
- P95 latency for score updates

### Alerting rules:
- ESPN API down >2min → fallback to Redis cache
- Queue depth >500 → scale workers
- Redis memory >80% → increase eviction policy
- Worker pod crash → auto-restart via Docker/K8s

---

## Failure Recovery

```typescript
// Circuit breaker for external APIs
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  async execute<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailure > 30_000) {
        this.state = "half-open";
      } else {
        return fallback; // Return cached/stale data
      }
    }
    try {
      const result = await fn();
      this.failures = 0;
      this.state = "closed";
      return result;
    } catch {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures > 5) this.state = "open";
      return fallback;
    }
  }
}

// One circuit breaker per data source
const espnCircuit = new CircuitBreaker();
const sofascoreCircuit = new CircuitBreaker();
```

---

## Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379           # for BullMQ workers
UPSTASH_REDIS_REST_URL=https://...          # for Next.js API routes (HTTP)
UPSTASH_REDIS_REST_TOKEN=...

# Database
DATABASE_URL=postgresql://...               # Supabase connection string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# News
TAVILY_API_KEY=...

# Optional: Esports
PANDASCORE_API_KEY=...                      # PandaScore (free tier)
TRACKER_GG_KEY=...                          # Tracker.gg

# Optional: Proxy rotation
PROXY_LIST=http://proxy1:port,http://proxy2:port

# Monitoring
LOG_LEVEL=verbose|info|error
```

---

## Folder Structure

```
curly-sports/
├── app/
│   ├── api/
│   │   ├── espn/           ESPN sport routes
│   │   ├── f1/             OpenF1 routes
│   │   ├── nba/            NBA CDN routes
│   │   ├── stream/         SSE streaming endpoints
│   │   │   ├── scores/     Live scores stream
│   │   │   ├── match/      Match detail stream
│   │   │   └── f1/         F1 live stream
│   │   └── health/         Health check
│   └── [pages]/            Next.js app router pages
├── scrapers/
│   ├── base.ts             BaseScraper class + fetchWithRetry
│   ├── football/
│   │   ├── sofascore.ts    Sofascore unofficial API
│   │   └── fotmob.ts       FotMob unofficial API
│   ├── basketball/         NBA scrapers
│   ├── cricket/            ESPNCricinfo
│   ├── f1/
│   │   └── ergast.ts       Ergast F1 API
│   ├── hockey/
│   │   └── nhl.ts          NHL official API
│   ├── baseball/
│   │   └── mlb.ts          MLB Stats API
│   ├── tennis/             ATP/WTA
│   ├── mma/                UFC/MMA
│   └── esports/            PandaScore/HLTV
├── workers/
│   └── ingestion.ts        BullMQ worker (main entry point)
├── lib/
│   ├── redis.ts            Upstash Redis (HTTP, for Next.js)
│   ├── queue.ts            BullMQ setup (ioredis, for workers)
│   ├── external-apis.ts    OpenF1, NBA helpers
│   ├── sports-api.ts       ESPN fetch helpers
│   ├── prisma.ts           Prisma client
│   └── types.ts            Shared TypeScript types
├── hooks/
│   ├── useScoresStream.ts  SSE scores hook
│   └── useMatchStream.ts   SSE match hook
├── Dockerfile              Next.js production build
├── Dockerfile.worker       Worker container
└── docker-compose.yml      Full stack: app + worker + Redis + PostgreSQL
```
