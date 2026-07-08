"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Ico } from "./Icons";
import { useLanguage } from "@/contexts/LanguageContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [initials, setInitials] = useState("\u2026");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (profile) {
          const name = profile.name || profile.username || "User";
          setInitials(name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="topbar">
      <div className="tb-title">
        {title}
        {subtitle && <span className="sub">{subtitle}</span>}
      </div>

      <div className="tb-sponsor" title="Advertise with us">
        <span className="tb-sponsor__label">{t("topbar.ad")}</span>
        <span className="tb-sponsor__icon">{"\u25C8"}</span>
        <span className="tb-sponsor__text">{t("topbar.yourBrandHere")}</span>
      </div>

      <div className="tb-right">
        <button className="tb-icon-btn" title={t("common.live")} onClick={() => router.push("/live-scores")}>
          <Ico id="i-live" />
        </button>
        <button className="tb-icon-btn" title={t("nav.notifications")}>
          <Ico id="i-bell" />
          <span className="pulse-dot" />
        </button>
        <div className="tb-avatar">{initials}</div>
      </div>
    </div>
  );
}
