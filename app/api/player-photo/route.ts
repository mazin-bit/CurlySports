import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache: "name:sport" → photo URL or null (null = confirmed not found)
const cache = new Map<string, string | null>();
const CACHE_MAX = 5000;

function wikify(name: string): string {
  return name.trim().replace(/ /g, "_");
}

// Sport-specific keywords for validating Wikipedia articles
const SPORT_KEYWORDS: Record<string, string[]> = {
  football: [
    "football", "soccer", "footballer", "player", "goalkeeper",
    "defender", "midfielder", "forward", "winger", "striker",
    "association football", "soccer player",
  ],
  basketball: [
    "basketball", "nba", "wnba", "guard", "center", "power forward",
    "point guard", "shooting guard", "small forward", "basketball player",
  ],
  cricket: [
    "cricket", "cricketer", "batsman", "batter", "bowler",
    "wicket-keeper", "all-rounder", "cricket player",
  ],
  nfl: [
    "football", "nfl", "quarterback", "wide receiver", "running back",
    "linebacker", "cornerback", "tight end", "american football",
  ],
  hockey: [
    "ice hockey", "hockey", "nhl", "goaltender", "defenceman",
    "defenseman", "hockey player",
  ],
  baseball: [
    "baseball", "mlb", "pitcher", "catcher", "baseman",
    "shortstop", "outfielder", "baseball player",
  ],
  tennis: [
    "tennis", "atp", "wta", "tennis player",
  ],
  f1: [
    "racing", "formula one", "formula 1", "f1", "racing driver",
    "motorsport",
  ],
  mma: [
    "mixed martial arts", "mma", "ufc", "martial artist", "fighter",
  ],
  golf: [
    "golf", "golfer", "pga", "golf player",
  ],
};

// Sport-specific Wikipedia disambiguation suffixes
const SPORT_SUFFIXES: Record<string, string[]> = {
  football: ["(footballer)", "(soccer)", "(association football)"],
  basketball: ["(basketball)", "(basketball player)"],
  cricket: ["(cricketer)", "(cricket)"],
  nfl: ["(American football)", "(gridiron football)"],
  hockey: ["(ice hockey)", "(hockey)"],
  baseball: ["(baseball)", "(baseball player)"],
  tennis: ["(tennis)", "(tennis player)"],
  f1: ["(racing driver)", "(motorsport)"],
  mma: ["(fighter)", "(martial artist)"],
  golf: ["(golfer)"],
};

async function lookupWikipedia(name: string, sport: string): Promise<string | null> {
  const suffixes = SPORT_SUFFIXES[sport] ?? SPORT_SUFFIXES.football;
  const keywords = SPORT_KEYWORDS[sport] ?? SPORT_KEYWORDS.football;

  const candidates = [name, ...suffixes.map(s => `${name} ${s}`)];

  for (const candidate of candidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikify(candidate))}`;
      const r = await fetch(url, { next: { revalidate: 86400 } });
      if (!r.ok) continue;
      const d = await r.json();

      const desc: string = (d.description ?? "").toLowerCase();
      const extract: string = (d.extract ?? "").toLowerCase();
      const type: string = d.type ?? "";

      if (type === "disambiguation") continue;

      // Always validate that this Wikipedia article is about a sports person
      const isPlayer = keywords.some(kw => desc.includes(kw) || extract.includes(kw));

      if (isPlayer && d.thumbnail?.source) return d.thumbnail.source;
    } catch {
      // continue to next candidate
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const sport = req.nextUrl.searchParams.get("sport")?.trim() ?? "football";

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const cacheKey = `${name}:${sport}`;

  // Return cached result
  if (cache.has(cacheKey)) {
    const url = cache.get(cacheKey);
    if (!url) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.redirect(url, { status: 302 });
  }

  const photoUrl = await lookupWikipedia(name, sport);

  // Trim cache if too large
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(cacheKey, photoUrl ?? null);

  if (!photoUrl) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.redirect(photoUrl, { status: 302 });
}
