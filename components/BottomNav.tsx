import Link from "next/link";
import { Ico } from "./Icons";

const ITEMS = [
  { key: "home",    label: "Home",    icon: "i-home",  href: "/dashboard" },
  { key: "live",    label: "Live",    icon: "i-live",  href: "/live-scores" },
  { key: "funzone", label: "Debates", icon: "i-spark", href: "/fun-zone" },
  { key: "leagues", label: "Leagues", icon: "i-trophy",href: "/leagues" },
  { key: "profile", label: "Me",      icon: "i-user",  href: "#profile" },
];

export default function BottomNav({ active }: { active: string }) {
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
    </nav>
  );
}
