"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Ico } from "./Icons";
import AdSlot from "./AdSlot";
import { useActiveSport, SPORT_CONFIGS } from "@/contexts/SportContext";
import { ChevronDown } from "lucide-react";

const NAV_MAIN = [
  { key: "home",    label: "Home",        icon: "i-home",   href: "/dashboard",   feature: null },
  { key: "live",    label: "Live Scores", icon: "i-live",   href: "/live-scores", feature: "liveScores" },
  { key: "teams",   label: "Teams",       icon: "i-team",   href: "/teams",       feature: "teams" },
  { key: "players", label: "Players",     icon: "i-user",   href: "/players",     feature: "players" },
  { key: "leagues", label: "Leagues",     icon: "i-trophy", href: "/leagues",     feature: "leagues" },
];

const NAV_CONTENT = [
  { key: "news",   label: "News",   icon: "i-news",  href: "/news",   count: "NEW", feature: "news" },
  { key: "videos", label: "Videos", icon: "i-video", href: "/videos", feature: null },
];

const NAV_COMMUNITY = [
  { key: "funzone",   label: "Debates",    icon: "i-spark",  href: "/debates",   count: "HOT", feature: "funZone" },
  { key: "minigames", label: "Mini Games", icon: "i-game",   href: "/mini-games", feature: "miniGames" },
];

const NAV_PERSONAL = [
  { key: "favorites",     label: "Favorites",     icon: "i-heart", href: "/favorites",     feature: "favorites" },
  { key: "notifications", label: "Notifications", icon: "i-bell",  href: "/notifications", feature: null },
];

// Map sidebar sport key → flags.sports key
const SPORT_FLAG_KEY: Record<string, string> = {
  football:   "football",
  basketball: "basketball",
  nfl:        "nfl",
  tennis:     "tennis",
  baseball:   "baseball",
  f1:         "f1",
  cricket:    "cricket",
  mma:        "mma",
  golf:       "golf",
  boxing:     "boxing",
  hockey:     "hockey",
};

interface NavItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
  count?: string;
  live?: boolean;
  feature: string | null;
}

function Badge({ item }: { item: NavItem }) {
  if (item.live) return <span className="live-dot" />;
  if (item.count) return <span className="count">{item.count}</span>;
  return <span />;
}

