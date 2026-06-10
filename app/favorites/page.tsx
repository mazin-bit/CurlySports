"use client";

import AppShell from "@/components/AppShell";
import styles from "./favorites.module.css";
import { useState, useEffect, useRef } from "react";
import { X, Search, Bell, BellRing, BellOff, Star, Users, Plus, Heart, Loader } from "lucide-react";
import { SPORT_CONFIGS } from "@/contexts/SportContext";
import type { SportSlug } from "@/contexts/SportContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FavTeam {
  id: string; name: string; shortName: string; abbr: string;
  logo: string | null; color: string | null;
  leagueId: string; leagueName: string; sport: string; addedAt: number;
}
interface FavPlayer {
  id: string; name: string; position: string; teamName: string;
  headshot: string | null; leagueId: string; leagueName: string; sport: string; addedAt: number;
}
interface FavNotif { id: string; text: string; time: number; read: boolean; }

// ─── localStorage helper (notifs only — ephemeral alerts) ─────────────────────

const LS_NOTIFS = "curly-fav-notifs";
function lsGet<T>(key: string, fb: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fb; }
  catch { return fb; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

interface FavRow {
  id: string;
  type: "team" | "player";
  espn_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

async function apiFetch(): Promise<FavRow[]> {
  const res = await fetch("/api/user-favorites");
  if (!res.ok) return [];
  const json = await res.json() as { favorites: FavRow[] };
  return json.favorites ?? [];
}

async function apiAdd(type: "team" | "player", espn_id: string, data: Record<string, unknown>): Promise<boolean> {
  const res = await fetch("/api/user-favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, espn_id, data }),
  });
  return res.ok;
}

async function apiRemove(type: "team" | "player", espn_id: string): Promise<boolean> {
  const res = await fetch("/api/user-favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, espn_id }),
  });
  return res.ok;
}

function rowToTeam(row: FavRow): FavTeam {
  const d = row.data;
  return {
    id: row.espn_id,
    name: (d.name as string) ?? "",
    shortName: (d.shortName as string) ?? (d.name as string) ?? "",
    abbr: (d.abbr as string) ?? "",
    logo: (d.logo as string) ?? null,
    color: (d.color as string) ?? null,
    leagueId: (d.leagueId as string) ?? "",
    leagueName: (d.leagueName as string) ?? "",
    sport: (d.sport as string) ?? "",
    addedAt: new Date(row.created_at).getTime(),
  };
}

