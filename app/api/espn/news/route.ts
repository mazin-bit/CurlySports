import { NextRequest, NextResponse } from "next/server";
import { fetchEspnNews, fetchTavilyNews, fetchRssNews } from "@/lib/sports-api";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { NormalizedNews, SportSlug } from "@/lib/types";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Sport → ESPN news path + Tavily query + RSS feeds
const SPORT_NEWS_CONFIG: Record<string, {
  espnPaths: string[];
  tavilyQuery: string;
  slug: SportSlug;
  rssFeeds: string[];
}> = {
  football: {
    espnPaths: ["soccer/eng.1", "soccer/esp.1"],
    tavilyQuery: "football soccer premier league latest transfer news today",
    slug: "football",
    rssFeeds: [
      "https://feeds.bbci.co.uk/sport/football/rss.xml",
      "https://www.skysports.com/rss/12040",
      "https://www.theguardian.com/football/rss",
    ],
  },
  basketball: {
    espnPaths: ["basketball/nba"],
    tavilyQuery: "NBA basketball latest news today",
    slug: "basketball",
    rssFeeds: [
      "https://www.skysports.com/rss/33750",
    ],
  },
  nfl: {
    espnPaths: ["football/nfl"],
    tavilyQuery: "NFL american football latest news today",
    slug: "nfl",
    rssFeeds: [],
  },
  cricket: {
    espnPaths: ["cricket/ipl", "cricket/big.bash", "cricket/icc.t20wc", "cricket/icc.wc"],
    tavilyQuery: "cricket IPL test match ODI T20 international results news today",
    slug: "cricket",
    rssFeeds: [
      "https://feeds.bbci.co.uk/sport/cricket/rss.xml",
      "https://www.theguardian.com/sport/cricket/rss",
      "https://www.skysports.com/rss/0,20514,11661,00.xml",
    ],
  },
  tennis: {
    espnPaths: ["tennis/atp.1"],
    tavilyQuery: "tennis ATP WTA Grand Slam news today",
    slug: "tennis",
    rssFeeds: [
      "https://feeds.bbci.co.uk/sport/tennis/rss.xml",
      "https://www.theguardian.com/sport/tennis/rss",
    ],
  },
  f1: {
    espnPaths: ["racing/f1"],
    tavilyQuery: "Formula 1 F1 race Grand Prix latest news today",
    slug: "f1",
    rssFeeds: [
      "https://feeds.bbci.co.uk/sport/formula1/rss.xml",
      "https://www.theguardian.com/sport/formulaone/rss",
    ],
  },
  mma: {
    espnPaths: ["mma/ufc"],
    tavilyQuery: "UFC MMA fight results news today",
    slug: "mma",
    rssFeeds: [],
  },
  baseball: {
    espnPaths: ["baseball/mlb"],
    tavilyQuery: "MLB baseball latest news today",
    slug: "baseball",
    rssFeeds: [],
  },
  golf: {
    espnPaths: ["golf/pga"],
    tavilyQuery: "PGA Tour golf tournament news today",
    slug: "golf",
    rssFeeds: [
      "https://feeds.bbci.co.uk/sport/golf/rss.xml",
      "https://www.theguardian.com/sport/golf/rss",
    ],
  },
  hockey: {
    espnPaths: ["hockey/nhl"],
    tavilyQuery: "NHL hockey latest news today",
    slug: "hockey",
    rssFeeds: [],
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = searchParams.get("sport") ?? "football";
  const cfg = SPORT_NEWS_CONFIG[sport] ?? SPORT_NEWS_CONFIG.football;

  // Redis cache — 5 minutes for news
  const cacheKey = `news:${sport}`;
  const cached = await cacheGet<{ articles: NormalizedNews[]; updatedAt: string }>(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const [espnResults, tavilyNews, ...rssResults] = await Promise.all([
    Promise.all(cfg.espnPaths.map((p) => fetchEspnNews(cfg.slug, p))),
    fetchTavilyNews(cfg.tavilyQuery),
    ...cfg.rssFeeds.map((url) => fetchRssNews(url, cfg.slug)),
  ]);

  const espnNews = espnResults.flat();
  const rssNews = rssResults.flat();

  const allArticles: NormalizedNews[] = [...espnNews, ...rssNews, ...tavilyNews].map((a) => ({
    ...a,
    sport: cfg.slug,
  }));

  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    const titleKey = a.title.toLowerCase().slice(0, 60);
    // Strip query params for URL-based dedup (handles same article from multiple feeds)
    const urlBase = (a.url || a.id || "").split("?")[0].replace(/&amp;/g, "&");
    if (seen.has(titleKey) || (urlBase && seen.has(urlBase))) return false;
    seen.add(titleKey);
    if (urlBase) seen.add(urlBase);
    return true;
  });

  // Strip emoji characters from text fields (rule: no emojis in UI)
  const emojiRe = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]/gu;
  for (const a of deduped) {
    a.title = a.title.replace(emojiRe, '').replace(/\s{2,}/g, ' ').trim();
    if (a.excerpt) a.excerpt = a.excerpt.replace(emojiRe, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Proxy images from domains that block cross-origin loads (e.g. Guardian CDN)
  const PROXY_HOSTS = ['i.guim.co.uk', 'media.guim.co.uk', 'assets.guim.co.uk'];
  for (const a of deduped) {
    if (a.imageUrl) {
      try {
        const { hostname } = new URL(a.imageUrl);
        if (PROXY_HOSTS.includes(hostname)) {
          a.imageUrl = `/api/proxy-image?url=${encodeURIComponent(a.imageUrl)}`;
        }
      } catch { /* malformed URL — leave as-is */ }
    }
  }

  // Articles with images first, then sort by date within each group
  deduped.sort((a, b) => {
    const aImg = a.imageUrl ? 1 : 0;
    const bImg = b.imageUrl ? 1 : 0;
    if (aImg !== bImg) return bImg - aImg;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Background upsert (non-blocking, only for DB-supported sports)
  const dbSports = ["football", "basketball", "nfl", "hockey", "baseball", "f1"];
  if (dbSports.includes(sport)) {
    upsertNews(deduped, cfg.slug).catch(() => {});
  }

  const newsPayload = { articles: deduped, updatedAt: new Date().toISOString() };
  await cacheSet(cacheKey, newsPayload, 300); // 5 minute cache
  return NextResponse.json(newsPayload, { headers: { "X-Cache": "MISS" } });
}

async function upsertNews(articles: NormalizedNews[], sport: SportSlug) {
  for (const a of articles.slice(0, 50)) {
    const slug =
      a.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 80) + `-${Date.now()}`;

    await prisma.news
      .upsert({
        where: { espnId: a.id },
        update: { title: a.title, excerpt: a.excerpt, imageUrl: a.imageUrl, source: a.source, publishedAt: new Date(a.publishedAt) },
        create: {
          espnId: a.id,
          title: a.title,
          slug,
          excerpt: a.excerpt,
          content: a.excerpt,
          imageUrl: a.imageUrl,
          source: a.source,
          publishedAt: new Date(a.publishedAt),
          sport: mapSportEnum(sport),
        },
      })
      .catch(() => {});
  }
}

function mapSportEnum(sport: SportSlug): "FOOTBALL" | "BASKETBALL" | "NFL" | "HOCKEY" | "BASEBALL" | "F1" {
  const map: Record<string, "FOOTBALL" | "BASKETBALL" | "NFL" | "HOCKEY" | "BASEBALL" | "F1"> = {
    football: "FOOTBALL", basketball: "BASKETBALL", nfl: "NFL", hockey: "HOCKEY", baseball: "BASEBALL", f1: "F1",
  };
  return map[sport] ?? "FOOTBALL";
}
