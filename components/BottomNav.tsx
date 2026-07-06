import Link from "next/link";
import { Ico } from "./Icons";

const ITEMS = [
  { key: "home",    label: "Home",    icon: "i-home",   href: "/dashboard" },
  { key: "live",    label: "Live",    icon: "i-live",   href: "/live-scores" },
  { key: "funzone", label: "Debates", icon: "i-spark",  href: "/debates" },
  { key: "leagues", label: "Leagues", icon: "i-trophy", href: "/leagues" },
];

export default function BottomNav({ active, onMenuOpen }: { active: string; onMenuOpen: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`bn-item${active === item.key ? " active" : ""}`}
        >
          <Ico id={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
      <button className="bn-item" onClick={onMenuOpen} aria-label="Open menu">
        <Ico id="i-bars" />
        <span>More</span>
      </button>
    </nav>
  );
}