function SbItem({ item, active }: { item: NavItem; active: string }) {
  const isActive = active === item.key;
  const cls = `sb-item${isActive ? " active" : ""}`;
  const inner = (
    <>
      <span className="ico"><Ico id={item.icon} /></span>
      <span className="label">{item.label}</span>
      <Badge item={item} />
    </>
  );
  if (item.href) {
    return <Link href={item.href} className={cls}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}

function SportDropdown({ enabledSports }: { enabledSports: Set<string> }) {
  const { activeSport, activeSportConfig, setActiveSport } = useActiveSport();
  const [open, setOpen] = useState(false);

  const visibleSports = SPORT_CONFIGS.filter((s) => {
    const flagKey = SPORT_FLAG_KEY[s.slug] ?? s.slug;
    return enabledSports.size === 0 || enabledSports.has(flagKey);
  });

  return (
    <div style={{ padding: "4px 12px 8px", position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "9px 12px",
          background: "var(--surface-2)", border: `1.5px solid ${open ? "var(--ink)" : "var(--border-2)"}`,
          borderRadius: 10, cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 32, height: 20, padding: "0 5px",
          fontSize: 9, fontWeight: 900, fontFamily: "var(--mono)",
          background: activeSportConfig.color, color: "#000",
          borderRadius: 3,
          letterSpacing: "0.05em", flexShrink: 0,
        }}>{activeSportConfig.icon}</span>
        <span style={{ flex: 1, fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, color: "var(--ink)", textAlign: "left" }}>
          {activeSportConfig.label}
        </span>
        <ChevronDown size={14} strokeWidth={2.5} style={{ color: "var(--text-mute)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", left: 12, right: 12, top: "calc(100% - 4px)",
          background: "var(--surface)", border: "2px solid var(--ink)",
          borderRadius: 10, overflow: "hidden", zIndex: 200,
          boxShadow: "4px 4px 0 var(--ink)",
        }}>
          {visibleSports.map((s) => (
            <button
              key={s.slug}
              onClick={() => { if (!s.comingSoon) { setActiveSport(s.slug); setOpen(false); } }}
              disabled={s.comingSoon}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 14px", border: "none",
                borderBottom: "1px solid var(--border-2)",
                background: activeSport === s.slug ? "rgba(200,255,61,0.12)" : "transparent",
                cursor: s.comingSoon ? "default" : "pointer", transition: "background 0.1s",
                fontFamily: "var(--display)", fontSize: 13, fontWeight: activeSport === s.slug ? 700 : 600,
                color: s.comingSoon ? "var(--text-mute)" : activeSport === s.slug ? "var(--ink)" : "var(--text-dim)",
                opacity: s.comingSoon ? 0.5 : 1,
              }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 28, height: 18, padding: "0 4px",
                fontSize: 8, fontWeight: 900, fontFamily: "var(--mono)",
                background: s.color, color: "#000",
                borderRadius: 3,
                letterSpacing: "0.05em", flexShrink: 0,
              }}>{s.icon}</span>
              {s.label}
              {s.comingSoon && (
                <span style={{
                  marginLeft: "auto", fontSize: 8, fontWeight: 800, fontFamily: "var(--mono)",
                  color: "var(--text-mute)", background: "var(--surface-2)",
                  padding: "2px 5px", borderRadius: 3, letterSpacing: "0.04em",
                  textTransform: "uppercase", flexShrink: 0,
                }}>Soon</span>
              )}
              {!s.comingSoon && activeSport === s.slug && (
                <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [enabledSports, setEnabledSports] = useState<Set<string>>(new Set());
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
  const [flagsLoaded, setFlagsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (profile) {
          const name = profile.name || profile.username || "User";
          setProfile({ name, email: profile.email ?? "", initials: getInitials(name) });
        }
      })
      .catch(() => {});
  }, []);

  // Load feature flags to filter nav
  useEffect(() => {
    fetch("/api/admin/flags")
      .then((r) => r.json())
      .then((f) => {
        const sports = new Set<string>(
          Object.entries(f.sports ?? {}).filter(([, v]) => v).map(([k]) => k)
        );
        const features = new Set<string>(
          Object.entries(f.features ?? {}).filter(([, v]) => v).map(([k]) => k)
        );
        setEnabledSports(sports);
        setEnabledFeatures(features);
        setFlagsLoaded(true);
      })
      .catch(() => setFlagsLoaded(true));
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deletePassword ? { password: deletePassword } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Failed to delete account.");
      }
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account.";
      setDeleteError(msg);
      setDeleting(false);
    }
  };

  // Filter nav items by feature flags (show all if flags not yet loaded)
  function filterByFeature(items: NavItem[]) {
    if (!flagsLoaded) return items;
    return items.filter((item) => !item.feature || enabledFeatures.has(item.feature));
  }

  return (
    <>
    <aside className="sb">
      <Link className="sb-logo" href="/dashboard">
        <div className="mark">
          <Image src="/curly-guy.png" alt="Curly" width={40} height={40} quality={100} />
        </div>
        <div className="sb-logo-text">
          curly<span className="dot">.</span>sports
        </div>
      </Link>

      <div className="sb-ad-top">
        <AdSlot size="compact" label="Ad" />
      </div>

      <SportDropdown enabledSports={enabledSports} />

      <div className="sb-section">App</div>
      {filterByFeature(NAV_MAIN).map((item) => (
        <SbItem key={item.key} item={item} active={active} />
      ))}

      <div className="sb-section">Content</div>
      {filterByFeature(NAV_CONTENT).map((item) => (
        <SbItem key={item.key} item={item} active={active} />
      ))}

      <div className="sb-section">Community</div>
      {filterByFeature(NAV_COMMUNITY).map((item) => (
        <SbItem key={item.key} item={item} active={active} />
      ))}

      <div className="sb-section">Personal</div>
      {filterByFeature(NAV_PERSONAL).map((item) => (
        <SbItem key={item.key} item={item} active={active} />
      ))}

      <div className="sb-ad">
        <AdSlot size="square" label="Ad" />
      </div>

      <div className="sb-profile">
        <div className="sb-profile-ava">{profile?.initials ?? "…"}</div>
        <div className="sb-profile-info">
          <div className="sb-profile-name">{profile?.name ?? "Loading…"}</div>
          <div className="sb-profile-meta">{profile?.email ?? ""}</div>
        </div>
      </div>

      <button onClick={handleLogout} className="sb-item sb-logout">
        <span className="label">Log out</span>
      </button>

      <button
        onClick={() => { setShowDeleteModal(true); setDeleteError(null); setDeletePassword(""); }}
        className="sb-delete-link"
      >
        Delete account
      </button>

    </aside>
    {showDeleteModal && createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.5)" }}>
        <div style={{ background: "var(--surface)", border: "2px solid var(--ink)", borderRadius: 16, padding: 28, width: 360, maxWidth: "90vw", boxShadow: "6px 6px 0 var(--ink)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--coral)", border: "2px solid var(--ink)", display: "grid", placeItems: "center", color: "var(--ink)", flexShrink: 0 }}>
              <svg width="18" height="18" aria-hidden="true"><use href="#i-trash" /></svg>
            </span>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 18, color: "var(--ink)" }}>Delete account</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-mute)", marginTop: 1 }}>This cannot be undone</div>
            </div>
          </div>

          <p style={{ fontFamily: "var(--body)", fontSize: 13.5, color: "var(--text-mute)", lineHeight: 1.5, margin: "0 0 18px" }}>
            Your profile, favourites, predictions, and votes will be permanently removed.
          </p>

          <input
            type="password"
            placeholder="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg)", border: "2px solid var(--border-2)", borderRadius: 10, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
          />

          {deleteError && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--coral)", marginTop: 8 }}>{deleteError}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={{ flex: 1, padding: 12, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, background: "var(--surface-3)", border: "2px solid var(--border-2)", borderRadius: 10, color: "var(--ink)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{ flex: 1, padding: 12, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, background: "var(--coral)", border: "2px solid var(--ink)", borderRadius: 10, color: "var(--ink)", cursor: deleting ? "not-allowed" : "pointer", boxShadow: "3px 3px 0 var(--ink)" }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
