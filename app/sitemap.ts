import { MetadataRoute } from "next";

const SITE_URL = "https://curlysports.com";

// Sport slugs for ESPN API
const SPORTS = [
  { slug: "football", espn: "soccer", leagues: ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "usa.1"] },
  { slug: "cricket", espn: "cricket", leagues: ["icc"] },
  { slug: "basketball", espn: "basketball", leagues: ["nba"] },
  { slug: "baseball", espn: "baseball", leagues: ["mlb"] },
  { slug: "tennis", espn: "tennis", leagues: ["atp"] },
  { slug: "f1", espn: "racing", leagues: ["f1"] },
  { slug: "nfl", espn: "football", leagues: ["nfl"] },
  { slug: "hockey", espn: "hockey", leagues: ["nhl"] },
  { slug: "mma", espn: "mma", leagues: ["ufc"] },
];

async function fetchTeamIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    // Fetch teams from major leagues
    const leagues = [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "esp.1" },
      { sport: "soccer", league: "ger.1" },
      { sport: "soccer", league: "ita.1" },
      { sport: "soccer", league: "fra.1" },
      { sport: "basketball", league: "nba" },
      { sport: "baseball", league: "mlb" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
    ];

    const fetches = leagues.map(async ({ sport, league }) => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=50`,
          { next: { revalidate: 86400 } }
        );
        if (res.ok) {
          const data = await res.json();
          const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
          return teams.map((t: any) => t.team?.id).filter(Boolean);
        }
      } catch {}
      return [];
    });

    const results = await Promise.all(fetches);
    results.forEach(r => ids.push(...r));
  } catch {}
  return [...new Set(ids)];
}

async function fetchRecentMatchIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    const sports = ["soccer/eng.1", "soccer/esp.1", "basketball/nba", "football/nfl", "baseball/mlb", "hockey/nhl"];
    const fetches = sports.map(async (sport) => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard`,
          { next: { revalidate: 3600 } }
        );
        if (res.ok) {
          const data = await res.json();
          return (data.events || []).map((e: any) => e.id).filter(Boolean);
        }
      } catch {}
      return [];
    });
    const results = await Promise.all(fetches);
    results.forEach(r => ids.push(...r));
  } catch {}
  return [...new Set(ids)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const daily = "daily" as const;
  const weekly = "weekly" as const;
  const hourly = "hourly" as const;
  const always = "always" as const;

  // Static pages — use trailing slash to match Google's canonical URLs
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: daily, priority: 1.0 },
    { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: daily, priority: 1.0 },
    { url: `${SITE_URL}/live-scores`, lastModified: now, changeFrequency: always, priority: 0.9 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: hourly, priority: 0.9 },
    { url: `${SITE_URL}/teams`, lastModified: now, changeFrequency: weekly, priority: 0.8 },
    { url: `${SITE_URL}/players`, lastModified: now, changeFrequency: weekly, priority: 0.8 },
    { url: `${SITE_URL}/leagues`, lastModified: now, changeFrequency: weekly, priority: 0.8 },
    { url: `${SITE_URL}/debates`, lastModified: now, changeFrequency: daily, priority: 0.7 },
    { url: `${SITE_URL}/mini-games`, lastModified: now, changeFrequency: weekly, priority: 0.6 },
    { url: `${SITE_URL}/challenges`, lastModified: now, changeFrequency: daily, priority: 0.7 },
    { url: `${SITE_URL}/videos`, lastModified: now, changeFrequency: daily, priority: 0.7 },
    { url: `${SITE_URL}/download`, lastModified: now, changeFrequency: weekly, priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Sport landing pages
  const sportPages: MetadataRoute.Sitemap = SPORTS.map(s => ({
    url: `${SITE_URL}/sports/${s.slug}`,
    lastModified: now,
    changeFrequency: daily,
    priority: 0.9,
  }));

  // Dynamic team pages
  let teamPages: MetadataRoute.Sitemap = [];
  try {
    const teamIds = await fetchTeamIds();
    teamPages = teamIds.map(id => ({
      url: `${SITE_URL}/teams/${id}`,
      lastModified: now,
      changeFrequency: weekly,
      priority: 0.7,
    }));
  } catch {}

  // Dynamic match pages (recent/today)
  let matchPages: MetadataRoute.Sitemap = [];
  try {
    const matchIds = await fetchRecentMatchIds();
    matchPages = matchIds.map(id => ({
      url: `${SITE_URL}/matches/${id}`,
      lastModified: now,
      changeFrequency: always,
      priority: 0.8,
    }));
  } catch {}

  return [...staticPages, ...sportPages, ...teamPages, ...matchPages];
}
