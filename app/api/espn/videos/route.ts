import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface VideoHighlight {
  id: string;
  title: string;
  thumbnail: string | null;
  url: string;
  source: string;
  publishedAt: string;
  sport: string;
  isYouTube: boolean;
  ytVideoId: string | null;
  matchLabel?: string;
}

// Verified YouTube channel IDs (confirmed via canonical URL)
// broadcastFilter: optional keywords — if set, only include videos whose titles match one
const SPORT_CHANNELS: Record<string, { channelId: string; name: string; filter?: string[] }[]> = {
  football: [
    // CBS Sports Golazo — soccer-only channel, embeds globally ✓
    { channelId: "UCET00YnetHT7tOpu12v8jxg", name: "CBS Sports Golazo" },
    // Bundesliga — German top flight, embeds globally ✓
    { channelId: "UC6UL29enLNe4mqwTfAyeNuw", name: "Bundesliga" },
    // FootballDaily — UK analysis & highlights, embeds globally ✓
    { channelId: "UCbWUEnTRHb3bRdrnovq8iuA", name: "FootballDaily" },
    // GOAL — global football news/highlights channel ✓
    { channelId: "UCjVd6vTuoAYLFYvX5TSK1aA", name: "GOAL" },
    // UEFA blocks content ID embedding — excluded
    // LaLiga blocks embedding — excluded
    // NBC Sports geo-restricts outside the US — excluded
  ],
  basketball: [
    { channelId: "UCWJ2lWNubArHWmf3FIHbfcQ", name: "NBA" },
  ],
  nfl: [
    { channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg", name: "NFL" },
  ],
  f1: [
    { channelId: "UCB_qr75-ydFVKSF9Dmo6izg", name: "Formula 1" },
  ],
  hockey: [
    { channelId: "UCqFMzb-4AUf6WAIbl132QKA", name: "NHL" },
  ],
  baseball: [
    { channelId: "UCoLrcjPV5PbUrUyXq5mjc_A", name: "MLB" },
  ],
  cricket: [
    { channelId: "UCiWrjBhlICf_L_RK5y6Vrxw", name: "ICC Cricket" },
  ],
  tennis: [
    { channelId: "UCY9V346pkqMnGVZKDzAPDTw", name: "ATP Tour" },
  ],
  mma: [
    { channelId: "UCvgfXK4nTYKudb0rFR6noLA", name: "UFC" },
  ],
  golf: [
    { channelId: "UCrgBDFMDuGjAt8GGBFM-FxA", name: "PGA Tour" },
  ],
};

// Keywords that indicate highlight/recap content
const HIGHLIGHT_KEYWORDS = [
  "highlight", "goal", "recap", "best of", "top play", "top 5", "top 10",
  "match", "game", "extended", "full match", "reaction", "analysis",
  "preview", "review", "weekly", "watch again", "relive", "race",
  "knockouts", "touchdown", "shot of", "best goal", "skills",
  "vs.", " vs ", "overtime", "playoff", "final", "semi-final", "quarter",
  "nightly", "daily", "weekly recap", "season", "championship",
  "grand prix", "qualifying", "sprint", "all goals", "all scores",
];

function isHighlightVideo(title: string): boolean {
  const lower = title.toLowerCase();
  return HIGHLIGHT_KEYWORDS.some((kw) => lower.includes(kw));
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchChannelVideos(
  channelId: string,
  channelName: string,
  sport: string,
  filter?: string[]
): Promise<VideoHighlight[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await fetch(rssUrl, { next: { revalidate: 300 } }); // 5 min cache
    if (!res.ok) return [];
    const xml = await res.text();

    const videos: VideoHighlight[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const rawTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1];
      const title = rawTitle ? decodeXml(rawTitle) : null;
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
      const thumbnail =
        entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ??
        (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

      if (!videoId || !title) continue;

      // Apply channel-specific sport filter
      if (filter && filter.length > 0) {
        const lower = title.toLowerCase();
        if (!filter.some((kw) => lower.includes(kw))) continue;
      }

      videos.push({
        id: `yt:${videoId}`,
        title,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        source: channelName,
        publishedAt: published ?? new Date().toISOString(),
        sport,
        isYouTube: true,
        ytVideoId: videoId,
      });
    }

    return videos;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = searchParams.get("sport") ?? "football";

  const channels = SPORT_CHANNELS[sport] ?? SPORT_CHANNELS.football;

  // Fetch all channels in parallel
  const allResults = await Promise.allSettled(
    channels.map((ch) => fetchChannelVideos(ch.channelId, ch.name, sport, ch.filter))
  );

  const allVideos = allResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<VideoHighlight[]>).value);

  // Filter to highlight/match content and deduplicate
  const seen = new Set<string>();
  const highlights = allVideos.filter((v) => {
    if (seen.has(v.ytVideoId!)) return false;
    seen.add(v.ytVideoId!);
    // For football channels that post everything, filter by keywords
    // For dedicated highlight channels (CBS Golazo, Bundesliga, etc.) show all
    return isHighlightVideo(v.title);
  });

  // If filtering removed too much, include all videos as fallback
  const final = highlights.length >= 4 ? highlights : allVideos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  // Sort by newest first
  final.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Pin the 4 newest videos; shuffle the rest so the list feels different each visit
  const pinned = final.slice(0, 4);
  const rest = final.slice(4);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  return NextResponse.json({
    videos: [...pinned, ...rest].slice(0, 20),
    updatedAt: new Date().toISOString(),
  });
}
