"use client";
import Link from "next/link";
import { Ico } from "./Icons";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS = [
  { key: "home",    tKey: "nav.home",    icon: "i-home",   href: "/dashboard" },
  { key: "live",    tKey: "nav.liveScores", icon: "i-live",   href: "/live-scores" },
  { key: "funzone", tKey: "nav.debates", icon: "i-spark",  href: "/debates" },
  { key: "leagues", tKey: "nav.leagues", icon: "i-trophy", href: "/leagues" },
];

export default function BottomNav({ active, onMenuOpen }: { active: string; onMenuOpen: () => void }) {
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`bn-item${active === item.key ? " active" : ""}`}
        >
          <Ico id={item.icon} />
          <span>{t(item.tKey)}</span>
        </Link>
      ))}
      <button className="bn-item" onClick={onMenuOpen} aria-label="Open menu">
        <Ico id="i-bars" />
        <span>{t("nav.more")}</span>
      </button>
    </nav>
  );
}
