"use client";

import AppShell from "@/components/AppShell";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./players.module.css";
import { PersonStanding, Search, Globe } from "lucide-react";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FOOTBALL_LEAGUES, OTHER_LEAGUES } from "@curly/shared";
import AdSlot from "@/components/AdSlot";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
const PAGE_SIZE = 80;

interface Player {
  id: string; name: string; jersey: string; position: string;
  headshot: string | null; age: number | null;
  teamName: string; teamLogo: string | null; teamId: string;
  leagueId: string; nationality: string | null;
}

// Map sport slug → teams API sport param
const SPORT_API_KEY: Record<string, string> = {
  football: "football", basketball: "basketball",
  nfl: "nfl", hockey: "hockey", baseball: "baseball", cricket: "cricket",
};

// Cricket players use TheSportsDB via our own API route (ESPN cricket is broken)
async function fetchCricketLeaguePlayers(leagueId: string): Promise<Player[]> {
  const res = await fetch(`/api/cricket/players?league=${leagueId}`);
  if (!res.ok) return [];
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.players ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    jersey: p.jersey ?? "",
    position: p.position ?? "Cricketer",
    headshot: p.headshot ?? null,
    age: p.age ?? null,
    teamName: p.teamName ?? "",
    teamLogo: p.teamLogo ?? null,
    teamId: p.teamId ?? "",
    leagueId: p.leagueId ?? leagueId,
    nationality: p.nationality ?? null,
  }));
}

// Derive the ESPN CDN sport segment from league path + id
// e.g. "soccer/eng.1" → "soccer", "cricket/ipl" → "cricket", "basketball/nba" → "nba"
function cdnSport(leaguePath: string, leagueId: string): string {
  if (leaguePath.startsWith("soccer/"))   return "soccer";
  if (leaguePath.startsWith("cricket/"))  return "cricket";
  return leagueId;
}

