"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronDown } from "lucide-react";

import { Ico } from "./Icons";
import { useActiveSport, SPORT_CONFIGS } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_MAIN = [
  { key: "home",    tKey: "nav.home",       icon: "i-home",   href: "/dashboard",   feature: null,         countKey: null },
  { key: "live",    tKey: "nav.liveScores", icon: "i-live",   href: "/live-scores", feature: "liveScores", countKey: null },
  { key: "teams",   tKey: "nav.teams",      icon: "i-team",   href: "/teams",       feature: "teams",      countKey: null },
  { key: "players", tKey: "nav.players",    icon: "i-user",   href: "/players",     feature: "players",    countKey: null },
  { key: "leagues", tKey: "nav.leagues",    icon: "i-trophy", href: "/leagues",     feature: "leagues",    countKey: null },
];
const NAV_CONTENT = [
  { key: "news",   tKey: "nav.news",   icon: "i-news",  href: "/news",   feature: "news",  countKey: "common.new" },
  { key: "videos", tKey: "nav.videos", icon: "i-video", href: "/videos", feature: null,    countKey: null  },
];
const NAV_COMMUNITY = [
  { key: "funzone",   tKey: "nav.debates",   icon: "i-spark", href: "/debates",    feature: "funZone",   countKey: "common.hot" },
  { key: "minigames", tKey: "nav.miniGames", icon: "i-game",  href: "/mini-games", feature: "miniGames", countKey: null  },
];
const NAV_PERSONAL = [
  { key: "favorites",     tKey: "nav.favorites",     icon: "i-heart", href: "/favorites",     feature: "favorites", countKey: null },
  { key: "notifications", tKey: "nav.notifications", icon: "i-bell",  href: "/notifications", feature: null,        countKey: null },
];

const SPORT_FLAG_KEY: Record<string, string> = {
  football: "football", basketball: "basketball", nfl: "nfl", tennis: "tennis",
  baseball: "baseball", f1: "f1", cricket: "cricket", mma: "mma", golf: "golf",
  boxing: "boxing", hockey: "hockey",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface MobileMenuProps {
  active: string;
  onClose: () => void;
}

export default function MobileMenu({ active, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { activeSport, activeSportConfig, setActiveSport } = useActiveSport();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [enabledSports, setEnabledSports] = useState<Set<string>>(new Set());
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
  const [sportOpen, setSportOpen] = useState(false);

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
    fetch("/api/admin/flags")
      .then((r) => r.json())
      .then((f) => {
        setEnabledSports(new Set(Object.entries(f.sports ?? {}).filter(([, v]) => v).map(([k]) => k)));
        setEnabledFeatures(new Set(Object.entries(f.features ?? {}).filter(([, v]) => v).map(([k]) => k)));
      })
      .catch(() => {});
  }, []);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    onClose();
    router.push("/login");
  };

  const visibleSports = SPORT_CONFIGS.filter((s) => {
    const flagKey = SPORT_FLAG_KEY[s.slug] ?? s.slug;
    return enabledSports.size === 0 || enabledSports.has(flagKey);
  });

  function filterByFeature<T extends { feature: string | null }>(items: T[]) {
    return items.filter((item) => !item.feature || enabledFeatures.size === 0 || enabledFeatures.has(item.feature));
  }

  type NavItem = { key: string; tKey: string; icon: string; href: string; feature: string | null; countKey: string | null };

  function NavRow({ item }: { item: NavItem }) {
    const isActive = active === item.key;
    return (
      <Link href={item.href} className={`mn-item${isActive ? " mn-item-active" : ""}`} onClick={onClose}>
        <span className="mn-ico"><Ico id={item.icon} /></span>
        <span className="mn-label">{t(item.tKey)}</span>
        {item.countKey && <span className="mn-badge">{t(item.countKey)}</span>}
      </Link>
    );
  }

  return (
    <>
      <div className="mn-backdrop" onClick={onClose} />
      <div className="mn-drawer">
        {/* Drag handle */}
        <div className="mn-handle" />

        {/* Header */}
        <div className="mn-header">
          <span className="mn-header-title">{t("menu.title")}</span>
          <button className="mn-close" onClick={onClose} aria-label={t("menu.close")}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mn-body">
          {/* Sport selector */}
          <div className="mn-sport-wrap">
            <button
              className="mn-sport-btn"
              onClick={() => setSportOpen((v) => !v)}
            >
              <span
                className="mn-sport-icon-badge"
                style={{
                  background: activeSportConfig.color + "22",
                  color: activeSportConfig.color,
                  border: `1.5px solid ${activeSportConfig.color}44`,
                }}
              >
                {activeSportConfig.icon}
              </span>
              <span className="mn-sport-name">{activeSportConfig.label}</span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                style={{
                  marginInlineStart: "auto",
                  color: "var(--text-mute)",
                  transform: sportOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  flexShrink: 0,
                }}
              />
            </button>
            {sportOpen && (
              <div className="mn-sport-list">
                {visibleSports.map((s) => (
                  <button
                    key={s.slug}
                    className={`mn-sport-opt${activeSport === s.slug && !s.comingSoon ? " mn-sport-opt-active" : ""}`}
                    onClick={() => { if (!s.comingSoon) { setActiveSport(s.slug); setSportOpen(false); } }}
                    disabled={s.comingSoon}
                    style={s.comingSoon ? { opacity: 0.5, cursor: "default" } : undefined}
                  >
                    <span
                      style={{
                        fontSize: 10, fontFamily: "var(--mono)", fontWeight: 800,
                        background: s.color + "22", color: s.color,
                        borderRadius: 3, padding: "1px 6px",
                        border: `1px solid ${s.color}44`, flexShrink: 0,
                      }}
                    >
                      {s.icon}
                    </span>
                    {s.label}
                    {s.comingSoon && (
                      <span style={{
                        marginInlineStart: "auto", fontSize: 8, fontWeight: 800, fontFamily: "var(--mono)",
                        color: "var(--text-mute)", background: "var(--surface-2)",
                        padding: "2px 5px", borderRadius: 3, letterSpacing: "0.04em",
                        textTransform: "uppercase", flexShrink: 0,
                      }}>Soon</span>
                    )}
                    {!s.comingSoon && activeSport === s.slug && (
                      <span style={{ marginInlineStart: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mn-section-label">{t("navSection.app")}</div>
          {filterByFeature(NAV_MAIN).map((item) => <NavRow key={item.key} item={item} />)}

          <div className="mn-section-label">{t("navSection.content")}</div>
          {filterByFeature(NAV_CONTENT).map((item) => <NavRow key={item.key} item={item} />)}

          <div className="mn-section-label">{t("navSection.community")}</div>
          {filterByFeature(NAV_COMMUNITY).map((item) => <NavRow key={item.key} item={item} />)}

          <div className="mn-section-label">{t("navSection.personal")}</div>
          {filterByFeature(NAV_PERSONAL).map((item) => <NavRow key={item.key} item={item} />)}
        </div>

        {/* Footer: profile + logout */}
        <div className="mn-footer">
          {profile && (
            <div className="mn-profile">
              <div className="mn-profile-ava">{profile.initials}</div>
              <div className="mn-profile-info">
                <div className="mn-profile-name">{profile.name}</div>
                <div className="mn-profile-email">{profile.email}</div>
              </div>
            </div>
          )}
          <button className="mn-logout-btn" onClick={handleLogout}>
            <Ico id="i-logout" />
            {t("common.logOut")}
          </button>
        </div>
      </div>
    </>
  );
}
