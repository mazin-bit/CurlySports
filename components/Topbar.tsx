"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Ico } from "./Icons";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [initials, setInitials] = useState("…");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
        setInitials(name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));
      }
    });
  }, []);

  return (
    <div className="topbar">
      <div className="tb-title">
        {title}
        {subtitle && <span className="sub">{subtitle}</span>}
      </div>

      <div className="tb-sponsor" title="Advertise with us">
        <span className="tb-sponsor__label">Ad</span>
        <span className="tb-sponsor__icon">◈</span>
        <span className="tb-sponsor__text">Your brand here</span>
      </div>

      <div className="tb-right">
        <button className="tb-icon-btn" title="Live">
          <Ico id="i-live" />
        </button>
        <button className="tb-icon-btn" title="Notifications">
          <Ico id="i-bell" />
          <span className="pulse-dot" />
        </button>
        <div className="tb-avatar">{initials}</div>
      </div>
    </div>
  );
}