async function fetchLeaguePlayers(leagueId: string, leaguePath: string, sport = "football"): Promise<Player[]> {
  // 1. Get all teams via the Next.js API route (handles ESPN format correctly)
  const apiSport = SPORT_API_KEY[sport] ?? "football";
  const teamsRes = await fetch(`/api/espn/teams?sport=${apiSport}&league=${leagueId}`);
  if (!teamsRes.ok) return [];
  const teamsData = await teamsRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams: { id: string; name: string; logo: string | null }[] = (teamsData.teams ?? []).map((t: any) => ({
    id: t.id, name: t.name, logo: t.logo,
  }));

  if (teams.length === 0) return [];

  const sportCdn = cdnSport(leaguePath, leagueId);

  // 2. Fetch all rosters in parallel — no team limit
  const results = await Promise.allSettled(
    teams.map(async (team) => {
      try {
        const res = await fetch(`${ESPN}/${leaguePath}/teams/${team.id}/roster`);
        if (!res.ok) return [];
        const data = await res.json();
        const players: Player[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const entry of (data.athletes ?? []) as any[]) {
          const items: typeof entry[] = entry.items?.length ? entry.items : [entry];
          for (const item of items) {
            if (!item.id && !item.displayName) continue;
            const pos: string = typeof item.position === "string"
              ? item.position
              : (item.position?.abbreviation ?? "?");
            const playerId = item.id ?? "";
            // Prefer headshot from API, fall back to ESPN CDN by player ID
            const headshot = item.headshot?.href
              ?? (playerId ? `https://a.espncdn.com/i/headshots/${sportCdn}/players/full/${playerId}.png` : null);
            players.push({
              id: playerId || String(Math.random()),
              name: item.displayName ?? item.fullName ?? "",
              jersey: item.jersey ?? "",
              position: pos,
              headshot,
              age: item.age ?? null,
              teamName: team.name,
              teamLogo: team.logo,
              teamId: team.id,
              leagueId,
              nationality: item.citizenship ?? item.birthPlace?.country ?? null,
            });
          }
        }
        return players;
      } catch { return []; }
    })
  );

  return results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function PlayerPhoto({ name, espnSrc, sport = "football" }: { name: string; espnSrc: string | null; sport?: string }) {
  // If no ESPN headshot, go straight to Wikipedia fallback
  const wikiSrc = `/api/player-photo?name=${encodeURIComponent(name)}&sport=${sport}`;
  const [src, setSrc] = useState<string | null>(espnSrc ?? wikiSrc);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    if (src && !src.includes("/api/player-photo")) {
      // ESPN CDN failed → try Wikipedia
      setSrc(wikiSrc);
    } else {
      // Wikipedia also failed → show initials
      setFailed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (failed) {
    return <div className={styles.playerAvatar}>{initials(name)}</div>;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src!} alt={name} width={64} height={64}
        className={styles.playerAvatarImg}
        loading="lazy"
        onError={handleError} />
    </>
  );
}

function PlayerCard({ player, sport }: { player: Player; sport: string }) {
  return (
    <Link href={`/players/${player.id}?league=${player.leagueId}`} className={styles.playerCard}>
      <PlayerPhoto name={player.name} espnSrc={player.headshot} sport={sport} />
      <div className={styles.playerPos}>{player.position}</div>
      <h3 className={styles.playerName}>{player.name}</h3>
      <p className={styles.playerTeam}>{player.teamName}</p>
      <div className={styles.playerMeta}>
        {player.jersey && <span className={styles.metaBadge}>#{player.jersey}</span>}
        {player.age && <span className={styles.metaBadge}>{player.age}y</span>}
        {player.nationality && <span className={styles.metaBadge}>{player.nationality}</span>}
      </div>
    </Link>
  );
}

function GlobalPlayerCard({ player, sport }: { player: Player; sport: string }) {
  return (
    <Link href={`/players/${player.id}?league=${player.leagueId}`} className={styles.playerCard}>
      <PlayerPhoto name={player.name} espnSrc={player.headshot} sport={sport} />
      <div className={styles.playerPos}>{player.position}</div>
      <h3 className={styles.playerName}>{player.name}</h3>
      <p className={styles.playerTeam}>{player.teamName}</p>
      <div className={styles.playerMeta}>
        {player.jersey && <span className={styles.metaBadge}>#{player.jersey}</span>}
        {player.age && <span className={styles.metaBadge}>{player.age}y</span>}
        <span className={styles.metaBadge} style={{ background: "var(--accent)", color: "var(--ink)" }}>
          {(player as Player & { leagueName?: string }).leagueName ?? player.leagueId}
        </span>
      </div>
    </Link>
  );
}

export default function PlayersPage() {
  const { activeSport } = useActiveSport();
  const { t } = useLanguage();

  const getLeagues = (sport: string) =>
    sport === "football" ? FOOTBALL_LEAGUES : (OTHER_LEAGUES[sport] ?? FOOTBALL_LEAGUES);

  const [selectedLeagueId, setSelectedLeagueId] = useState(() => getLeagues("football")[0].id);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [page, setPage] = useState(1);
  // Global search state
  const [globalResults, setGlobalResults] = useState<Player[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const globalSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache loaded leagues so switching back is instant
  const cacheRef = useRef<Record<string, Player[]>>({});
  const abortRef = useRef<AbortController | null>(null);
  // Monotonic counter — incremented on every new fetch; callbacks check this to discard stale results
  const fetchGenRef = useRef(0);

  const leagues = getLeagues(activeSport);
  const isGlobalSearch = search.trim().length >= 2 && (activeSport === "football" || activeSport === "basketball" || activeSport === "hockey" || activeSport === "baseball" || activeSport === "nfl" || activeSport === "cricket");

  // Reset on sport change
  useEffect(() => {
    const first = getLeagues(activeSport)[0]?.id ?? "";
    setSelectedLeagueId(first);
    setSearch("");
    setPosFilter("All");
    setPage(1);
    setGlobalResults([]);
    setPlayers([]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSport]);

  // Load players whenever selected league or sport changes
  useEffect(() => {
    if (!selectedLeagueId) return;

    // Use sport-prefixed cache key to prevent cross-sport pollution
    const cacheKey = `${activeSport}:${selectedLeagueId}`;

    // Instant from cache
    if (cacheRef.current[cacheKey]) {
      setPlayers(cacheRef.current[cacheKey]);
      setPosFilter("All");
      setPage(1);
      return;
    }

    const league = leagues.find((l) => l.id === selectedLeagueId);
    if (!league) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const gen = ++fetchGenRef.current;

    setLoading(true);
    setPlayers([]);
    setPosFilter("All");
    setPage(1);

    const fetcher = activeSport === "cricket"
      ? fetchCricketLeaguePlayers(league.id)
      : fetchLeaguePlayers(league.id, league.path, activeSport);

    fetcher.then((all) => {
      if (gen !== fetchGenRef.current) return; // stale — sport/league changed while fetching
      cacheRef.current[cacheKey] = all;
      setPlayers(all);
      setLoading(false);
    }).catch(() => {
      if (gen !== fetchGenRef.current) return;
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueId, activeSport]);

  // Global search with debounce
  useEffect(() => {
    if (!isGlobalSearch) { setGlobalResults([]); return; }
    if (globalSearchTimer.current) clearTimeout(globalSearchTimer.current);
    setGlobalLoading(true);
    globalSearchTimer.current = setTimeout(() => {
      fetch(`/api/espn/player-search?q=${encodeURIComponent(search.trim())}&sport=${activeSport}`)
        .then((r) => r.json())
        .then((d) => { setGlobalResults(d.players ?? []); setGlobalLoading(false); })
        .catch(() => setGlobalLoading(false));
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isGlobalSearch]);

  const positions = Array.from(
    new Set(players.map((p) => p.position).filter((p) => p && p !== "?"))
  ).sort();

  const filtered = players.filter((p) => {
    if (posFilter !== "All" && p.position !== posFilter) return false;
    return true;
  });

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  return (
    <AppShell active="players" title={t("players.title")}
      subtitle={isGlobalSearch ? t("players.globalSearch") : `${selectedLeague?.name ?? "Football"} · ${loading ? t("common.loading") : `${players.length} ${t("players.players")}`}`}>
      <div className="stack">

        {/* Search — global when football */}
        <div className={styles.searchRow}>
          {isGlobalSearch
            ? <Globe size={15} style={{ color: "var(--orange)", flexShrink: 0, marginInlineEnd: 10 }} />
            : <Search size={15} style={{ color: "var(--text-mute)", flexShrink: 0, marginInlineEnd: 10 }} />
          }
          <input
            type="text"
            placeholder={activeSport === "basketball" ? t("players.searchPlaceholderBasketball") : t("players.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={styles.searchInput}
            autoComplete="off"
          />
          {search && (
            <button onClick={() => { setSearch(""); setGlobalResults([]); }}
              style={{ marginInlineStart: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-mute)", fontSize: 18 }}>
              ×
            </button>
          )}
        </div>

        <AdSlot size="banner" />

        {/* Global search results */}
        {isGlobalSearch ? (
          <div>
            <div className="sec-head">
              <div className="title">
                <Globe size={17} className="title-icon" strokeWidth={2} />
                {t("players.search")} <span className="accent">{t("players.results")}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-mute)", fontFamily: "var(--mono)" }}>
                {globalLoading ? t("players.searchingAllLeagues") : `${globalResults.length} ${t("players.playersFound")}`}
              </span>
            </div>
            {globalLoading ? (
              <div className={styles.playersGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton-row" style={{ height: 160, borderRadius: 12 }} />
                ))}
              </div>
            ) : globalResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)", fontSize: 14 }}>
                {t("players.noPlayersFoundFor").replace("{query}", search)}
              </div>
            ) : (
              <div className={styles.playersGrid}>
                {globalResults.map((p) => (
                  <GlobalPlayerCard key={`${p.id}-${p.leagueId}`} player={p} sport={activeSport} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* League tabs */}
            <div className={styles.leagueTabs}>
              {leagues.map((l) => (
                <button
                  key={l.id}
                  className={`${styles.leagueTab}${selectedLeagueId === l.id ? " " + styles.leagueTabActive : ""}`}
                  onClick={() => setSelectedLeagueId(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>

        {/* Position filter */}
        {positions.length > 1 && (
          <div className={styles.filterRow}>
            <button className={`chip${posFilter === "All" ? " active" : ""}`}
              onClick={() => { setPosFilter("All"); setPage(1); }}>
              {t("players.allPositions")}
            </button>
            {positions.slice(0, 12).map((p) => (
              <button key={p} className={`chip${posFilter === p ? " active" : ""}`}
                onClick={() => { setPosFilter(p); setPage(1); }}>
                {p}
              </button>
            ))}
          </div>
        )}

        <div>
          <div className="sec-head">
            <div className="title">
              <PersonStanding size={17} className="title-icon" strokeWidth={2} />
              {t("players.playerDirectory")} <span className="accent">{t("players.directoryAccent")}</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontFamily: "var(--mono)" }}>
              {loading ? t("players.loading") : `${filtered.length.toLocaleString()} ${t("players.players")}`}
            </span>
          </div>

          {loading ? (
            <div className={styles.playersGrid}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="skeleton-row" style={{ height: 160, borderRadius: 12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-mute)", fontSize: 14 }}>
              {players.length === 0 ? t("players.noPlayerData") : t("players.noPlayersMatch")}
            </div>
          ) : (
            <>
              <div className={styles.playersGrid}>
                {visible.map((p) => <PlayerCard key={p.id} player={p} sport={activeSport} />)}
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    style={{
                      padding: "12px 36px", fontSize: 14, fontWeight: 700,
                      background: "var(--ink)", color: "var(--bg)", border: "2px solid var(--ink)",
                      borderRadius: "var(--r-lg)", cursor: "pointer", fontFamily: "var(--display)",
                    }}>
                    {t("players.loadMore")} ({(filtered.length - visible.length).toLocaleString()} {t("players.remaining")})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