function rowToPlayer(row: FavRow): FavPlayer {
  const d = row.data;
  return {
    id: row.espn_id,
    name: (d.name as string) ?? "",
    position: (d.position as string) ?? "",
    teamName: (d.teamName as string) ?? "",
    headshot: (d.headshot as string) ?? null,
    leagueId: (d.leagueId as string) ?? "",
    leagueName: (d.leagueName as string) ?? "",
    sport: (d.sport as string) ?? "",
    addedAt: new Date(row.created_at).getTime(),
  };
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

type RawRecord = Record<string, unknown>;
interface SearchItem extends RawRecord {
  _label: string; _sub: string; _logo: string | null; _color: string | null;
}

function SearchModal({
  type, existingTeamIds, existingPlayerIds, onClose, onAddTeam, onAddPlayer,
}: {
  type: "team" | "player";
  existingTeamIds: Set<string>;
  existingPlayerIds: Set<string>;
  onClose: () => void;
  onAddTeam: (t: RawRecord, sport: SportSlug) => void;
  onAddPlayer: (p: RawRecord, sport: SportSlug) => void;
}) {
  const [sport, setSport]   = useState<SportSlug>("football");
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (type === "team") {
          const res  = await fetch(`/api/espn/teams?sport=${sport}`);
          const data = await res.json() as { teams?: RawRecord[] };
          const q    = query.toLowerCase();
          setResults(
            (data.teams ?? [])
              .filter(t => (t.name as string)?.toLowerCase().includes(q) || (t.abbr as string)?.toLowerCase().includes(q))
              .slice(0, 15)
              .map(t => ({ ...t, _label: t.name as string, _sub: t.leagueName as string, _logo: (t.logo as string) || null, _color: (t.color as string) || null }))
          );
        } else {
          if (query.trim().length < 2) { setResults([]); setLoading(false); return; }
          const res  = await fetch(`/api/espn/player-search?q=${encodeURIComponent(query)}&sport=${sport}`);
          const data = await res.json() as { players?: RawRecord[] };
          setResults(
            (data.players ?? []).slice(0, 15).map(p => ({
              ...p,
              _label: p.name as string,
              _sub: `${p.teamName as string}${p.position ? ` · ${p.position as string}` : ""}`,
              _logo: (p.headshot as string) || null,
              _color: null,
            }))
          );
        }
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
  }, [query, sport, type]);

  return (
    <div className={styles.searchOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.searchModal}>
        <div className={styles.searchHead}>
          <span className={styles.searchTitle}>Add {type === "team" ? "Team" : "Player"}</span>
          <button className={styles.searchClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.searchControls}>
          <div className={styles.searchInputWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder={type === "team" ? "Search teams…" : "Search players…"}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <select className={styles.sportSelect} value={sport} onChange={e => setSport(e.target.value as SportSlug)}>
            {SPORT_CONFIGS.map(s => <option key={s.slug} value={s.slug}>{s.icon} {s.label}</option>)}
          </select>
        </div>
        <div className={styles.searchResults}>
          {loading && <div className={styles.searchHint}>Searching…</div>}
          {!loading && query.trim() && results.length === 0 && (
            <div className={styles.searchHint}>No results for &ldquo;{query}&rdquo;</div>
          )}
          {!loading && !query.trim() && (
            <div className={styles.searchHint}>
              {type === "team" ? "Type a team name to search" : "Type at least 2 characters to search players"}
            </div>
          )}
          {results.map(r => {
            const id = r.id as string;
            const isAdded = type === "team" ? existingTeamIds.has(id) : existingPlayerIds.has(id);
            return (
              <button key={id} className={`${styles.srRow} ${isAdded ? styles.srRowAdded : ""}`}
                onClick={() => {
                  if (isAdded) return;
                  if (type === "team") onAddTeam(r, sport);
                  else onAddPlayer(r, sport);
                }}
              >
                {r._logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r._logo} alt={r._label} className={styles.srLogo} />
                ) : (
                  <div className={styles.srLogoFb} style={{ background: (r._color || "#333") + "22" }}>
                    {r._label.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={styles.srInfo}>
                  <span className={styles.srLabel}>{r._label}</span>
                  <span className={styles.srSub}>{r._sub}</span>
                </div>
                <span className={styles.srAction}>
                  {isAdded ? <span className={styles.srAddedTick}>✓ Added</span> : <Plus size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const [tab, setTab]             = useState<"teams" | "players" | "notifs">("teams");
  const [favTeams, setFavTeams]   = useState<FavTeam[]>([]);
  const [favPlayers, setFavPlayers] = useState<FavPlayer[]>([]);
  const [notifs, setNotifs]       = useState<FavNotif[]>([]);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const [showSearch, setShowSearch] = useState<"team" | "player" | null>(null);
  const [loading, setLoading]     = useState(true);
  const [authed, setAuthed]       = useState(true);
  const mountedRef = useRef(false);

  // Load from Supabase on mount
  useEffect(() => {
    mountedRef.current = true;
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
    setNotifs(lsGet<FavNotif[]>(LS_NOTIFS, []));

    apiFetch().then(rows => {
      if (!mountedRef.current) return;
      if (rows === null) { setAuthed(false); setLoading(false); return; }
      setFavTeams(rows.filter(r => r.type === "team").map(rowToTeam));
      setFavPlayers(rows.filter(r => r.type === "player").map(rowToPlayer));
      setLoading(false);
    });

    return () => { mountedRef.current = false; };
  }, []);

  // Persist notifs to localStorage (ephemeral alerts only)
  useEffect(() => { lsSet(LS_NOTIFS, notifs); }, [notifs]);

  const pushNotif = (text: string) =>
    setNotifs(prev => [{ id: Date.now().toString(), text, time: Date.now(), read: false }, ...prev].slice(0, 50));

  const addTeam = async (raw: RawRecord, sport: SportSlug) => {
    const espn_id = raw.id as string;
    if (favTeams.find(t => t.id === espn_id)) return;
    const data: Record<string, unknown> = {
      name: raw.name, shortName: raw.shortName ?? raw.name, abbr: raw.abbr,
      logo: raw.logo ?? null, color: raw.color ?? null,
      leagueId: raw.leagueId, leagueName: raw.leagueName, sport,
    };
    // Optimistic update
    const optimistic: FavTeam = { id: espn_id, name: data.name as string, shortName: data.shortName as string,
      abbr: data.abbr as string, logo: data.logo as string | null, color: data.color as string | null,
      leagueId: data.leagueId as string, leagueName: data.leagueName as string, sport, addedAt: Date.now() };
    setFavTeams(prev => [optimistic, ...prev]);
    pushNotif(`Added ${optimistic.name} to favourites`);
    if (notifPerm === "granted") {
      try { new Notification(optimistic.name, { body: `You'll be notified when ${optimistic.name} plays`, icon: optimistic.logo ?? undefined }); } catch {}
    }
    setShowSearch(null);
    const ok = await apiAdd("team", espn_id, data);
    if (!ok) setFavTeams(prev => prev.filter(t => t.id !== espn_id));
  };

  const addPlayer = async (raw: RawRecord, sport: SportSlug) => {
    const espn_id = raw.id as string;
    if (favPlayers.find(p => p.id === espn_id)) return;
    const data: Record<string, unknown> = {
      name: raw.name, position: raw.position ?? "", teamName: raw.teamName ?? "",
      headshot: raw.headshot ?? null, leagueId: raw.leagueId ?? "", leagueName: raw.leagueName ?? "", sport,
    };
    const optimistic: FavPlayer = { id: espn_id, name: data.name as string, position: data.position as string,
      teamName: data.teamName as string, headshot: data.headshot as string | null,
      leagueId: data.leagueId as string, leagueName: data.leagueName as string, sport, addedAt: Date.now() };
    setFavPlayers(prev => [optimistic, ...prev]);
    pushNotif(`Added ${optimistic.name} to favourites`);
    setShowSearch(null);
    const ok = await apiAdd("player", espn_id, data);
    if (!ok) setFavPlayers(prev => prev.filter(p => p.id !== espn_id));
  };

  const removeTeam = async (id: string) => {
    setFavTeams(prev => prev.filter(t => t.id !== id));
    await apiRemove("team", id);
  };

  const removePlayer = async (id: string) => {
    setFavPlayers(prev => prev.filter(p => p.id !== id));
    await apiRemove("player", id);
  };

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      pushNotif("Browser notifications enabled");
      try { new Notification("Curly Sports", { body: "You'll be notified when your favourite teams play!" }); } catch {}
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;
  const teamIds   = new Set(favTeams.map(t => t.id));
  const playerIds = new Set(favPlayers.map(p => p.id));
  const sportIcon = (slug: string) => SPORT_CONFIGS.find(s => s.slug === slug)?.icon ?? "";

  if (!authed) {
    return (
      <AppShell active="favorites" title="Favorites" subtitle="Your saved teams & players">
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-dim)" }}>
          <Heart size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>Sign in to save your favourite teams and players.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="favorites" title="Favorites" subtitle="Your saved teams & players">
      <div className="stack">

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "teams" ? styles.tabActive : ""}`} onClick={() => setTab("teams")}>
            <Star size={13} /> Teams
            {favTeams.length > 0 && <span className={styles.tabCount}>{favTeams.length}</span>}
          </button>
          <button className={`${styles.tab} ${tab === "players" ? styles.tabActive : ""}`} onClick={() => setTab("players")}>
            <Users size={13} /> Players
            {favPlayers.length > 0 && <span className={styles.tabCount}>{favPlayers.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${tab === "notifs" ? styles.tabActive : ""}`}
            onClick={() => { setTab("notifs"); setNotifs(prev => prev.map(n => ({ ...n, read: true }))); }}
          >
            {notifPerm === "granted" ? <BellRing size={13} /> : <Bell size={13} />}
            Alerts
            {unreadCount > 0 && (
              <span className={styles.tabCount} style={{ background: "var(--coral)", color: "#fff", borderColor: "var(--coral)" }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── TEAMS ──────────────────────────────────────────────────────── */}
        {tab === "teams" && (
          <section className="section">
            <div className="sec-head">
              <div className="title"><Star size={15} className="title-icon" /> Favourite <span className="accent">Teams</span></div>
              <button className={styles.addBtn} onClick={() => setShowSearch("team")}>
                <Plus size={13} /> Add Team
              </button>
            </div>
            {loading ? (
              <div className={styles.emptyState}><Loader size={22} strokeWidth={1.5} style={{ opacity: 0.4, animation: "spin 1s linear infinite" }} /></div>
            ) : favTeams.length === 0 ? (
              <div className={styles.emptyState}>
                <Heart size={32} strokeWidth={1.5} />
                <p>No favourite teams yet.</p>
                <button className={styles.emptyBtn} onClick={() => setShowSearch("team")}>
                  <Plus size={12} /> Add your first team
                </button>
              </div>
            ) : (
              <div className={styles.favTeamsGrid}>
                {favTeams.map(t => (
                  <div key={t.id} className={styles.favTeamCard}>
                    <div className={styles.ftTop}>
                      {t.logo
                        ? <img src={t.logo} alt={t.abbr} className={styles.ftLogo} /> // eslint-disable-line @next/next/no-img-element
                        : <div className={styles.ftLogoFb} style={{ background: (t.color || "#444") + "22" }}>{t.abbr.slice(0, 3)}</div>
                      }
                      <div className={styles.ftTopRight}>
                        <span className={styles.ftSportBadge}>{sportIcon(t.sport)}</span>
                        <button className={styles.removeBtn} onClick={() => removeTeam(t.id)}><X size={12} strokeWidth={2.5} /></button>
                      </div>
                    </div>
                    <h3 className={styles.ftName}>{t.name}</h3>
                    <p className={styles.ftLeague}>{t.leagueName}</p>
                    <div className={styles.ftFooter}>
                      <span className={styles.ftAdded}>{timeAgo(t.addedAt)}</span>
                      {t.color && <div className={styles.ftColorDot} style={{ background: t.color }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── PLAYERS ────────────────────────────────────────────────────── */}
        {tab === "players" && (
          <section className="section">
            <div className="sec-head">
              <div className="title"><Users size={15} className="title-icon" /> Favourite <span className="accent">Players</span></div>
              <button className={styles.addBtn} onClick={() => setShowSearch("player")}>
                <Plus size={13} /> Add Player
              </button>
            </div>
            {loading ? (
              <div className={styles.emptyState}><Loader size={22} strokeWidth={1.5} style={{ opacity: 0.4, animation: "spin 1s linear infinite" }} /></div>
            ) : favPlayers.length === 0 ? (
              <div className={styles.emptyState}>
                <Heart size={32} strokeWidth={1.5} />
                <p>No favourite players yet.</p>
                <button className={styles.emptyBtn} onClick={() => setShowSearch("player")}>
                  <Plus size={12} /> Add your first player
                </button>
              </div>
            ) : (
              <div className={styles.favPlayersList}>
                {favPlayers.map(p => (
                  <div key={p.id} className={styles.favPlayerRow}>
                    {p.headshot
                      ? <img src={p.headshot} alt={p.name} className={styles.fpPhoto} /> // eslint-disable-line @next/next/no-img-element
                      : <div className={styles.fpAvatar}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                    }
                    <div className={styles.fpInfo}>
                      <div className={styles.fpName}>{p.name}</div>
                      <div className={styles.fpMeta}>
                        {p.teamName}{p.position ? ` · ${p.position}` : ""}{p.leagueName ? ` · ${p.leagueName}` : ""}
                      </div>
                    </div>
                    <span className={styles.fpSport}>{sportIcon(p.sport)}</span>
                    <span className={styles.fpAdded}>{timeAgo(p.addedAt)}</span>
                    <button className={styles.removeBtn} onClick={() => removePlayer(p.id)}><X size={12} strokeWidth={2.5} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── NOTIFICATIONS ──────────────────────────────────────────────── */}
        {tab === "notifs" && (
          <section className="section">
            <div className="sec-head">
              <div className="title">
                {notifPerm === "granted" ? <BellRing size={15} className="title-icon" /> : <Bell size={15} className="title-icon" />}
                <span className="accent">Alerts</span>
              </div>
              {notifs.length > 0 && (
                <button className={styles.clearBtn} onClick={() => setNotifs([])}>Clear all</button>
              )}
            </div>

            {notifPerm !== "granted" && (
              <div className={styles.permBanner}>
                <div className={styles.permLeft}>
                  {notifPerm === "denied" ? <BellOff size={18} /> : <Bell size={18} />}
                  <div>
                    <div className={styles.permTitle}>
                      {notifPerm === "denied" ? "Notifications blocked" : "Enable browser notifications"}
                    </div>
                    <div className={styles.permSub}>
                      {notifPerm === "denied"
                        ? "Unblock in your browser settings to receive live alerts."
                        : "Get notified when your favourite teams play, score, and win."}
                    </div>
                  </div>
                </div>
                {notifPerm !== "denied" && (
                  <button className={styles.permBtn} onClick={requestPermission}><Bell size={12} /> Enable</button>
                )}
              </div>
            )}

            {notifs.length === 0 ? (
              <div className={styles.emptyState}>
                <Bell size={32} strokeWidth={1.5} />
                <p>No alerts yet. Add favourite teams and players to get updates.</p>
              </div>
            ) : (
              <div className={styles.notifList}>
                {notifs.map(n => (
                  <div key={n.id} className={`${styles.notifRow} ${!n.read ? styles.notifUnread : ""}`}>
                    <div className={`${styles.notifDot} ${!n.read ? styles.notifDotActive : ""}`} />
                    <div className={styles.notifText}>{n.text}</div>
                    <span className={styles.notifTime}>{timeAgo(n.time)}</span>
                    <button className={styles.removeBtn} onClick={() => setNotifs(prev => prev.filter(x => x.id !== n.id))}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showSearch && (
        <SearchModal
          type={showSearch}
          existingTeamIds={teamIds}
          existingPlayerIds={playerIds}
          onClose={() => setShowSearch(null)}
          onAddTeam={addTeam}
          onAddPlayer={addPlayer}
        />
      )}
    </AppShell>
  );
}
