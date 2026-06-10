import type {
  EspnEvent,
  EspnNewsArticle,
  EspnScoreboardResponse,
  EspnNewsResponse,
  NormalizedMatch,
  NormalizedNews,
  SportSlug,
} from "./types";

const ESPN = process.env.ESPN_BASE_URL ?? "https://site.api.espn.com/apis/site/v2/sports";

// ─── ESPN scoreboard fetch ─────────────────────────────────────────────────

export async function fetchScoreboard(path: string, date?: string): Promise<EspnEvent[]> {
  if (date) {
    // Fetch exact date — user selected this specific day
    const res = await fetch(`${ESPN}/${path}/scoreboard?dates=${date}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: EspnScoreboardResponse = await res.json();
    return data.events ?? [];
  }

  // No date = ESPN's current gameweek/round
  const url = `${ESPN}/${path}/scoreboard`;
  const res = await fetch(url, { next: { revalidate: 30, tags: ["espn-scores"] } });
  if (!res.ok) return [];
  const data: EspnScoreboardResponse = await res.json();
  return data.events ?? [];
}

// ─── Status mapper ─────────────────────────────────────────────────────────

export function mapStatus(
  espnName: string,
  completed: boolean
): NormalizedMatch["status"] {
  if (completed) return "FINISHED";
  if (espnName.includes("HALFTIME") || espnName.includes("HALF_TIME")) return "HALF_TIME";
  if (
    espnName.includes("IN_PROGRESS") ||
    espnName.includes("LIVE") ||
    espnName.includes("FIRST") ||
    espnName.includes("SECOND") ||
    espnName.includes("OVERTIME")
  )
    return "LIVE";
  if (espnName.includes("POSTPONED")) return "POSTPONED";
  if (espnName.includes("CANCELLED") || espnName.includes("CANCELED")) return "CANCELLED";
  return "SCHEDULED";
}

// ─── Event normalizer ──────────────────────────────────────────────────────

export function normalizeEvent(
  event: EspnEvent,
  sport: SportSlug,
  leagueName: string,
  leagueShortName: string,
  leagueId: string
): NormalizedMatch {
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const status = mapStatus(event.status.type.name, event.status.type.completed);

  return {
    id: event.id,
    homeTeam: {
      id: home?.team?.id ?? "",
      name: home?.team?.displayName ?? "Home",
      shortName: home?.team?.shortDisplayName ?? home?.team?.abbreviation ?? "HOM",
      logoUrl: home?.team?.logos?.[0]?.href ?? home?.team?.logo,
    },
    awayTeam: {
      id: away?.team?.id ?? "",
      name: away?.team?.displayName ?? "Away",
      shortName: away?.team?.shortDisplayName ?? away?.team?.abbreviation ?? "AWY",
      logoUrl: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
    },
    league: { id: leagueId, name: leagueName, shortName: leagueShortName },
    homeScore: home?.score != null ? parseInt(home.score) : null,
    awayScore: away?.score != null ? parseInt(away.score) : null,
    status,
    statusDisplay: event.status.type.shortDetail,
    minute:
      status === "LIVE" && event.status.displayClock
        ? Math.round(parseFloat(event.status.displayClock))
        : null,
    sport,
    scheduledAt: event.date,
    venue: comp?.venue?.fullName,
  };
}

// ─── ESPN news fetch ───────────────────────────────────────────────────────

export async function fetchEspnNews(
  sport: SportSlug,
  path: string
): Promise<NormalizedNews[]> {
  const url = `${ESPN}/${path}/news`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data: EspnNewsResponse = await res.json();
  return (data.articles ?? []).map((a) => normalizeArticle(a, sport));
}

/** Upgrade image URL to highest available resolution for known CDNs */
function upgradeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // BBC ichef CDN — swap width segment to 976 (highest common tier)
  // e.g. /ace/standard/240/ → /ace/standard/976/
  if (url.includes("ichef.bbci.co.uk")) {
    return url.replace(/(\/(?:ace\/standard|news|sport)\/)\d{2,4}(\/)/, "$1976$2");
  }
  // ESPN combiner — max out w= / h= params
  // e.g. ?img=...&w=600&h=400 → &w=1296&h=729
  if (url.includes("espncdn.com/combiner/i")) {
    return url.replace(/\bw=\d+/, "w=1296").replace(/\bh=\d+/, "h=729");
  }
  // Guardian media CDN — replace width before the file extension
  // e.g. /500.jpg → /1200.jpg
  if (url.includes("media.guim.co.uk")) {
    return url.replace(/\/\d+(\.(?:jpg|jpeg|png|webp))/, "/1200$1");
  }
  return url;
}

function normalizeArticle(a: EspnNewsArticle, sport: SportSlug | null): NormalizedNews {
  const image = a.images?.find((i) => i.type === "header") ?? a.images?.[0];
  return {
    id: String(a.id ?? a.headline),
    title: a.headline,
    excerpt: a.description ?? "",
    imageUrl: upgradeImageUrl(image?.url) ?? null,
    source: "ESPN",
    publishedAt: a.published ?? new Date().toISOString(),
    sport,
    url: a.links?.web?.href,
  };
}

// ─── Tavily news fetch ─────────────────────────────────────────────────────

export async function fetchTavilyNews(query: string): Promise<NormalizedNews[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        include_domains: ["bbc.co.uk", "skysports.com", "espn.com", "theathletic.com"],
        max_results: 10,
      }),
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();

    // Use actual published_date if present; otherwise mark as 24h ago so image-bearing
    // articles sort above no-image Tavily results
    const fallbackDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return (data.results ?? []).map(
      (r: { url: string; title: string; content?: string; published_date?: string }) => ({
        id: r.url,
        title: r.title,
        excerpt: r.content?.slice(0, 200) ?? "",
        imageUrl: null,
        source: extractDomain(r.url),
        publishedAt: r.published_date ?? fallbackDate,
        sport: "football" as SportSlug,
        url: r.url,
      })
    );
  } catch {
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("bbc")) return "BBC Sport";
    if (host.includes("skysports")) return "Sky Sports";
    if (host.includes("espn")) return "ESPN";
    if (host.includes("theathletic")) return "The Athletic";
    if (host.includes("guardian")) return "The Guardian";
    return host;
  } catch {
    return "Unknown";
  }
}

// ─── RSS feed fetch ────────────────────────────────────────────────────────

function parseRssXml(xml: string, sport: SportSlug | null): NormalizedNews[] {
  const items: NormalizedNews[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getText = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    const title = getText("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const link = getText("link") || (block.match(/<link>([^<]+)<\/link>/i)?.[1] ?? "");
    const description = getText("description")
      .replace(/<\/(p|li|div|h[1-6]|br)>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/<\/(p|li|div|h[1-6]|br)>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ").trim()
      .slice(0, 220);
    const pubDate = getText("pubDate") || getText("dc:date") || getText("published");
    // Extract image URL — try various patterns (BBC uses extensionless CDN URLs)
    const rawImageUrl =
      // BBC: <media:thumbnail url="https://ichef.bbci.co.uk/..."> (no extension)
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1]
      // Standard media:content
      ?? block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1]
      // Sky Sports: <enclosure type="image/jpg" url="...">
      ?? block.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1]
      // Guardian / any https image URL attribute
      ?? block.match(/url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i)?.[1]
      // Fallback: first https image URL anywhere in the block
      ?? block.match(/https?:\/\/(?:[^\s"'<>]*\/)?[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:[?#][^\s"'<>]*)?/i)?.[0]
      ?? null;
    const imageUrl = upgradeImageUrl(rawImageUrl);
    if (!title || !link) continue;
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    items.push({
      id: link,
      title,
      excerpt: description,
      imageUrl,
      source: extractDomain(link),
      publishedAt,
      sport,
      url: link,
    });
  }
  return items;
}

export async function fetchRssNews(feedUrl: string, sport: SportSlug | null): Promise<NormalizedNews[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "CurlySports/1.0 RSS Reader" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, sport);
  } catch {
    return [];
  }
}
