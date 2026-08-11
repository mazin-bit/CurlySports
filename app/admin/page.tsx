"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  LayoutDashboard, Flag, Dumbbell, Wrench, Bell, Menu, X,
  LogOut, Eye, EyeOff, Shield, Save, RefreshCw,
  Activity, Zap, Globe, CheckCircle2, XCircle,
  ChevronRight, AlertTriangle, BarChart2, Clock,
  Wifi, WifiOff, Users, Search, Trash2, Mail, MessageSquare, Radio,
  Star, MessageCircle, BarChart3, Ban, Megaphone, ImagePlus,
  Building2, MapPin, Smartphone, Monitor, TrendingUp, Calendar,
  Send, Target, DollarSign, Award, AlertOctagon, Upload, Pin,
  Trophy, Gift, Crown, Medal, Download, Dices,
} from "lucide-react";
import styles from "./admin.module.css";
import { DEFAULT_FLAGS, AdminFlags } from "@/lib/featureFlags";


/* ── helpers ───────────────────────────────────── */
const SPORT_META: Record<string, { label: string; abbr: string; color: string }> = {
  football:   { label: "Football",   abbr: "SOC", color: "#c8ff3d" },
  basketball: { label: "Basketball", abbr: "NBA", color: "#ff5b3d" },
  nfl:        { label: "NFL",        abbr: "NFL", color: "#1a3c8f" },
  tennis:     { label: "Tennis",     abbr: "TEN", color: "#4caf50" },
  baseball:   { label: "Baseball",   abbr: "MLB", color: "#1a73e8" },
  f1:         { label: "Formula 1",  abbr: "F1",  color: "#e10600" },
  cricket:    { label: "Cricket",    abbr: "CRI", color: "#ff8c42" },
  hockey:     { label: "Hockey",     abbr: "NHL", color: "#00acc1" },
  golf:       { label: "Golf",       abbr: "PGA", color: "#2e7d32" },
  boxing:     { label: "Boxing",     abbr: "BOX", color: "#9c27b0" },
  mma:        { label: "MMA / UFC",  abbr: "MMA", color: "#9c27b0" },
};

const FEATURE_META: Record<string, { label: string; desc: string; href: string }> = {
  liveScores: { label: "Live Scores",  desc: "Real-time match scores via ESPN SSE",        href: "/live-scores" },
  news:       { label: "News Feed",    desc: "ESPN + Tavily + RSS news aggregation",        href: "/news" },
  funZone:    { label: "Debates",      desc: "Debates, polls, and community content",       href: "/debates" },
  miniGames:  { label: "Mini Games",   desc: "Quiz games, player guess, leaderboards",      href: "/mini-games" },
  leagues:    { label: "Leagues",      desc: "Standings, tables, and season data",          href: "/leagues" },
  players:    { label: "Players",      desc: "Player profiles and stats directory",         href: "/players" },
  teams:      { label: "Teams",        desc: "Team rosters and information",                href: "/teams" },
  favorites:  { label: "Favorites",    desc: "Saved teams, players, and matches",           href: "/favorites" },
  redeemCodes:{ label: "Redeem Codes", desc: "Enable/disable referral code system across the app", href: "" },
  challenges: { label: "Challenges",  desc: "Show challenge section when an active challenge exists", href: "" },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
      onClick={() => onChange(!on)}
      aria-label={on ? "Disable" : "Enable"}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ color: color ?? "var(--a-accent)" }}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Auth gate ─────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        localStorage.setItem("curly-admin-token", pw);
        onLogin();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 500) {
          setErr("Admin not configured on server. Set ADMIN_PASSWORD env var.");
        } else {
          setErr(data.error || "Incorrect password. Try again.");
        }
      }
    } catch {
      setErr("Connection error.");
    }
    setLoading(false);
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <Image src="/curly-guy.png" alt="Curly" width={48} height={48} />
          <div>
            <div className={styles.loginBrand}>curly<span>.</span>sports</div>
            <div className={styles.loginSub}>Super Admin</div>
          </div>
        </div>
        <div className={styles.loginShield}><Shield size={32} strokeWidth={1.5} /></div>
        <h1 className={styles.loginTitle}>Admin Access</h1>
        <p className={styles.loginHint}>Enter your admin password to continue.</p>
        <form onSubmit={submit} className={styles.loginForm}>
          <div className={styles.loginField}>
            <input
              className={styles.loginInput}
              type={show ? "text" : "password"}
              placeholder="Admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
            <button type="button" className={styles.loginEye} onClick={() => setShow(!show)}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {err && <div className={styles.loginErr}>{err}</div>}
          <button className={styles.loginBtn} disabled={loading || !pw}>
            {loading ? "Checking..." : "Enter dashboard"}
          </button>
        </form>
        <div className={styles.loginBack}>
          <a href="/dashboard">Back to app</a>
        </div>
      </div>
    </div>
  );
}

/* ── Overview tab (enhanced) ──────────────────── */
interface AnalyticsData {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  totalPageViews: number;
  platformBreakdown: { ios: number; android: number; web: number };
  installs: { ios: number; android: number };
  topCountries: { country: string; count: number }[];
  dailyActive: { date: string; count: number }[];
  dailyNew: { date: string; count: number }[];
  trackingStartDate: string | null;
  firstUserDate: string | null;
}

function OverviewTab({ flags, adminToken }: { flags: AdminFlags; adminToken: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const totalViews = Object.values(flags.pageViews ?? {}).reduce((a, b) => a + b, 0);
  const activeFeatures = Object.values(flags.features ?? {}).filter(Boolean).length;
  const activeSports = Object.values(flags.sports ?? {}).filter(Boolean).length;
  const topPages = Object.entries(flags.pageViews ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  useEffect(() => {
    fetch("/api/admin/analytics", { headers: { "x-admin-token": adminToken } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAnalytics(d); })
      .catch(() => {});
  }, [adminToken]);

  const pTotal = analytics?.platformBreakdown
    ? analytics.platformBreakdown.ios + analytics.platformBreakdown.android + analytics.platformBreakdown.web
    : 0;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Overview</h2>
        <span className={styles.tabDesc}>Platform health and analytics at a glance.</span>
      </div>

      <div className={styles.statsRow}>
        <StatCard
          icon={<Users size={20} />}
          label="Total Users"
          value={analytics?.totalUsers?.toLocaleString() ?? totalViews.toLocaleString()}
          sub={analytics ? `${analytics.activeToday} active today` : "all time"}
          color="#c8ff3d"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="New This Week"
          value={analytics?.newThisWeek?.toLocaleString() ?? "0"}
          sub={analytics?.firstUserDate ? `since ${new Date(analytics.firstUserDate).toLocaleDateString()}` : undefined}
          color="#5dd9ff"
        />
        <StatCard
          icon={<BarChart2 size={20} />}
          label="Page Views"
          value={analytics?.totalPageViews?.toLocaleString() ?? totalViews.toLocaleString()}
          sub={analytics?.trackingStartDate ? `since ${new Date(analytics.trackingStartDate).toLocaleDateString()}` : "all time"}
        />
        <StatCard
          icon={flags.maintenanceMode ? <WifiOff size={20} /> : <Wifi size={20} />}
          label="Site Status"
          value={flags.maintenanceMode ? "Maintenance" : "Live"}
          color={flags.maintenanceMode ? "#ef4444" : "#22c55e"}
        />
      </div>

      <div className={styles.statsRow}>
        <StatCard
          icon={<Zap size={20} />}
          label="Active Features"
          value={`${activeFeatures} / ${Object.keys(flags.features ?? {}).length}`}
          color="#c8ff3d"
        />
        <StatCard
          icon={<Globe size={20} />}
          label="Active Sports"
          value={`${activeSports} / ${Object.keys(flags.sports ?? {}).length}`}
          color="#5dd9ff"
        />
        <StatCard
          icon={<Smartphone size={20} />}
          label="iOS Installs"
          value={analytics?.installs?.ios?.toLocaleString() ?? "0"}
          sub={analytics?.trackingStartDate ? `since ${new Date(analytics.trackingStartDate).toLocaleDateString()}` : undefined}
          color="#5dd9ff"
        />
        <StatCard
          icon={<Smartphone size={20} />}
          label="Android Installs"
          value={analytics?.installs?.android?.toLocaleString() ?? "0"}
          sub={analytics?.trackingStartDate ? `since ${new Date(analytics.trackingStartDate).toLocaleDateString()}` : undefined}
          color="#22c55e"
        />
      </div>

      {/* Platform breakdown */}
      {analytics && pTotal > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Platform Breakdown</div>
          <div className={styles.chartContainer}>
            <div className={styles.hBarChart}>
              {[
                { label: "iOS", value: analytics.platformBreakdown.ios, color: "#5dd9ff" },
                { label: "Android", value: analytics.platformBreakdown.android, color: "#22c55e" },
                { label: "Web", value: analytics.platformBreakdown.web, color: "#c8ff3d" },
              ].map(p => {
                const pct = Math.round((p.value / pTotal) * 100);
                return (
                  <div key={p.label} className={styles.hBarRow}>
                    <span className={styles.hBarLabel}>{p.label}</span>
                    <div className={styles.hBarTrack}>
                      <div
                        className={styles.hBarFill}
                        style={{ width: `${Math.max(pct, 2)}%`, background: p.color }}
                      >
                        {pct > 10 && <span className={styles.hBarPercent}>{pct}%</span>}
                      </div>
                    </div>
                    <span className={styles.hBarCount}>{p.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top countries */}
      {analytics && analytics.topCountries.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Top Countries</div>
          <div className={styles.pvTable}>
            <div className={styles.pvRow} style={{ opacity: 0.5 }}>
              <span>Country</span><span>Users</span>
            </div>
            {analytics.topCountries.slice(0, 8).map(c => (
              <div key={c.country} className={styles.pvRow}>
                <span className={styles.pvRoute}>{c.country}</span>
                <span className={styles.pvCount}>{c.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {flags.siteNoticeEnabled && (
        <div className={styles.noticePreview}>
          <Bell size={14} />
          <span>Active site notice: <em>{flags.siteNotice || "(empty)"}</em></span>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Page Views Breakdown</div>
        {topPages.length === 0 ? (
          <div className={styles.empty}>No page view data yet. Views are recorded as users navigate the app.</div>
        ) : (
          <div className={styles.pvTable}>
            <div className={styles.pvRow} style={{ opacity: 0.5 }}>
              <span>Route</span><span>Views</span>
            </div>
            {topPages.map(([page, count]) => (
              <div key={page} className={styles.pvRow}>
                <span className={styles.pvRoute}>{page}</span>
                <span className={styles.pvCount}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Activity Log</div>
        {(flags.activityLog ?? []).length === 0 ? (
          <div className={styles.empty}>No recent admin actions.</div>
        ) : (
          <div className={styles.logList}>
            {(flags.activityLog ?? []).slice(0, 15).map((entry, i) => (
              <div key={i} className={styles.logRow}>
                <Clock size={12} />
                <span className={styles.logAction}>{entry.action}</span>
                <span className={styles.logTime}>{new Date(entry.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Analytics tab (NEW) ──────────────────────── */
function AnalyticsTab({ adminToken }: { adminToken: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/analytics", { headers: { "x-admin-token": adminToken } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  if (loading) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Analytics</h2>
          <span className={styles.tabDesc}>Loading analytics data...</span>
        </div>
        <div className={styles.empty}><RefreshCw size={16} className={styles.spin} /> Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Analytics</h2>
          <span className={styles.tabDesc}>Detailed usage analytics and growth metrics.</span>
        </div>
        <div className={styles.empty}>No analytics data available. The analytics API may not be configured yet.</div>
      </div>
    );
  }

  const pTotal = data.platformBreakdown.ios + data.platformBreakdown.android + data.platformBreakdown.web;
  const dauMax = Math.max(...data.dailyActive.map(d => d.count), 1);
  const dnuMax = Math.max(...data.dailyNew.map(d => d.count), 1);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Analytics</h2>
        <span className={styles.tabDesc}>Detailed usage analytics and growth metrics.</span>
      </div>

      <div className={styles.statsRow}>
        <StatCard icon={<Users size={20} />} label="Total Users" value={data.totalUsers.toLocaleString()} sub={data.firstUserDate ? `since ${new Date(data.firstUserDate).toLocaleDateString()}` : "all time"} color="#c8ff3d" />
        <StatCard icon={<Activity size={20} />} label="Active Today" value={data.activeToday.toLocaleString()} color="#22c55e" />
        <StatCard icon={<TrendingUp size={20} />} label="New This Week" value={data.newThisWeek.toLocaleString()} color="#5dd9ff" />
        <StatCard icon={<BarChart2 size={20} />} label="Total Page Views" value={data.totalPageViews.toLocaleString()} sub={data.trackingStartDate ? `since ${new Date(data.trackingStartDate).toLocaleDateString()}` : "tracking active"} />
      </div>

      {/* Daily Active Users chart */}
      {data.dailyActive.length > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.chartTitle}>Daily Active Users (14 days)</div>
          <div className={styles.barChart}>
            {data.dailyActive.slice(-14).map((d, i) => {
              const pct = Math.round((d.count / dauMax) * 100);
              const dateLabel = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <div key={i} className={styles.barCol}>
                  <div className={styles.bar} style={{ height: `${Math.max(pct, 3)}%` }}>
                    <span className={styles.barValue}>{d.count}</span>
                  </div>
                  <span className={styles.barLabel}>{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily New Users chart */}
      {data.dailyNew.length > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.chartTitle}>Daily New Users (14 days)</div>
          <div className={styles.barChart}>
            {data.dailyNew.slice(-14).map((d, i) => {
              const pct = Math.round((d.count / dnuMax) * 100);
              const dateLabel = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <div key={i} className={styles.barCol}>
                  <div className={styles.bar} style={{ height: `${Math.max(pct, 3)}%`, background: "#5dd9ff" }}>
                    <span className={styles.barValue} style={{ color: "#5dd9ff" }}>{d.count}</span>
                  </div>
                  <span className={styles.barLabel}>{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform distribution */}
      {pTotal > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.chartTitle}>Platform Distribution</div>
          <div className={styles.hBarChart}>
            {[
              { label: "iOS", value: data.platformBreakdown.ios, color: "#5dd9ff" },
              { label: "Android", value: data.platformBreakdown.android, color: "#22c55e" },
              { label: "Web", value: data.platformBreakdown.web, color: "#c8ff3d" },
            ].map(p => {
              const pct = Math.round((p.value / pTotal) * 100);
              return (
                <div key={p.label} className={styles.hBarRow}>
                  <span className={styles.hBarLabel}>{p.label}</span>
                  <div className={styles.hBarTrack}>
                    <div
                      className={styles.hBarFill}
                      style={{ width: `${Math.max(pct, 2)}%`, background: p.color }}
                    >
                      {pct > 10 && <span className={styles.hBarPercent}>{pct}%</span>}
                    </div>
                  </div>
                  <span className={styles.hBarCount}>{p.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Install tracking */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Install Tracking</div>
        <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <StatCard icon={<Smartphone size={20} />} label="iOS Installs" value={data.installs.ios.toLocaleString()} sub={data.trackingStartDate ? `since ${new Date(data.trackingStartDate).toLocaleDateString()}` : "tracking active"} color="#5dd9ff" />
          <StatCard icon={<Smartphone size={20} />} label="Android Installs" value={data.installs.android.toLocaleString()} sub={data.trackingStartDate ? `since ${new Date(data.trackingStartDate).toLocaleDateString()}` : "tracking active"} color="#22c55e" />
        </div>
      </div>

      {/* Geographic data */}
      {data.topCountries.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Geographic Distribution</div>
          <div className={styles.pvTable}>
            <div className={styles.pvRow} style={{ opacity: 0.5 }}>
              <span>Country</span><span>Users</span>
            </div>
            {data.topCountries.map(c => (
              <div key={c.country} className={styles.pvRow}>
                <span className={styles.pvRoute}><MapPin size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />{c.country}</span>
                <span className={styles.pvCount}>{c.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Feature Flags tab ─────────────────────────── */
function FlagsTab({ flags, onSave }: { flags: AdminFlags; onSave: (u: Partial<AdminFlags>, action: string) => Promise<void> }) {
  const [local, setLocal] = useState({ ...flags.features });

  useEffect(() => { setLocal({ ...flags.features }); }, [flags.features]);

  async function toggle(key: string) {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    await onSave(
      { features: next },
      `${next[key] ? "Enabled" : "Disabled"} feature: ${FEATURE_META[key]?.label ?? key}`
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Feature Flags</h2>
        <span className={styles.tabDesc}>Toggle platform features on or off. Changes take effect immediately for all users.</span>
      </div>
      <div className={styles.flagsList}>
        {Object.entries(local).map(([key, enabled]) => {
          const meta = FEATURE_META[key];
          return (
            <div key={key} className={`${styles.flagRow} ${!enabled ? styles.flagRowOff : ""}`}>
              <div className={styles.flagInfo}>
                <div className={styles.flagLabel}>
                  {enabled ? <CheckCircle2 size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
                  {meta?.label ?? key}
                </div>
                <div className={styles.flagDesc}>{meta?.desc}</div>
              </div>
              <div className={styles.flagRight}>
                <span className={styles.flagStatus}>{enabled ? "ON" : "OFF"}</span>
                <Toggle on={enabled} onChange={() => toggle(key)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sports tab ────────────────────────────────── */
function SportsTab({ flags, onSave }: { flags: AdminFlags; onSave: (u: Partial<AdminFlags>, action: string) => Promise<void> }) {
  const [local, setLocal] = useState({ ...flags.sports });

  useEffect(() => { setLocal({ ...flags.sports }); }, [flags.sports]);

  async function toggle(key: string) {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    await onSave(
      { sports: next },
      `${next[key] ? "Enabled" : "Disabled"} sport: ${SPORT_META[key]?.label ?? key}`
    );
  }

  const allOn = Object.values(local).every(Boolean);

  async function toggleAll() {
    const next: Record<string, boolean> = {};
    Object.keys(local).forEach((k) => { next[k] = !allOn; });
    setLocal(next);
    await onSave({ sports: next }, `${allOn ? "Disabled" : "Enabled"} all sports`);
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Sports Control</h2>
        <span className={styles.tabDesc}>Hide sports from the navigation and sport selector. Disabled sports won&apos;t appear for users.</span>
      </div>
      <div className={styles.allToggleRow}>
        <span>{allOn ? "All sports visible" : "Some sports hidden"}</span>
        <button className={styles.btnGhost} onClick={toggleAll}>{allOn ? "Disable all" : "Enable all"}</button>
      </div>
      <div className={styles.sportsGrid}>
        {Object.entries(local).map(([key, enabled]) => {
          const meta = SPORT_META[key];
          return (
            <div key={key} className={`${styles.sportCard} ${!enabled ? styles.sportCardOff : ""}`}>
              <div className={styles.sportEmoji} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900, fontFamily: "monospace",
                background: (meta?.color ?? "#888") + "22", color: meta?.color ?? "#888",
                borderRadius: 4, padding: "3px 6px", letterSpacing: "0.05em",
              }}>{meta?.abbr ?? "SPT"}</div>
              <div className={styles.sportLabel}>{meta?.label ?? key}</div>
              <div className={styles.sportStatus}>{enabled ? "Visible" : "Hidden"}</div>
              <Toggle on={enabled} onChange={() => toggle(key)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Maintenance tab ───────────────────────────── */
function MaintenanceTab({ flags, onSave }: { flags: AdminFlags; onSave: (u: Partial<AdminFlags>, action: string) => Promise<void> }) {
  const [mode, setMode] = useState(flags.maintenanceMode);
  const [msg, setMsg] = useState(flags.maintenanceMessage);
  const [est, setEst] = useState(flags.maintenanceEstimated);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMode(flags.maintenanceMode);
    setMsg(flags.maintenanceMessage);
    setEst(flags.maintenanceEstimated);
  }, [flags]);

  async function save() {
    setSaving(true);
    await onSave(
      { maintenanceMode: mode, maintenanceMessage: msg, maintenanceEstimated: est },
      `${mode ? "Enabled" : "Disabled"} maintenance mode`
    );
    setSaving(false);
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Maintenance Mode</h2>
        <span className={styles.tabDesc}>When enabled, all pages show a maintenance screen. The admin dashboard remains accessible.</span>
      </div>

      <div className={`${styles.maintenanceCard} ${mode ? styles.maintenanceCardOn : ""}`}>
        <div className={styles.maintenanceTop}>
          <div>
            <div className={styles.maintenanceTitle}>
              {mode ? <><WifiOff size={18} color="#ef4444" /> Maintenance mode is ON</> : <><Wifi size={18} color="#22c55e" /> Site is live</>}
            </div>
            <div className={styles.maintenanceHint}>
              {mode ? "Users are seeing the maintenance page right now." : "Toggle on to show maintenance page to all users."}
            </div>
          </div>
          <Toggle on={mode} onChange={setMode} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Maintenance Message</div>
        <textarea
          className={styles.textarea}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="Message shown to users during maintenance..."
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Estimated downtime</div>
        <input
          className={styles.input}
          value={est}
          onChange={(e) => setEst(e.target.value)}
          placeholder="e.g. About 30 minutes  |  Back by 3 PM"
        />
        <div className={styles.fieldHint}>Optional -- shown under the maintenance message.</div>
      </div>

      <div className={styles.maintenancePreview}>
        <div className={styles.previewLabel}>Preview</div>
        <div className={styles.maintenancePreviewCard}>
          <div className={styles.mpIcon}><Wrench size={24} strokeWidth={1.5} /></div>
          <div className={styles.mpTitle}>We&apos;ll be right back</div>
          <div className={styles.mpMsg}>{msg || "We're making some improvements."}</div>
          {est && <div className={styles.mpEst}>{est}</div>}
          <div className={styles.mpBrand}>curly<span>.</span>sports</div>
        </div>
      </div>

      {mode && (
        <div className={styles.dangerBanner}>
          <AlertTriangle size={16} />
          <strong>Warning:</strong> Maintenance mode is currently active. All users see the maintenance page.
        </div>
      )}

      <button className={styles.btnSave} onClick={save} disabled={saving}>
        {saving ? <><RefreshCw size={14} className={styles.spin} /> Saving...</> : <><Save size={14} /> Save changes</>}
      </button>
    </div>
  );
}

/* ── Site Notice tab ───────────────────────────── */
function NoticeTab({ flags, onSave }: { flags: AdminFlags; onSave: (u: Partial<AdminFlags>, action: string) => Promise<void> }) {
  const [enabled, setEnabled] = useState(flags.siteNoticeEnabled);
  const [notice, setNotice] = useState(flags.siteNotice);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(flags.siteNoticeEnabled);
    setNotice(flags.siteNotice);
  }, [flags]);

  async function save() {
    setSaving(true);
    await onSave(
      { siteNoticeEnabled: enabled, siteNotice: notice },
      `${enabled ? "Enabled" : "Disabled"} site notice`
    );
    setSaving(false);
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Site Notice Banner</h2>
        <span className={styles.tabDesc}>Show a banner at the top of all pages -- useful for announcements, alerts, or news.</span>
      </div>

      <div className={styles.flagRow}>
        <div className={styles.flagInfo}>
          <div className={styles.flagLabel}>
            {enabled ? <CheckCircle2 size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
            Show notice banner
          </div>
          <div className={styles.flagDesc}>Displays above the topbar on all interior pages.</div>
        </div>
        <div className={styles.flagRight}>
          <span className={styles.flagStatus}>{enabled ? "ON" : "OFF"}</span>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>
      </div>

      <div className={styles.section} style={{ marginTop: 24 }}>
        <div className={styles.sectionTitle}>Notice text</div>
        <input
          className={styles.input}
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="e.g. New feature: live match commentary is now available!"
        />
        <div className={styles.fieldHint}>Keep it short -- one line ideal.</div>
      </div>

      {enabled && notice && (
        <div className={styles.noticePreviewWrap}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.noticeBannerPreview}>
            <Bell size={14} />
            <span>{notice}</span>
            <button className={styles.noticeClose}>x</button>
          </div>
        </div>
      )}

      <button className={styles.btnSave} onClick={save} disabled={saving} style={{ marginTop: 24 }}>
        {saving ? <><RefreshCw size={14} className={styles.spin} /> Saving...</> : <><Save size={14} /> Save changes</>}
      </button>
    </div>
  );
}

/* ── Users tab (enhanced) ─────────────────────── */
interface AdminUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  emailVerified: boolean;
  favTeam: { code: string; name: string } | null;
  authMethod: "email" | "google";
  createdAt: string;
  isBanned?: boolean;
  platform?: "ios" | "android" | "web";
  lastLoginLocation?: string;
  _count: { favorites: number; predictions: number; debateVotes: number };
}

function UsersTab({ adminToken }: { adminToken: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [banning, setBanning] = useState<string | null>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (q) params.set("search", q);
    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { load(page, search); }, [page, load, search]);

  const doSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(1, search); };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/users?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    setUsers(u => u.filter(x => x.id !== id));
    setTotal(t => t - 1);
    setDeleting(null);
  };

  const toggleBan = async (id: string, currentBanned: boolean) => {
    setBanning(id);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, isBanned: !currentBanned }),
    });
    if (res.ok) {
      setUsers(u => u.map(x => x.id === id ? { ...x, isBanned: !currentBanned } : x));
    }
    setBanning(null);
  };

  const platformIcon = (p?: string) => {
    if (p === "ios") return <Smartphone size={11} />;
    if (p === "android") return <Smartphone size={11} />;
    if (p === "web") return <Monitor size={11} />;
    return null;
  };

  const platformLabel = (p?: string) => {
    if (p === "ios") return "iOS";
    if (p === "android") return "Android";
    if (p === "web") return "Web";
    return null;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>User Management</h2>
        <span className={styles.tabDesc}>View and manage registered users. {total} total user{total !== 1 ? "s" : ""}.</span>
      </div>

      <form onSubmit={doSearch} className={styles.usersSearch}>
        <Search size={14} className={styles.usersSearchIcon} />
        <input
          className={styles.usersSearchInput}
          placeholder="Search by email, username, or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); if (!e.target.value) { setPage(1); load(1, ""); } }}
        />
      </form>

      <div className={styles.usersTable}>
        <div className={styles.usersHeader}>
          <span style={{ flex: 2 }}>User</span>
          <span style={{ flex: 1 }}>Auth</span>
          <span style={{ flex: 1 }}>Activity</span>
          <span style={{ flex: 1 }}>Joined</span>
          <span style={{ width: 80 }} />
        </div>

        {loading && users.length === 0 ? (
          <div className={styles.empty} style={{ margin: 0, borderRadius: 0, boxShadow: "none" }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty} style={{ margin: 0, borderRadius: 0, boxShadow: "none" }}>No users found.</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className={styles.usersRow}>
              <div style={{ flex: 2, minWidth: 0 }}>
                <div className={styles.userName}>
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt="" className={styles.userAvatar} />
                  ) : (
                    <div className={styles.userAvatarFallback}>{(u.username || u.email)[0].toUpperCase()}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={styles.userPrimary}>{u.username}</span>
                      {u.isBanned && (
                        <span className={styles.userBannedBadge}><Ban size={8} /> Banned</span>
                      )}
                    </div>
                    <div className={styles.userEmail}>{u.email}</div>
                    {u.lastLoginLocation && (
                      <div className={styles.userLocation}>
                        <MapPin size={9} /> {u.lastLoginLocation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.userAuthBadge}>
                  {u.authMethod === "google" ? <Globe size={11} /> : <Mail size={11} />}
                  {u.authMethod === "google" ? "Google" : "Email"}
                </div>
                {u.emailVerified ? (
                  <span className={styles.userVerified}><CheckCircle2 size={10} /> Verified</span>
                ) : (
                  <span className={styles.userUnverified}><XCircle size={10} /> Unverified</span>
                )}
                {u.platform && (
                  <div className={styles.platformBadge} style={{ marginTop: 3 }}>
                    {platformIcon(u.platform)} {platformLabel(u.platform)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.userStat}>{u._count.favorites} fav</div>
                <div className={styles.userStat}>{u._count.debateVotes} votes</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.userDate}>{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ width: 80, display: "flex", justifyContent: "center", gap: 4 }}>
                <button
                  className={styles.userBanBtn}
                  onClick={() => toggleBan(u.id, !!u.isBanned)}
                  disabled={banning === u.id}
                  title={u.isBanned ? "Unban user" : "Ban user"}
                >
                  <Ban size={13} />
                </button>
                <button
                  className={styles.userDeleteBtn}
                  onClick={() => deleteUser(u.id, u.email)}
                  disabled={deleting === u.id}
                  title="Delete user"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className={styles.usersPagination}>
          <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
          <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

/* ── Moderation tab (NEW) ─────────────────────── */
interface FlaggedItem {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  reportedBy: string;
  reportedAt: string;
  status: "pending" | "reviewed" | "dismissed" | "deleted";
  autoHidden: boolean;
  contentPreview?: string;
  contentTitle?: string;
}

function ModerationTab({ adminToken }: { adminToken: string }) {
  const [flags, setFlags] = useState<FlaggedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType, setFilterType] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/admin/moderation?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setFlags(data.flags);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken, filterStatus, filterType]);

  useEffect(() => { load(page); }, [page, load]);

  const updateStatus = async (id: string, status: string) => {
    setActing(id);
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, status: status as FlaggedItem["status"] } : f));
    }
    setActing(null);
  };

  const deleteFlag = async (id: string) => {
    if (!confirm("Delete this flagged content?")) return;
    setActing(id);
    await fetch(`/api/admin/moderation?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    setFlags(prev => prev.filter(f => f.id !== id));
    setTotal(t => t - 1);
    setActing(null);
  };

  const statusBadgeClass = (s: string) => {
    if (s === "pending") return styles.badgeOrange;
    if (s === "reviewed") return styles.badgeBlue;
    if (s === "dismissed") return styles.badgeMuted;
    if (s === "deleted") return styles.badgeRed;
    return styles.badgeMuted;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Moderation</h2>
        <span className={styles.tabDesc}>Review flagged and reported content. {total} total report{total !== 1 ? "s" : ""}.</span>
      </div>

      <div className={styles.modFilters}>
        <select
          className={styles.input}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="deleted">Deleted</option>
        </select>
        <select
          className={styles.input}
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ maxWidth: 180 }}
        >
          <option value="">All types</option>
          <option value="comment">Comment</option>
          <option value="debate">Debate</option>
          <option value="prediction">Prediction</option>
          <option value="profile">Profile</option>
        </select>
        <button className={styles.refreshBtn} onClick={() => load(page)} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && flags.length === 0 ? (
        <div className={styles.empty}>Loading reports...</div>
      ) : flags.length === 0 ? (
        <div className={styles.empty}>No flagged content found.</div>
      ) : (
        <div>
          {flags.map(f => (
            <div key={f.id} className={styles.modCard}>
              <div className={styles.modCardTop}>
                <div className={styles.modCardBody}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className={styles.modCardTitle}>{f.contentTitle || `${f.contentType} report`}</span>
                    <span className={`${styles.badge} ${statusBadgeClass(f.status)}`}>{f.status}</span>
                    {f.autoHidden && (
                      <span className={styles.autoHideBadge}><AlertOctagon size={8} /> Auto-hidden</span>
                    )}
                  </div>
                  {f.contentPreview && (
                    <div className={styles.modCardContent}>{f.contentPreview}</div>
                  )}
                  <div className={styles.modCardMeta}>
                    <span className={styles.modMetaItem}>
                      <AlertTriangle size={11} /> {f.reason}
                    </span>
                    <span className={styles.modMetaItem}>
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>{f.contentType}</span>
                    </span>
                    <span className={styles.modMetaItem}>
                      <Users size={11} /> {f.reportedBy.slice(0, 8)}...
                    </span>
                    <span className={styles.modMetaItem}>
                      <Clock size={11} /> {new Date(f.reportedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className={styles.modCardActions}>
                  {f.status === "pending" && (
                    <>
                      <button
                        className={styles.btnSmall}
                        onClick={() => updateStatus(f.id, "reviewed")}
                        disabled={acting === f.id}
                        title="Mark as reviewed"
                      >
                        <CheckCircle2 size={11} /> Review
                      </button>
                      <button
                        className={styles.btnSmall}
                        onClick={() => updateStatus(f.id, "dismissed")}
                        disabled={acting === f.id}
                        title="Dismiss"
                      >
                        <XCircle size={11} /> Dismiss
                      </button>
                    </>
                  )}
                  <button
                    className={styles.btnDanger}
                    onClick={() => deleteFlag(f.id)}
                    disabled={acting === f.id}
                    title="Delete"
                    style={{ padding: "5px 10px" }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className={styles.usersPagination}>
          <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
          <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

/* ── Notifications tab (NEW) ──────────────────── */
interface NotificationItem {
  id: string;
  title: string;
  body: string;
  targetType: "all" | "ios" | "android" | "web" | "user" | "specific";
  targetUsers?: string[];
  scheduledAt: string;
  sentAt?: string | null;
  status: "scheduled" | "sent" | "cancelled" | "failed";
  createdAt: string;
}

function NotificationsTab({ adminToken }: { adminToken: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [form, setForm] = useState({
    title: "", body: "", target: "all" as string,
    targetUsers: "", scheduledAt: "",
  });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/admin/notifications?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken, filterStatus]);

  useEffect(() => { load(page); }, [page, load]);

  const createNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      setFormErr("Title and body are required.");
      return;
    }
    setCreating(true); setFormErr("");
    const payload: Record<string, unknown> = {
      title: form.title, body: form.body, targetType: form.target,
    };
    if (form.target === "specific" && form.targetUsers) {
      payload.targetUsers = form.targetUsers.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (form.scheduledAt) {
      payload.scheduledAt = new Date(form.scheduledAt).toISOString();
    }
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const notif = await res.json();
      setNotifications(prev => [notif, ...prev]);
      setTotal(t => t + 1);
      setForm({ title: "", body: "", target: "all", targetUsers: "", scheduledAt: "" });
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setFormErr(data.error ?? "Failed to schedule notification.");
    }
    setCreating(false);
  };

  const cancelNotif = async (id: string) => {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "cancelled" } : n));
    }
  };

  const deleteNotif = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    await fetch(`/api/admin/notifications?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
    setTotal(t => t - 1);
  };

  const targetLabel = (t?: string) => {
    if (t === "all") return "All users";
    if (t === "ios") return "iOS";
    if (t === "android") return "Android";
    if (t === "web") return "Web";
    if (t === "user" || t === "specific") return "Specific users";
    return t || "All users";
  };

  const statusBadgeClass = (s: string) => {
    if (s === "scheduled") return styles.badgeBlue;
    if (s === "sent") return styles.badgeGreen;
    if (s === "cancelled") return styles.badgeMuted;
    if (s === "failed") return styles.badgeRed;
    return styles.badgeMuted;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Notifications</h2>
        <span className={styles.tabDesc}>Schedule and manage push notifications to users. {total} total notification{total !== 1 ? "s" : ""}.</span>
      </div>

      {/* Schedule form */}
      <div className={styles.notifForm}>
        <div className={styles.notifFormTitle}><Send size={16} /> Schedule Notification</div>
        <form onSubmit={createNotif} className={styles.notifFormFields}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title</label>
            <input
              className={styles.input}
              placeholder="Notification title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={100}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Body</label>
            <textarea
              className={styles.textarea}
              placeholder="Notification message..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              maxLength={500}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Target</label>
              <select
                className={styles.input}
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              >
                <option value="all">All users</option>
                <option value="ios">iOS only</option>
                <option value="android">Android only</option>
                <option value="web">Web only</option>
                <option value="specific">Specific users</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Schedule</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
              <div className={styles.fieldHint}>Leave empty to send immediately.</div>
            </div>
          </div>
          {form.target === "specific" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>User IDs (comma-separated)</label>
              <input
                className={styles.input}
                placeholder="user-id-1, user-id-2, ..."
                value={form.targetUsers}
                onChange={e => setForm(f => ({ ...f, targetUsers: e.target.value }))}
              />
            </div>
          )}
          {formErr && <div className={styles.loginErr}>{formErr}</div>}
          <button className={styles.btnSave} disabled={creating} type="submit">
            {creating ? <><RefreshCw size={14} className={styles.spin} /> Scheduling...</> : <><Send size={14} /> Schedule notification</>}
          </button>
        </form>
      </div>

      {/* Sent history */}
      <div className={styles.section}>
        <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>History ({total})</span>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className={styles.input}
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              style={{ maxWidth: 150, padding: "4px 8px", fontSize: 11 }}
            >
              <option value="">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <button className={styles.refreshBtn} onClick={() => load(page)} title="Refresh" style={{ width: 28, height: 28 }}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          <div className={styles.empty}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>No notifications found.</div>
        ) : (
          <div className={styles.notifList}>
            {notifications.map(n => (
              <div key={n.id} className={styles.notifCard}>
                <div className={styles.notifCardBody}>
                  <div className={styles.notifCardTitle}>{n.title}</div>
                  <div className={styles.notifCardMsg}>{n.body}</div>
                  <div className={styles.notifCardMeta}>
                    <span className={`${styles.badge} ${statusBadgeClass(n.status)}`}>{n.status}</span>
                    <span className={styles.modMetaItem}>
                      <Target size={10} /> {targetLabel(n.targetType)}
                    </span>
                    <span className={styles.modMetaItem}>
                      <Calendar size={10} /> {new Date(n.scheduledAt).toLocaleString()}
                    </span>
                    {n.sentAt && (
                      <span className={styles.modMetaItem}>
                        <CheckCircle2 size={10} /> Sent {new Date(n.sentAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.notifCardActions}>
                  {n.status === "scheduled" && (
                    <button
                      className={styles.btnSmall}
                      onClick={() => cancelNotif(n.id)}
                      title="Cancel"
                    >
                      <XCircle size={11} /> Cancel
                    </button>
                  )}
                  <button
                    className={styles.userDeleteBtn}
                    onClick={() => deleteNotif(n.id)}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className={styles.usersPagination}>
            <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
            <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Ads tab (NEW) ────────────────────────────── */
interface AdItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  slot: "banner" | "compact" | "card" | "square" | "strip" | "feed" | "match" | "sidebar";
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

function AdsTab({ adminToken }: { adminToken: string }) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterSlot, setFilterSlot] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", linkUrl: "", slot: "sidebar",
    startDate: "", endDate: "",
  });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (filterSlot) params.set("slot", filterSlot);
    if (filterActive) params.set("active", filterActive);
    const res = await fetch(`/api/admin/ads?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setAds(data.ads);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken, filterSlot, filterActive]);

  useEffect(() => { load(page); }, [page, load]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormErr("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormErr("");
  };

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.linkUrl || !form.startDate || !form.endDate) {
      setFormErr("Title, link URL, start date, and end date are required.");
      return;
    }
    setCreating(true); setFormErr("");

    let imageUrl = "";

    // Upload image first if selected
    if (imageFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });
      setUploading(false);
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      } else {
        const err = await uploadRes.json().catch(() => ({})) as { error?: string };
        setFormErr(err.error ?? "Image upload failed");
        setCreating(false);
        return;
      }
    }

    const payload: Record<string, string | boolean> = {
      title: form.title, linkUrl: form.linkUrl,
      slot: form.slot, isActive: true,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    };
    if (imageUrl) payload.imageUrl = imageUrl;
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ad = await res.json();
      setAds(prev => [ad, ...prev]);
      setTotal(t => t + 1);
      setForm({ title: "", linkUrl: "", slot: "sidebar", startDate: "", endDate: "" });
      setImageFile(null);
      setImagePreview("");
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setFormErr(data.error ?? "Failed to create ad.");
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/ads", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, isActive: !current }),
    });
    if (res.ok) {
      setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !current } : a));
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await fetch(`/api/admin/ads?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    setAds(prev => prev.filter(a => a.id !== id));
    setTotal(t => t - 1);
  };

  const slotLabel = (s: string) => {
    if (s === "banner") return "Banner";
    if (s === "compact") return "Compact";
    if (s === "card") return "Card";
    if (s === "square") return "Square";
    if (s === "strip") return "Strip";
    if (s === "feed") return "Feed";
    if (s === "match") return "Match";
    if (s === "sidebar") return "Sidebar";
    return s;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Ads Management</h2>
        <span className={styles.tabDesc}>Create and manage ad placements across the platform. {total} total ad{total !== 1 ? "s" : ""}.</span>
      </div>

      {/* Create form */}
      <div className={styles.adForm}>
        <div className={styles.adFormTitle}><ImagePlus size={16} /> Create New Ad</div>
        <form onSubmit={createAd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title</label>
            <input
              className={styles.input}
              placeholder="Ad title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={100}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ad Image</label>
              <label className={styles.fileUpload}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                <Upload size={14} />
                {imageFile ? imageFile.name : "Choose image..."}
              </label>
              {imagePreview && (
                <div className={styles.imagePreviewWrap}>
                  <img src={imagePreview} alt="Preview" className={styles.imagePreviewThumb} />
                  <button type="button" className={styles.imagePreviewRemove} onClick={() => { setImageFile(null); setImagePreview(""); }}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Link URL</label>
              <input
                className={styles.input}
                placeholder="https://..."
                value={form.linkUrl}
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Slot</label>
              <select
                className={styles.input}
                value={form.slot}
                onChange={e => setForm(f => ({ ...f, slot: e.target.value }))}
              >
                <option value="banner">Banner (728x90) -- Full-width leaderboard</option>
                <option value="compact">Compact (full x 62) -- Thin horizontal bar</option>
                <option value="card">Card (full x 180) -- Inline content card</option>
                <option value="square">Square (300x250) -- Medium rectangle</option>
                <option value="strip">Strip (full x 72) -- Horizontal strip</option>
                <option value="feed">Feed (full x 120) -- In-feed native ad</option>
                <option value="match">Match (full x 72) -- Match detail page</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Start Date</label>
              <input
                className={styles.input}
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>End Date</label>
              <input
                className={styles.input}
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          {formErr && <div className={styles.loginErr}>{formErr}</div>}
          <button className={styles.btnSave} disabled={creating} type="submit">
            {creating ? <><RefreshCw size={14} className={styles.spin} /> {uploading ? "Uploading image..." : "Creating..."}</> : <><ImagePlus size={14} /> Create ad</>}
          </button>
        </form>
      </div>

      {/* Ad list */}
      <div className={styles.section}>
        <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>All Ads ({total})</span>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className={styles.input}
              value={filterSlot}
              onChange={e => { setFilterSlot(e.target.value); setPage(1); }}
              style={{ maxWidth: 120, padding: "4px 8px", fontSize: 11 }}
            >
              <option value="">All slots</option>
              <option value="banner">Banner</option>
              <option value="compact">Compact</option>
              <option value="card">Card</option>
              <option value="square">Square</option>
              <option value="strip">Strip</option>
              <option value="feed">Feed</option>
              <option value="match">Match</option>
              <option value="sidebar">Sidebar</option>
            </select>
            <select
              className={styles.input}
              value={filterActive}
              onChange={e => { setFilterActive(e.target.value); setPage(1); }}
              style={{ maxWidth: 120, padding: "4px 8px", fontSize: 11 }}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button className={styles.refreshBtn} onClick={() => load(page)} title="Refresh" style={{ width: 28, height: 28 }}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {loading && ads.length === 0 ? (
          <div className={styles.empty}>Loading ads...</div>
        ) : ads.length === 0 ? (
          <div className={styles.empty}>No ads found. Create one above.</div>
        ) : (
          <div>
            {ads.map(a => {
              const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : "0.00";
              return (
                <div key={a.id} className={styles.adCard}>
                  <div className={styles.adCardTop}>
                    <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
                      {a.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imageUrl} alt="" className={styles.adPreviewImg} />
                      )}
                      <div className={styles.adCardBody}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className={styles.adCardTitle}>{a.title}</span>
                          <span className={`${styles.badge} ${a.isActive ? styles.badgeGreen : styles.badgeMuted}`}>
                            {a.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className={`${styles.badge} ${styles.badgeAccent}`}>{slotLabel(a.slot)}</span>
                        </div>
                        <div className={styles.adCardMeta}>
                          <span className={styles.modMetaItem}>
                            <Calendar size={10} /> {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.adStatsRow}>
                          <span className={styles.adStat}>Impressions: <span className={styles.adStatValue}>{a.impressions.toLocaleString()}</span></span>
                          <span className={styles.adStat}>Clicks: <span className={styles.adStatValue}>{a.clicks.toLocaleString()}</span></span>
                          <span className={styles.adStat}>CTR: <span className={styles.adStatValue}>{ctr}%</span></span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.adCardActions}>
                      <Toggle on={a.isActive} onChange={() => toggleActive(a.id, a.isActive)} />
                      <button
                        className={styles.userDeleteBtn}
                        onClick={() => deleteAd(a.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className={styles.usersPagination}>
            <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
            <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sponsors tab (NEW) ───────────────────────── */
interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  tier: "gold" | "silver" | "bronze";
  isActive: boolean;
  adCount: number;
  createdAt: string;
}

function SponsorsTab({ adminToken }: { adminToken: string }) {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [form, setForm] = useState({
    name: "", logoUrl: "", website: "", tier: "silver",
  });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    const res = await fetch(`/api/admin/sponsors?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setSponsors(data.sponsors);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { load(page); }, [page, load]);

  const createSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setFormErr("Sponsor name is required.");
      return;
    }
    setCreating(true); setFormErr("");
    const res = await fetch("/api/admin/sponsors", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ ...form, isActive: true }),
    });
    if (res.ok) {
      const sponsor = await res.json();
      setSponsors(prev => [sponsor, ...prev]);
      setTotal(t => t + 1);
      setForm({ name: "", logoUrl: "", website: "", tier: "silver" });
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setFormErr(data.error ?? "Failed to create sponsor.");
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/sponsors", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, isActive: !current }),
    });
    if (res.ok) {
      setSponsors(prev => prev.map(s => s.id === id ? { ...s, isActive: !current } : s));
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm("Delete this sponsor?")) return;
    await fetch(`/api/admin/sponsors?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    setSponsors(prev => prev.filter(s => s.id !== id));
    setTotal(t => t - 1);
  };

  const tierBadgeClass = (t: string) => {
    if (t === "gold") return styles.tierGold;
    if (t === "silver") return styles.tierSilver;
    if (t === "bronze") return styles.tierBronze;
    return styles.tierSilver;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Sponsors</h2>
        <span className={styles.tabDesc}>Manage sponsor partnerships and branding. {total} total sponsor{total !== 1 ? "s" : ""}.</span>
      </div>

      {/* Create form */}
      <div className={styles.sponsorForm}>
        <div className={styles.adFormTitle}><Building2 size={16} /> Add New Sponsor</div>
        <form onSubmit={createSponsor} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input
                className={styles.input}
                placeholder="Sponsor name..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tier</label>
              <select
                className={styles.input}
                value={form.tier}
                onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Logo URL</label>
              <input
                className={styles.input}
                placeholder="https://..."
                value={form.logoUrl}
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input
                className={styles.input}
                placeholder="https://..."
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              />
            </div>
          </div>
          {formErr && <div className={styles.loginErr}>{formErr}</div>}
          <button className={styles.btnSave} disabled={creating} type="submit">
            {creating ? <><RefreshCw size={14} className={styles.spin} /> Creating...</> : <><Building2 size={14} /> Add sponsor</>}
          </button>
        </form>
      </div>

      {/* Sponsors list */}
      <div className={styles.section}>
        <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>All Sponsors ({total})</span>
          <button className={styles.refreshBtn} onClick={() => load(page)} title="Refresh" style={{ width: 28, height: 28 }}>
            <RefreshCw size={12} />
          </button>
        </div>

        {loading && sponsors.length === 0 ? (
          <div className={styles.empty}>Loading sponsors...</div>
        ) : sponsors.length === 0 ? (
          <div className={styles.empty}>No sponsors found. Add one above.</div>
        ) : (
          <div>
            {sponsors.map(s => (
              <div key={s.id} className={styles.sponsorCard}>
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className={styles.sponsorLogo} />
                ) : (
                  <div className={styles.sponsorLogoFallback}><Building2 size={20} /></div>
                )}
                <div className={styles.sponsorBody}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className={styles.sponsorName}>{s.name}</span>
                    <span className={`${styles.tierBadge} ${tierBadgeClass(s.tier)}`}>
                      <Award size={9} /> {s.tier}
                    </span>
                    <span className={`${styles.badge} ${s.isActive ? styles.badgeGreen : styles.badgeMuted}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className={styles.sponsorMeta}>
                    {s.website && (
                      <span className={styles.modMetaItem}>
                        <Globe size={10} /> {s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </span>
                    )}
                    <span className={styles.modMetaItem}>
                      <ImagePlus size={10} /> {s.adCount} ad{s.adCount !== 1 ? "s" : ""}
                    </span>
                    <span className={styles.modMetaItem}>
                      <Calendar size={10} /> Added {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className={styles.sponsorActions}>
                  <Toggle on={s.isActive} onChange={() => toggleActive(s.id, s.isActive)} />
                  <button
                    className={styles.userDeleteBtn}
                    onClick={() => deleteSponsor(s.id)}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className={styles.usersPagination}>
            <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
            <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Debates tab ───────────────────────────────── */
interface RealDebate {
  id: string; question: string; optionA: string; optionB: string;
  sport?: string; votesA: number; votesB: number; isLive: boolean;
  isPinned?: boolean; createdAt: string;
}

function DebatesTab({ adminToken }: { adminToken: string }) {
  const [debates, setDebates] = useState<RealDebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", sport: "" });
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/debates");
    if (res.ok) setDebates(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question || !form.optionA || !form.optionB) {
      setFormErr("Question, Option A, and Option B are required.");
      return;
    }
    setCreating(true); setFormErr("");
    const body: Record<string, string> = { question: form.question, optionA: form.optionA, optionB: form.optionB };
    if (form.sport) body.sport = form.sport.toUpperCase();
    const res = await fetch("/api/debates", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const debate = await res.json();
      setDebates(prev => [debate, ...prev]);
      setForm({ question: "", optionA: "", optionB: "", sport: "" });
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setFormErr(data.error ?? "Failed to create debate.");
    }
    setCreating(false);
  }

  async function toggleLive(id: string, current: boolean) {
    const res = await fetch(`/api/debates/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ isLive: !current }),
    });
    if (res.ok) setDebates(prev => prev.map(d => d.id === id ? { ...d, isLive: !current } : d));
  }

  async function togglePin(id: string, current: boolean) {
    const res = await fetch(`/api/debates/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ isPinned: !current }),
    });
    if (res.ok) setDebates(prev => prev.map(d => d.id === id ? { ...d, isPinned: !current } : d));
  }

  async function deleteDebate(id: string) {
    if (!confirm("Delete this debate?")) return;
    const res = await fetch(`/api/debates/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) setDebates(prev => prev.filter(d => d.id !== id));
  }

  const SPORTS = ["FOOTBALL", "BASKETBALL", "NFL", "TENNIS", "BASEBALL", "F1", "CRICKET", "HOCKEY", "GOLF", "BOXING"];

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Debates</h2>
        <span className={styles.tabDesc}>Create and manage the featured debate polls shown in the mobile app.</span>
      </div>

      {/* Create form */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>New Debate</div>
        <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className={styles.input}
            placeholder="Debate question..."
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            maxLength={200}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className={styles.input}
              placeholder="Option A"
              value={form.optionA}
              onChange={e => setForm(f => ({ ...f, optionA: e.target.value }))}
              maxLength={80}
              style={{ flex: 1 }}
            />
            <input
              className={styles.input}
              placeholder="Option B"
              value={form.optionB}
              onChange={e => setForm(f => ({ ...f, optionB: e.target.value }))}
              maxLength={80}
              style={{ flex: 1 }}
            />
          </div>
          <select
            className={styles.input}
            value={form.sport}
            onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
          >
            <option value="">Any sport (optional)</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {formErr && <div className={styles.loginErr}>{formErr}</div>}
          <button className={styles.btnSave} disabled={creating} type="submit" style={{ marginTop: 4 }}>
            {creating ? <><RefreshCw size={14} className={styles.spin} /> Creating...</> : <><Save size={14} /> Create debate</>}
          </button>
        </form>
      </div>

      {/* Debates list */}
      <div className={styles.section}>
        <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>All debates ({debates.length})</span>
          <button className={styles.refreshBtn} onClick={load} title="Refresh"><RefreshCw size={14} /></button>
        </div>
        {loading ? (
          <div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>
        ) : debates.length === 0 ? (
          <div className={styles.empty}>No debates yet. Create one above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {debates.map(d => (
              <div key={d.id} className={styles.flagRow} style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.flagLabel}>
                      {d.isLive ? <Radio size={13} color="#22c55e" /> : <Radio size={13} color="#ef4444" />}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.question}</span>
                    </div>
                    <div className={styles.flagDesc} style={{ marginTop: 2 }}>
                      <strong>{d.optionA}</strong> | {d.votesA} vs <strong>{d.optionB}</strong> | {d.votesB}
                      {d.sport && <span style={{ marginInlineStart: 8, opacity: 0.6 }}>{d.sport}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    <button
                      onClick={() => togglePin(d.id, !!d.isPinned)}
                      style={{
                        background: d.isPinned ? "var(--accent, #c8ff3d)" : "none",
                        border: d.isPinned ? "none" : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        cursor: "pointer",
                        color: d.isPinned ? "#000" : "rgba(255,255,255,0.5)",
                        padding: "4px 6px",
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600,
                      }}
                      title={d.isPinned ? "Unpin debate" : "Pin debate"}
                    >
                      <Pin size={13} /> {d.isPinned ? "Pinned" : "Pin"}
                    </button>
                    <Toggle on={d.isLive} onChange={() => toggleLive(d.id, d.isLive)} />
                    <button
                      onClick={() => deleteDebate(d.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Feedback tab ──────────────────────────────── */
interface FeedbackItem {
  id: string; userId: string | null; email: string | null;
  category: string; subject: string; message: string;
  rating: number | null; status: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#5dd9ff",
  reviewed: "#ff8c42",
  resolved: "#22c55e",
  dismissed: "#ef4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  ui: "UI / Design",
  performance: "Performance",
  other: "Other",
};

function FeedbackTab({ adminToken }: { adminToken: string }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (p: number, status?: string, category?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    const res = await fetch(`/api/admin/feedback?${params}`, {
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.feedback);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { load(page, filterStatus, filterCat); }, [page, filterStatus, filterCat, load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setItems(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    }
  }

  async function deleteFeedback(id: string) {
    if (!confirm("Delete this feedback?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/feedback?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok) {
      setItems(prev => prev.filter(f => f.id !== id));
      setTotal(t => t - 1);
    }
    setDeleting(null);
  }

  const openCount = items.filter(f => f.status === "open").length;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>User Feedback</h2>
        <span className={styles.tabDesc}>{total} total feedback submission{total !== 1 ? "s" : ""}. Review, respond, and manage user reports.</span>
      </div>

      {/* Filters */}
      <div className={styles.fbFilters}>
        <select
          className={styles.input}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          className={styles.input}
          value={filterCat}
          onChange={e => { setFilterCat(e.target.value); setPage(1); }}
          style={{ maxWidth: 180 }}
        >
          <option value="">All categories</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="ui">UI / Design</option>
          <option value="performance">Performance</option>
          <option value="other">Other</option>
        </select>
        <button className={styles.refreshBtn} onClick={() => load(page, filterStatus, filterCat)} title="Refresh">
          <RefreshCw size={14} />
        </button>
        {openCount > 0 && (
          <span className={styles.fbOpenBadge}>{openCount} open</span>
        )}
      </div>

      {/* Feedback list */}
      {loading && items.length === 0 ? (
        <div className={styles.empty}>Loading feedback...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>No feedback found.</div>
      ) : (
        <div className={styles.fbList}>
          {items.map(f => (
            <div key={f.id} className={`${styles.fbCard} ${expanded === f.id ? styles.fbCardExpanded : ""}`}>
              <div className={styles.fbCardTop} onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                <div className={styles.fbCardLeft}>
                  <span className={styles.fbCatBadge} data-cat={f.category}>
                    {CATEGORY_LABELS[f.category] || f.category}
                  </span>
                  <span className={styles.fbSubject}>{f.subject}</span>
                </div>
                <div className={styles.fbCardRight}>
                  {f.rating && (
                    <span className={styles.fbRating}>
                      <Star size={11} fill="#c8ff3d" stroke="#c8ff3d" />
                      {f.rating}
                    </span>
                  )}
                  <span
                    className={styles.fbStatusBadge}
                    style={{ color: STATUS_COLORS[f.status] || "#888", borderColor: (STATUS_COLORS[f.status] || "#888") + "44" }}
                  >
                    {f.status}
                  </span>
                  <span className={styles.fbDate}>
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                  <ChevronRight size={14} className={`${styles.fbChevron} ${expanded === f.id ? styles.fbChevronOpen : ""}`} />
                </div>
              </div>

              {expanded === f.id && (
                <div className={styles.fbExpanded}>
                  <div className={styles.fbMessage}>{f.message}</div>
                  <div className={styles.fbMeta}>
                    {f.email && (
                      <span className={styles.fbMetaItem}><Mail size={11} /> {f.email}</span>
                    )}
                    {f.userId && (
                      <span className={styles.fbMetaItem}><Users size={11} /> {f.userId.slice(0, 8)}...</span>
                    )}
                    <span className={styles.fbMetaItem}><Clock size={11} /> {new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <div className={styles.fbActions}>
                    <select
                      className={styles.input}
                      value={f.status}
                      onChange={e => updateStatus(f.id, e.target.value)}
                      style={{ maxWidth: 150, padding: "6px 10px", fontSize: 12 }}
                    >
                      <option value="open">Open</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                    <button
                      className={styles.userDeleteBtn}
                      onClick={() => deleteFeedback(f.id)}
                      disabled={deleting === f.id}
                      title="Delete feedback"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className={styles.usersPagination}>
          <button className={styles.btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className={styles.usersPageInfo}>Page {page} of {pages}</span>
          <button className={styles.btnGhost} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

/* ── Challenges tab ───────────────────────────── */
interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  teamA: string;
  teamALogo?: string;
  teamB: string;
  teamBLogo?: string;
  sport: string;
  matchDate: string;
  status: "active" | "closed" | "settled" | "cancelled";
  winnerCount: number;
  maxReferralEntries: number;
  prizeName?: string;
  prizeValue?: string;
  prizeImage?: string;
  prizeDelivery?: string;
  result?: "teamA" | "teamB" | "draw";
  totalVotes: number;
  votesA: number;
  votesB: number;
  totalEntries: number;
  correctPredictions: number;
  referralEntries: number;
  createdAt: string;
}

interface ChallengeWinner {
  rank: number;
  username: string;
  email: string;
  entries: number;
}

interface ChallengeUserEntry {
  userId: string;
  username: string;
  email: string;
  baseEntries: number;
  referralEntries: number;
  totalEntries: number;
}

interface ChallengeAnalytics {
  totalVotes: number;
  totalEntries: number;
  correctPredictions: number;
  referrals: number;
  votesA: number;
  votesB: number;
  baseEntries: number;
  referralEntries: number;
  topReferrers: { username: string; email: string; referrals: number }[];
  userEntries: ChallengeUserEntry[];
}

function ChallengesTab({ adminToken }: { adminToken: string }) {
  type SubView = "list" | "create" | "edit" | "settle" | "draw" | "analytics";
  const [view, setView] = useState<SubView>("list");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [formErr, setFormErr] = useState("");
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", teamAName: "", teamALogo: "",
    teamBName: "", teamBLogo: "", sport: "football",
    matchDate: "", winnerCount: "10", maxReferralEntries: "20",
    prizeName: "", prizeValue: "", prizeDeliveryMethod: "",
  });
  const [challengeImage, setChallengeImage] = useState<File | null>(null);
  const [challengeImagePreview, setChallengeImagePreview] = useState("");
  const [prizeImage, setPrizeImage] = useState<File | null>(null);
  const [prizeImagePreview, setPrizeImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Settle state
  const [settleResult, setSettleResult] = useState<"teamA" | "teamB" | "draw">("teamA");
  const [settling, setSettling] = useState(false);

  // Draw state
  const [winners, setWinners] = useState<ChallengeWinner[]>([]);
  const [drawing, setDrawing] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/challenges", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(Array.isArray(data) ? data : data.challenges || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { load(); }, [load]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "x-admin-token": adminToken },
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleChallengeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormErr("Image must be under 5MB"); return; }
    setChallengeImage(file);
    setChallengeImagePreview(URL.createObjectURL(file));
    setFormErr("");
  };

  const handlePrizeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormErr("Image must be under 5MB"); return; }
    setPrizeImage(file);
    setPrizeImagePreview(URL.createObjectURL(file));
    setFormErr("");
  };

  const resetForm = () => {
    setForm({
      title: "", description: "", teamAName: "", teamALogo: "",
      teamBName: "", teamBLogo: "", sport: "football",
      matchDate: "", winnerCount: "10", maxReferralEntries: "20",
      prizeName: "", prizeValue: "", prizeDeliveryMethod: "",
    });
    setChallengeImage(null);
    setChallengeImagePreview("");
    setPrizeImage(null);
    setPrizeImagePreview("");
    setFormErr("");
  };

  const openEdit = (c: Challenge) => {
    setSelectedChallenge(c);
    setForm({
      title: c.title, description: c.description ?? "",
      teamAName: c.teamA, teamALogo: c.teamALogo ?? "",
      teamBName: c.teamB, teamBLogo: c.teamBLogo ?? "",
      sport: c.sport, matchDate: c.matchDate ? c.matchDate.slice(0, 16) : "",
      winnerCount: String(c.winnerCount ?? 10),
      maxReferralEntries: String(c.maxReferralEntries ?? 20),
      prizeName: c.prizeName ?? "", prizeValue: c.prizeValue ?? "",
      prizeDeliveryMethod: c.prizeDelivery ?? "",
    });
    setChallengeImagePreview(c.imageUrl ?? "");
    setPrizeImagePreview(c.prizeImage ?? "");
    setView("edit");
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.teamAName || !form.teamBName || !form.matchDate) {
      setFormErr("Title, both team names, and match date are required.");
      return;
    }
    setCreating(true); setFormErr("");
    setUploading(true);

    let imageUrl = challengeImagePreview;
    let prizeImgUrl = prizeImagePreview;

    if (challengeImage) {
      const url = await uploadFile(challengeImage);
      if (url) imageUrl = url; else { setFormErr("Challenge image upload failed"); setCreating(false); setUploading(false); return; }
    }
    if (prizeImage) {
      const url = await uploadFile(prizeImage);
      if (url) prizeImgUrl = url; else { setFormErr("Prize image upload failed"); setCreating(false); setUploading(false); return; }
    }
    setUploading(false);

    const payload = {
      title: form.title,
      description: form.description,
      teamA: form.teamAName,
      teamB: form.teamBName,
      teamALogo: form.teamALogo,
      teamBLogo: form.teamBLogo,
      sport: form.sport,
      matchDate: new Date(form.matchDate).toISOString(),
      winnerCount: parseInt(form.winnerCount) || 10,
      maxReferralEntries: parseInt(form.maxReferralEntries) || 20,
      prizeName: form.prizeName,
      prizeValue: form.prizeValue,
      prizeDelivery: form.prizeDeliveryMethod,
      imageUrl,
      prizeImage: prizeImgUrl,
      ...(view === "edit" && selectedChallenge ? { id: selectedChallenge.id } : {}),
    };

    const res = await fetch("/api/admin/challenges", {
      method: view === "edit" ? "PATCH" : "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await load();
      resetForm();
      setSelectedChallenge(null);
      setView("list");
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string; debug?: string };
      setFormErr(data.debug || data.error || "Failed to save challenge.");
    }
    setCreating(false);
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge? This cannot be undone.")) return;
    await fetch("/api/admin/challenges", {
      method: "DELETE",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ id }),
    });
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  const closeVoting = async (id: string) => {
    if (!confirm("Close voting for this challenge?")) return;
    const res = await fetch("/api/admin/challenges", {
      method: "PATCH",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ id, status: "closed" }),
    });
    if (res.ok) await load();
  };

  const openSettle = (c: Challenge) => {
    setSelectedChallenge(c);
    setSettleResult("teamA");
    setView("settle");
  };

  const settleChallenge = async () => {
    if (!selectedChallenge) return;
    setSettling(true);
    const res = await fetch("/api/admin/challenges/settle", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ challengeId: selectedChallenge.id, result: settleResult }),
    });
    if (res.ok) {
      await load();
      setView("list");
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setFormErr(data.error ?? "Failed to settle challenge.");
    }
    setSettling(false);
  };

  const openDraw = (c: Challenge) => {
    setSelectedChallenge(c);
    setWinners([]);
    setView("draw");
  };

  const drawWinners = async () => {
    if (!selectedChallenge) return;
    setDrawing(true);
    const res = await fetch("/api/admin/challenges/draw", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ challengeId: selectedChallenge.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setWinners(data.winners ?? []);
    }
    setDrawing(false);
  };

  const exportCSV = () => {
    if (winners.length === 0) return;
    const header = "Rank,Username,Email,Entries\n";
    const rows = winners.map(w => `${w.rank},${w.username},${w.email},${w.entries}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challenge-winners-${selectedChallenge?.id ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAnalytics = async (c: Challenge) => {
    setSelectedChallenge(c);
    setAnalytics(null);
    setView("analytics");
    const res = await fetch(`/api/admin/challenges/analytics?challengeId=${c.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const raw = await res.json();
      const ch = raw.challenge;
      setAnalytics({
        totalVotes: raw.global?.totalVotes ?? 0,
        totalEntries: ch?.entriesBreakdown?.totalEntries ?? 0,
        correctPredictions: 0,
        referrals: raw.global?.totalReferrals ?? 0,
        votesA: ch?.votesByTeam?.teamA ?? 0,
        votesB: ch?.votesByTeam?.teamB ?? 0,
        baseEntries: ch?.entriesBreakdown?.baseEntries ?? 0,
        referralEntries: ch?.entriesBreakdown?.referralEntries ?? 0,
        topReferrers: (ch?.topReferrers ?? []).map((r: { username: string; referralCount: number }) => ({
          username: r.username ?? "Unknown",
          email: "",
          referrals: r.referralCount ?? 0,
        })),
        userEntries: (ch?.userEntries ?? []).map((u: ChallengeUserEntry) => ({
          userId: u.userId,
          username: u.username ?? "Unknown",
          email: u.email ?? "",
          baseEntries: u.baseEntries ?? 0,
          referralEntries: u.referralEntries ?? 0,
          totalEntries: u.totalEntries ?? 0,
        })),
      });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: styles.chBadgeActive,
      closed: styles.chBadgeClosed,
      settled: styles.chBadgeSettled,
      cancelled: styles.chBadgeCancelled,
    };
    return `${styles.badge} ${map[status] ?? styles.badgeMuted}`;
  };

  const SPORTS = ["football", "basketball", "nfl", "tennis", "baseball", "f1", "cricket", "hockey"];

  // ── List view ──
  if (view === "list") {
    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Challenges</h2>
          <span className={styles.tabDesc}>Create and manage prediction challenges with prizes.</span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button className={styles.btnSave} onClick={() => { resetForm(); setSelectedChallenge(null); setView("create"); }}>
            <Trophy size={14} /> Create Challenge
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}><RefreshCw size={16} className={styles.spin} /> Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className={styles.empty}>No challenges yet. Create your first challenge above.</div>
        ) : (
          <div className={styles.chTable}>
            <div className={styles.chTableHeader}>
              <span style={{ flex: 2 }}>Title</span>
              <span style={{ flex: 2 }}>Teams</span>
              <span style={{ flex: 1 }}>Match Date</span>
              <span style={{ flex: 1 }}>Status</span>
              <span style={{ flex: 1, textAlign: "center" }}>Votes</span>
              <span style={{ flex: 1, textAlign: "center" }}>Entries</span>
              <span style={{ flex: 2, textAlign: "right" }}>Actions</span>
            </div>
            {challenges.map(c => (
              <div key={c.id} className={styles.chTableRow}>
                <span style={{ flex: 2, fontWeight: 700, color: "var(--a-ink)" }}>{c.title}</span>
                <span style={{ flex: 2, fontSize: 12, color: "var(--a-ink-dim)" }}>
                  {c.teamA} vs {c.teamB}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: "var(--a-ink-mute)" }}>
                  {new Date(c.matchDate).toLocaleDateString()}
                </span>
                <span style={{ flex: 1 }}>
                  <span className={statusBadge(c.status)}>{c.status}</span>
                </span>
                <span style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>{c.totalVotes ?? 0}</span>
                <span style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>{c.totalEntries ?? 0}</span>
                <span style={{ flex: 2, display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button className={styles.btnSmall} onClick={() => openEdit(c)}>Edit</button>
                  {c.status === "active" && (
                    <button className={styles.btnSmall} onClick={() => closeVoting(c.id)}>Close Voting</button>
                  )}
                  {(c.status === "closed") && (
                    <button className={styles.btnSmall} onClick={() => openSettle(c)}>Set Result</button>
                  )}
                  {c.status === "settled" && (
                    <button className={styles.btnSmall} onClick={() => openDraw(c)}>Draw Winners</button>
                  )}
                  <button className={styles.btnSmall} onClick={() => openAnalytics(c)} title="Analytics">
                    <BarChart3 size={12} />
                  </button>
                  <button className={styles.btnDanger} onClick={() => deleteChallenge(c.id)} style={{ padding: "4px 8px" }}>
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Create / Edit view ──
  if (view === "create" || view === "edit") {
    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>{view === "edit" ? "Edit Challenge" : "Create Challenge"}</h2>
          <span className={styles.tabDesc}>
            {view === "edit" ? "Update challenge details." : "Set up a new prediction challenge."}
          </span>
        </div>

        <button className={styles.btnGhost} onClick={() => { resetForm(); setView("list"); }} style={{ marginBottom: 16 }}>
          Back to list
        </button>

        <form onSubmit={submitForm} className={styles.chForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title</label>
            <input className={styles.input} placeholder="Challenge title..." value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Describe the challenge..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Challenge Image</label>
            <label className={styles.fileUpload}>
              <Upload size={16} /> {challengeImage ? challengeImage.name : "Choose image..."}
              <input type="file" accept="image/*" onChange={handleChallengeImageSelect} hidden />
            </label>
            {challengeImagePreview && (
              <div className={styles.imagePreviewWrap}>
                <img src={challengeImagePreview} alt="Preview" className={styles.imagePreviewThumb} />
                <button type="button" className={styles.imagePreviewRemove}
                  onClick={() => { setChallengeImage(null); setChallengeImagePreview(""); }}>
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Team A Name</label>
              <input className={styles.input} placeholder="Team A" value={form.teamAName}
                onChange={e => setForm(f => ({ ...f, teamAName: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Team A Logo URL</label>
              <input className={styles.input} placeholder="https://..." value={form.teamALogo}
                onChange={e => setForm(f => ({ ...f, teamALogo: e.target.value }))} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Team B Name</label>
              <input className={styles.input} placeholder="Team B" value={form.teamBName}
                onChange={e => setForm(f => ({ ...f, teamBName: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Team B Logo URL</label>
              <input className={styles.input} placeholder="https://..." value={form.teamBLogo}
                onChange={e => setForm(f => ({ ...f, teamBLogo: e.target.value }))} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sport</label>
              <select className={styles.select} value={form.sport}
                onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}>
                {SPORTS.map(s => (
                  <option key={s} value={s}>{SPORT_META[s]?.label ?? s}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Match Date & Time (Voting Deadline)</label>
              <input className={styles.input} type="datetime-local" value={form.matchDate}
                onChange={e => setForm(f => ({ ...f, matchDate: e.target.value }))} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Winner Count</label>
              <input className={styles.input} type="number" min="1" value={form.winnerCount}
                onChange={e => setForm(f => ({ ...f, winnerCount: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Max Referral Entries Per User</label>
              <input className={styles.input} type="number" min="0" value={form.maxReferralEntries}
                onChange={e => setForm(f => ({ ...f, maxReferralEntries: e.target.value }))} />
            </div>
          </div>

          <div className={styles.chPrivateSection}>
            <div className={styles.chPrivateLabel}><Shield size={12} /> Private (Admin Only)</div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prize Name</label>
              <input className={styles.input} placeholder="e.g. $50 Amazon Gift Card" value={form.prizeName}
                onChange={e => setForm(f => ({ ...f, prizeName: e.target.value }))} />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Prize Value</label>
                <input className={styles.input} placeholder="e.g. $50" value={form.prizeValue}
                  onChange={e => setForm(f => ({ ...f, prizeValue: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Prize Delivery Method</label>
                <input className={styles.input} placeholder="e.g. Email, DM, In-app" value={form.prizeDeliveryMethod}
                  onChange={e => setForm(f => ({ ...f, prizeDeliveryMethod: e.target.value }))} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prize Image</label>
              <label className={styles.fileUpload}>
                <Gift size={16} /> {prizeImage ? prizeImage.name : "Choose prize image..."}
                <input type="file" accept="image/*" onChange={handlePrizeImageSelect} hidden />
              </label>
              {prizeImagePreview && (
                <div className={styles.imagePreviewWrap}>
                  <img src={prizeImagePreview} alt="Prize preview" className={styles.imagePreviewThumb} />
                  <button type="button" className={styles.imagePreviewRemove}
                    onClick={() => { setPrizeImage(null); setPrizeImagePreview(""); }}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {formErr && <div className={styles.dangerBanner}><AlertTriangle size={14} /> {formErr}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button className={styles.btnSave} type="submit" disabled={creating || uploading}>
              {uploading ? "Uploading..." : creating ? "Saving..." : view === "edit" ? "Update Challenge" : "Create Challenge"}
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => { resetForm(); setView("list"); }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Settle view ──
  if (view === "settle" && selectedChallenge) {
    const sc = selectedChallenge;
    const totalVotes = (sc.votesA ?? 0) + (sc.votesB ?? 0);
    const correctCount = settleResult === "teamA" ? (sc.votesA ?? 0) : settleResult === "teamB" ? (sc.votesB ?? 0) : 0;

    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Settle Challenge</h2>
          <span className={styles.tabDesc}>Set the result for &ldquo;{sc.title}&rdquo;</span>
        </div>

        <button className={styles.btnGhost} onClick={() => setView("list")} style={{ marginBottom: 16 }}>
          Back to list
        </button>

        <div className={styles.chSettleCard}>
          <div className={styles.chSettleTeams}>
            <div className={styles.chSettleTeam}>
              {sc.teamALogo && <img src={sc.teamALogo} alt={sc.teamA} className={styles.chTeamLogo} />}
              <span className={styles.chTeamName}>{sc.teamA}</span>
              <span className={styles.chTeamVotes}>{sc.votesA ?? 0} votes</span>
            </div>
            <span className={styles.chSettleVs}>VS</span>
            <div className={styles.chSettleTeam}>
              {sc.teamBLogo && <img src={sc.teamBLogo} alt={sc.teamB} className={styles.chTeamLogo} />}
              <span className={styles.chTeamName}>{sc.teamB}</span>
              <span className={styles.chTeamVotes}>{sc.votesB ?? 0} votes</span>
            </div>
          </div>

          <div className={styles.chSettleOptions}>
            <label className={`${styles.chRadioLabel} ${settleResult === "teamA" ? styles.chRadioActive : ""}`}>
              <input type="radio" name="result" value="teamA" checked={settleResult === "teamA"}
                onChange={() => setSettleResult("teamA")} />
              <Crown size={14} /> {sc.teamA} Won
            </label>
            <label className={`${styles.chRadioLabel} ${settleResult === "teamB" ? styles.chRadioActive : ""}`}>
              <input type="radio" name="result" value="teamB" checked={settleResult === "teamB"}
                onChange={() => setSettleResult("teamB")} />
              <Crown size={14} /> {sc.teamB} Won
            </label>
            <label className={`${styles.chRadioLabel} ${settleResult === "draw" ? styles.chRadioActive : ""}`}>
              <input type="radio" name="result" value="draw" checked={settleResult === "draw"}
                onChange={() => setSettleResult("draw")} />
              <Medal size={14} /> Draw
            </label>
          </div>

          <div className={styles.chSettlePreview}>
            {settleResult === "draw"
              ? `All ${totalVotes} voters will receive base entries.`
              : `${correctCount} user${correctCount !== 1 ? "s" : ""} predicted correctly out of ${totalVotes} total vote${totalVotes !== 1 ? "s" : ""}`
            }
          </div>

          {formErr && <div className={styles.dangerBanner}><AlertTriangle size={14} /> {formErr}</div>}

          <button className={styles.btnSave} onClick={settleChallenge} disabled={settling}>
            {settling ? "Settling..." : "Settle & Calculate Entries"}
          </button>
        </div>
      </div>
    );
  }

  // ── Draw Winners view ──
  if (view === "draw" && selectedChallenge) {
    const dc = selectedChallenge;

    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Draw Winners</h2>
          <span className={styles.tabDesc}>Draw winners for &ldquo;{dc.title}&rdquo;</span>
        </div>

        <button className={styles.btnGhost} onClick={() => setView("list")} style={{ marginBottom: 16 }}>
          Back to list
        </button>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button className={styles.btnSave} onClick={drawWinners} disabled={drawing}>
            <Trophy size={14} /> {drawing ? "Drawing..." : `Draw ${dc.winnerCount} Winner${dc.winnerCount !== 1 ? "s" : ""}`}
          </button>
        </div>

        {winners.length > 0 && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button className={styles.btnGhost} onClick={exportCSV}>
                <Download size={14} /> Export Winners (CSV)
              </button>
              <button className={styles.btnGhost} onClick={() => alert("Winner notifications will be sent via the notification system.")}>
                <Send size={14} /> Send Winner Notification
              </button>
            </div>

            <div className={styles.chTable}>
              <div className={styles.chTableHeader}>
                <span style={{ width: 50, textAlign: "center" }}>Rank</span>
                <span style={{ flex: 2 }}>Username</span>
                <span style={{ flex: 2 }}>Email</span>
                <span style={{ flex: 1, textAlign: "center" }}>Entries</span>
              </div>
              {winners.map(w => (
                <div key={w.rank} className={styles.chTableRow}>
                  <span style={{ width: 50, textAlign: "center", fontWeight: 700 }}>
                    {w.rank <= 3 ? <Crown size={14} style={{ color: w.rank === 1 ? "#fbbf24" : w.rank === 2 ? "#94a3b8" : "#d97706" }} /> : `#${w.rank}`}
                  </span>
                  <span style={{ flex: 2, fontWeight: 600, color: "var(--a-ink)" }}>{w.username}</span>
                  <span style={{ flex: 2, fontSize: 12, color: "var(--a-ink-mute)" }}>{w.email}</span>
                  <span style={{ flex: 1, textAlign: "center", fontWeight: 600, color: "var(--a-accent)" }}>{w.entries}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!drawing && winners.length === 0 && (
          <div className={styles.empty}>Click &ldquo;Draw Winners&rdquo; to randomly select winners based on entries.</div>
        )}
      </div>
    );
  }

  // ── Analytics view ──
  if (view === "analytics" && selectedChallenge) {
    const ac = selectedChallenge;
    const a = analytics;
    const totalVotes = a ? a.votesA + a.votesB : 0;
    const pctA = totalVotes > 0 ? Math.round((a!.votesA / totalVotes) * 100) : 50;
    const pctB = 100 - pctA;

    return (
      <div className={styles.tabContent}>
        <div className={styles.tabHeader}>
          <h2>Challenge Analytics</h2>
          <span className={styles.tabDesc}>Insights for &ldquo;{ac.title}&rdquo;</span>
        </div>

        <button className={styles.btnGhost} onClick={() => setView("list")} style={{ marginBottom: 16 }}>
          Back to list
        </button>

        {!a ? (
          <div className={styles.empty}><RefreshCw size={16} className={styles.spin} /> Loading analytics...</div>
        ) : (
          <>
            <div className={styles.statsRow}>
              <StatCard icon={<Users size={20} />} label="Total Votes" value={a.totalVotes} color="#c8ff3d" />
              <StatCard icon={<Target size={20} />} label="Total Entries" value={a.totalEntries} color="#5dd9ff" />
              <StatCard icon={<Award size={20} />} label="Correct Predictions" value={a.correctPredictions} color="#22c55e" />
              <StatCard icon={<Send size={20} />} label="Referrals" value={a.referrals} color="#ff8c42" />
            </div>

            {/* Vote split bar */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Vote Split</div>
              <div className={styles.chVoteSplitCard}>
                <div className={styles.chVoteSplitLabels}>
                  <span>{ac.teamA} ({pctA}%)</span>
                  <span>{ac.teamB} ({pctB}%)</span>
                </div>
                <div className={styles.chVoteSplitTrack}>
                  <div className={styles.chVoteSplitA} style={{ width: `${pctA}%` }} />
                  <div className={styles.chVoteSplitB} style={{ width: `${pctB}%` }} />
                </div>
                <div className={styles.chVoteSplitCounts}>
                  <span>{a.votesA} votes</span>
                  <span>{a.votesB} votes</span>
                </div>
              </div>
            </div>

            {/* Entry breakdown */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Entry Breakdown</div>
              <div className={styles.chEntryBreakdown}>
                <div className={styles.hBarRow}>
                  <span className={styles.hBarLabel}>Base Entries</span>
                  <div className={styles.hBarTrack}>
                    <div className={styles.hBarFill} style={{
                      width: `${a.totalEntries > 0 ? Math.max(Math.round((a.baseEntries / a.totalEntries) * 100), 2) : 0}%`,
                      background: "var(--a-accent)",
                    }}>
                      {a.totalEntries > 0 && Math.round((a.baseEntries / a.totalEntries) * 100) > 15 && (
                        <span className={styles.hBarPercent}>{Math.round((a.baseEntries / a.totalEntries) * 100)}%</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.hBarCount}>{a.baseEntries}</span>
                </div>
                <div className={styles.hBarRow}>
                  <span className={styles.hBarLabel}>Referral Entries</span>
                  <div className={styles.hBarTrack}>
                    <div className={styles.hBarFill} style={{
                      width: `${a.totalEntries > 0 ? Math.max(Math.round((a.referralEntries / a.totalEntries) * 100), 2) : 0}%`,
                      background: "#ff8c42",
                    }}>
                      {a.totalEntries > 0 && Math.round((a.referralEntries / a.totalEntries) * 100) > 15 && (
                        <span className={styles.hBarPercent}>{Math.round((a.referralEntries / a.totalEntries) * 100)}%</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.hBarCount}>{a.referralEntries}</span>
                </div>
              </div>
            </div>

            {/* Top referrers */}
            {a.topReferrers && a.topReferrers.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Top Referrers</div>
                <div className={styles.chTable}>
                  <div className={styles.chTableHeader}>
                    <span style={{ width: 40, textAlign: "center" }}>#</span>
                    <span style={{ flex: 2 }}>Username</span>
                    <span style={{ flex: 2 }}>Email</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Referrals</span>
                  </div>
                  {a.topReferrers.map((r, i) => (
                    <div key={i} className={styles.chTableRow}>
                      <span style={{ width: 40, textAlign: "center", fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ flex: 2, fontWeight: 600, color: "var(--a-ink)" }}>{r.username}</span>
                      <span style={{ flex: 2, fontSize: 12, color: "var(--a-ink-mute)" }}>{r.email}</span>
                      <span style={{ flex: 1, textAlign: "center", fontWeight: 600, color: "var(--a-accent)" }}>{r.referrals}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-user entries breakdown */}
            {a.userEntries && a.userEntries.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>User Entries Breakdown</div>
                <div style={{ fontSize: 12, color: "var(--a-ink-mute)", marginBottom: 10 }}>
                  Users with more entries have a higher chance of winning the mystery prize.
                </div>
                <div className={styles.chTable}>
                  <div className={styles.chTableHeader}>
                    <span style={{ width: 40, textAlign: "center" }}>#</span>
                    <span style={{ flex: 2 }}>Username</span>
                    <span style={{ flex: 2 }}>Email</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Base</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Referral</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Total</span>
                  </div>
                  {a.userEntries.map((u, i) => (
                    <div key={u.userId} className={styles.chTableRow}>
                      <span style={{ width: 40, textAlign: "center", fontWeight: 700 }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 2, fontWeight: 600, color: "var(--a-ink)" }}>{u.username}</span>
                      <span style={{ flex: 2, fontSize: 12, color: "var(--a-ink-mute)" }}>{u.email}</span>
                      <span style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>{u.baseEntries}</span>
                      <span style={{ flex: 1, textAlign: "center", fontWeight: 600, color: "#ff8c42" }}>{u.referralEntries}</span>
                      <span style={{ flex: 1, textAlign: "center", fontWeight: 700, color: "var(--a-accent)" }}>{u.totalEntries}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className={styles.tabContent}>
      <div className={styles.empty}>Unknown view. <button className={styles.btnGhost} onClick={() => setView("list")}>Back to list</button></div>
    </div>
  );
}

/* ── Redeem Codes tab ─────────────────────────── */
interface RedeemCode {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  totalEntries: number;
  createdAt: string;
  username: string | null;
  email: string | null;
  avatar: string | null;
  isPromo: boolean;
  label: string | null;
  disabled: boolean;
  maxUses: number | null;
}

interface Redemption {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  status: string;
  createdAt: string;
  referrerUsername: string | null;
  referredUsername: string | null;
  referredEmail: string | null;
}

function RedeemCodesTab({ adminToken, flags, onSave }: { adminToken: string; flags: AdminFlags; onSave: (u: Partial<AdminFlags>, action: string) => Promise<void> }) {
  const redeemEnabled = flags.features.redeemCodes ?? true;
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [error, setError] = useState("");
  const [selectedCode, setSelectedCode] = useState<RedeemCode | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/admin/redeem-codes?${params}`, {
        headers: { "x-admin-token": adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Failed to fetch codes", e);
    }
    setLoading(false);
  }, [adminToken, search, filterType]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  async function toggleRedeemSystem() {
    const next = { ...flags.features, redeemCodes: !redeemEnabled };
    await onSave({ features: next }, `${!redeemEnabled ? "Enabled" : "Disabled"} redeem code system`);
  }

  async function createCode() {
    if (!newCode.trim()) { setError("Code is required"); return; }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/redeem-codes", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          code: newCode.trim(),
          label: newLabel.trim() || undefined,
          maxUses: newMaxUses ? parseInt(newMaxUses) : undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewCode("");
        setNewLabel("");
        setNewMaxUses("");
        fetchCodes();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create code");
      }
    } catch {
      setError("Network error");
    }
    setCreating(false);
  }

  async function toggleCode(code: RedeemCode) {
    try {
      await fetch("/api/admin/redeem-codes", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ id: code.id, disabled: !code.disabled }),
      });
      fetchCodes();
    } catch (e) {
      console.error("Failed to toggle code", e);
    }
  }

  async function deleteCode(code: RedeemCode) {
    if (!confirm(`Delete code "${code.code}"? This will also remove all its redemptions.`)) return;
    try {
      await fetch(`/api/admin/redeem-codes?id=${code.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (selectedCode?.id === code.id) setSelectedCode(null);
      fetchCodes();
    } catch (e) {
      console.error("Failed to delete code", e);
    }
  }

  async function viewRedemptions(code: RedeemCode) {
    setSelectedCode(code);
    setLoadingRedemptions(true);
    try {
      const res = await fetch(`/api/admin/redeem-codes?codeId=${code.id}`, {
        headers: { "x-admin-token": adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch (e) {
      console.error("Failed to fetch redemptions", e);
    }
    setLoadingRedemptions(false);
  }

  async function resetAllData() {
    if (!confirm("Reset ALL referral data? This will zero out all counters and delete all redemption records. This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/redeem-codes", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ action: "reset-all" }),
      });
      if (res.ok) {
        fetchCodes();
        setSelectedCode(null);
      }
    } catch (e) {
      console.error("Failed to reset data", e);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div>
          <h2>Redeem Codes</h2>
          <p className={styles.tabDesc}>Control the referral & redeem code system</p>
        </div>
      </div>

      {/* ── Master Controls ─────────────────────────────── */}
      <div className={styles.card} style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>System Controls</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Master toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: redeemEnabled ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${redeemEnabled ? "#22c55e33" : "#ef444433"}`, borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                Redeem Code System
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {redeemEnabled ? "Users can view and redeem codes across the app" : "Redeem code input and referral features are hidden from all users"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: redeemEnabled ? "#22c55e" : "#ef4444" }}>{redeemEnabled ? "ON" : "OFF"}</span>
              <Toggle on={redeemEnabled} onChange={toggleRedeemSystem} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className={styles.btnSave} onClick={() => { setShowCreate(!showCreate); setError(""); }}>
              <Gift size={14} /> Create Promo Code
            </button>
            <button className={styles.btnGhost} onClick={resetAllData} style={{ color: "#ef4444", borderColor: "#ef444444" }}>
              <Trash2 size={14} /> Reset All Data
            </button>
            <button className={styles.btnGhost} onClick={fetchCodes}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Create promo code form */}
      {showCreate && (
        <div className={styles.card} style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#fff" }}>New Promo Code</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Code *</label>
              <input
                className={styles.input}
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER2026"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Label (optional)</label>
              <input
                className={styles.input}
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Summer Campaign"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Max Uses (optional)</label>
              <input
                className={styles.input}
                value={newMaxUses}
                onChange={e => setNewMaxUses(e.target.value.replace(/\D/g, ""))}
                placeholder="Unlimited"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          {error && <p style={{ color: "#ff4444", fontSize: 13, margin: "0 0 8px" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.btnSave} onClick={createCode} disabled={creating}>
              {creating ? "Creating..." : "Create Code"}
            </button>
            <button className={styles.btnGhost} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Codes", value: total, color: "#fff" },
          { label: "Referral Codes", value: codes.filter(c => !c.isPromo).length, color: "#6fcf6f" },
          { label: "Promo Codes", value: codes.filter(c => c.isPromo).length, color: "#b088f9" },
          { label: "Total Redemptions", value: codes.reduce((s, c) => s + c.totalReferrals, 0), color: "var(--a-accent)" },
        ].map(s => (
          <div key={s.label} className={styles.card} style={{ padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "var(--f-mono)" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
          <input
            className={styles.input}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code, username, or label..."
            style={{ width: "100%", paddingLeft: 32 }}
          />
        </div>
        <select
          className={styles.input}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ width: 140 }}
        >
          <option value="all">All Codes</option>
          <option value="referral">Referral</option>
          <option value="promo">Promo</option>
        </select>
      </div>

      {/* Codes table */}
      {loading ? (
        <div className={styles.empty}>Loading codes...</div>
      ) : codes.length === 0 ? (
        <div className={styles.empty}>No codes found.</div>
      ) : (
        <div className={styles.card} style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222", color: "#888", textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>Code</th>
                <th style={{ padding: "10px 12px" }}>Type</th>
                <th style={{ padding: "10px 12px" }}>User / Label</th>
                <th style={{ padding: "10px 12px" }}>Referrals</th>
                <th style={{ padding: "10px 12px" }}>Entries</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}>Created</th>
                <th style={{ padding: "10px 12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(code => (
                <tr key={code.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "var(--f-mono)", color: "var(--a-accent)", fontWeight: 600 }}>
                    {code.code}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: code.isPromo ? "#2d1f5e" : "#1a2e1a",
                      color: code.isPromo ? "#b088f9" : "#6fcf6f",
                    }}>
                      {code.isPromo ? "PROMO" : "REFERRAL"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#ccc" }}>
                    {code.isPromo ? (code.label || "—") : (code.username || code.email || code.userId)}
                    {code.maxUses && (
                      <span style={{ color: "#666", fontSize: 11, marginLeft: 6 }}>
                        (max {code.maxUses} uses)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 600 }}>
                    {code.totalReferrals}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#888" }}>
                    {code.totalEntries}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-block",
                      width: 8, height: 8,
                      borderRadius: "50%",
                      background: code.disabled ? "#ff4444" : "#4caf50",
                      marginRight: 6,
                    }} />
                    {code.disabled ? "Disabled" : "Active"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#666", fontSize: 12 }}>
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className={styles.btnGhost}
                        onClick={() => viewRedemptions(code)}
                        title="View redemptions"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={() => toggleCode(code)}
                        title={code.disabled ? "Enable" : "Disable"}
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        {code.disabled ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={() => deleteCode(code)}
                        title="Delete"
                        style={{ padding: "4px 8px", fontSize: 11, color: "#ff4444" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Redemption history drawer */}
      {selectedCode && (
        <div className={styles.card} style={{ marginTop: 20, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, color: "#fff" }}>
                Redemptions for <span style={{ color: "var(--a-accent)", fontFamily: "var(--f-mono)" }}>{selectedCode.code}</span>
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                {selectedCode.totalReferrals} total redemptions
              </p>
            </div>
            <button className={styles.btnGhost} onClick={() => setSelectedCode(null)} style={{ padding: "4px 8px" }}>
              <X size={14} />
            </button>
          </div>

          {loadingRedemptions ? (
            <div className={styles.empty}>Loading...</div>
          ) : redemptions.length === 0 ? (
            <div className={styles.empty}>No redemptions yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#888", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Referred User</th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                  <th style={{ padding: "8px 12px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "8px 12px", color: "#ccc" }}>{r.referredUsername || r.referredUserId}</td>
                    <td style={{ padding: "8px 12px", color: "#888" }}>{r.referredEmail || "—"}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: r.status === "verified" ? "#1a2e1a" : "#2e2a1a",
                        color: r.status === "verified" ? "#6fcf6f" : "#cfb86f",
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#666", fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Lucky Draw Tab ───────────────────────────── */

interface LuckyDraw {
  id: string;
  title: string;
  prizeName: string;
  prizeValue?: string;
  prizeImage?: string;
  scheduledAt: string;
  status: string;
  winnerId?: string;
  winnerName?: string;
  winnerReferrals?: number;
  winnerAvatar?: string;
  drawnAt?: string;
  createdAt: string;
}

interface DrawParticipant {
  userId: string;
  username: string;
  avatar: string | null;
  referrals: number;
}

function SlotMachineSpinner({
  participants, winner, onComplete,
}: {
  participants: DrawParticipant[];
  winner: DrawParticipant;
  onComplete: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<"spinning" | "slowing" | "done">("spinning");
  const [offset, setOffset] = React.useState(0);
  const CARD_H = 80;
  const VISIBLE = 3;

  // Build a long reel: repeat participants many times, place winner near the end
  const reel = React.useMemo(() => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const list: DrawParticipant[] = [];
    for (let i = 0; i < 8; i++) {
      list.push(...shuffled.sort(() => Math.random() - 0.5));
    }
    // Place winner at a known final position
    list.push(participants[0] || winner); // padding
    list.push(winner); // this is the final card
    list.push(participants[1] || participants[0] || winner); // below winner
    return list;
  }, [participants, winner]);

  const winnerIdx = reel.length - 2;
  const finalOffset = winnerIdx * CARD_H - CARD_H; // center the winner card

  React.useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const TOTAL_DURATION = 5500;
    const totalDistance = finalOffset;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);

      // Ease out cubic for deceleration feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOffset = eased * totalDistance;
      setOffset(currentOffset);

      if (progress < 0.6) {
        setPhase("spinning");
      } else if (progress < 1) {
        setPhase("slowing");
      }

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setOffset(totalDistance);
        setPhase("done");
        setTimeout(onComplete, 500);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [finalOffset, onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, flexDirection: "column", gap: 24,
    }}>
      <div style={{
        fontFamily: "var(--a-display)", fontSize: 28, fontWeight: 800,
        color: "var(--a-ink)", textAlign: "center",
      }}>
        Lucky Draw
      </div>

      {/* Slot machine container */}
      <div style={{
        width: 320, height: CARD_H * VISIBLE, overflow: "hidden",
        borderRadius: 16, border: "2px solid var(--a-accent)",
        background: "var(--a-surface)", position: "relative",
        boxShadow: "0 0 40px rgba(200,255,61,0.15)",
      }}>
        {/* Winner zone indicator */}
        <div style={{
          position: "absolute", top: CARD_H, left: 0, right: 0, height: CARD_H,
          border: "2px solid var(--a-accent)", borderRadius: 8,
          background: phase === "done" ? "rgba(200,255,61,0.12)" : "rgba(200,255,61,0.05)",
          zIndex: 2, pointerEvents: "none",
          transition: "background 0.3s",
          boxShadow: phase === "done" ? "0 0 30px rgba(200,255,61,0.3)" : "none",
        }} />

        {/* Scrolling reel */}
        <div ref={containerRef} style={{
          transform: `translateY(-${offset}px)`,
          willChange: "transform",
        }}>
          {reel.map((p, i) => {
            const isWinner = phase === "done" && i === winnerIdx;
            return (
              <div key={`${p.userId}-${i}`} style={{
                height: CARD_H, display: "flex", alignItems: "center",
                gap: 12, padding: "0 20px",
                background: isWinner ? "rgba(200,255,61,0.1)" : "transparent",
                transition: isWinner ? "background 0.5s" : "none",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--a-surface-2)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, color: "var(--a-accent)",
                  flexShrink: 0, overflow: "hidden",
                  border: isWinner ? "2px solid var(--a-accent)" : "1px solid var(--a-border)",
                }}>
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (p.username || "?").slice(0, 2).toUpperCase()
                  )}
                </div>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: isWinner ? "var(--a-accent)" : "var(--a-ink)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {p.username}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--a-ink-dim)" }}>
                    {p.referrals} referral{p.referrals !== 1 ? "s" : ""}
                  </div>
                </div>
                {/* Ticket count */}
                <div style={{
                  fontSize: 12, fontFamily: "var(--a-mono)", fontWeight: 600,
                  color: "var(--a-ink-mute)", flexShrink: 0,
                }}>
                  {p.referrals} ticket{p.referrals !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status text */}
      <div style={{
        fontFamily: "var(--a-mono)", fontSize: 13, color: "var(--a-ink-dim)",
        textAlign: "center",
      }}>
        {phase === "spinning" && "Spinning..."}
        {phase === "slowing" && "Slowing down..."}
        {phase === "done" && (
          <span style={{ color: "var(--a-accent)", fontWeight: 700, fontSize: 16 }}>
            <Crown size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
            {winner.username} wins!
          </span>
        )}
      </div>

      {/* Confetti effect when done */}
      {phase === "done" && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10001,
          overflow: "hidden",
        }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              width: Math.random() * 8 + 4,
              height: Math.random() * 12 + 4,
              background: ["#c8ff3d", "#ff5b3d", "#5dd9ff", "#ff8c42", "#9c27b0", "#22c55e"][i % 6],
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: 0.9,
            }} />
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(${360 + Math.random() * 720}deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function DrawCountdown({ scheduledAt, onReady }: { scheduledAt: string; onReady: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function update() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { onReady(); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [scheduledAt, onReady]);

  return (
    <div style={{
      fontSize: 11, fontFamily: "var(--a-mono)", color: "var(--a-ink-dim)",
      padding: "5px 12px", borderRadius: 6,
      background: "rgba(93,217,255,0.08)", border: "1px solid rgba(93,217,255,0.2)",
      whiteSpace: "nowrap",
    }}>
      <Clock size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
      Draw in {timeLeft}
    </div>
  );
}

function LuckyDrawTab({ adminToken }: { adminToken: string }) {
  const [draws, setDraws] = useState<LuckyDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "Lucky Draw",
    prizeName: "",
    prizeValue: "",
    scheduledAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Spin state
  const [spinDraw, setSpinDraw] = useState<LuckyDraw | null>(null);
  const [spinParticipants, setSpinParticipants] = useState<DrawParticipant[]>([]);
  const [spinWinner, setSpinWinner] = useState<DrawParticipant | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);

  const headers = { "x-admin-token": adminToken, "content-type": "application/json" };

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lucky-draw", { headers: { "x-admin-token": adminToken } });
      if (res.ok) {
        const data = await res.json();
        setDraws(data.draws || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { fetchDraws(); }, [fetchDraws]);

  async function createDraw(e: React.FormEvent) {
    e.preventDefault();
    if (!form.prizeName.trim() || !form.scheduledAt) {
      setError("Prize name and scheduled date/time are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/lucky-draw", {
        method: "POST", headers,
        body: JSON.stringify({
          title: form.title || "Lucky Draw",
          prizeName: form.prizeName,
          prizeValue: form.prizeValue || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: "Lucky Draw", prizeName: "", prizeValue: "", scheduledAt: "" });
        fetchDraws();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create draw.");
      }
    } catch { setError("Network error."); }
    setCreating(false);
  }

  async function startSpin(draw: LuckyDraw) {
    // Only allow spinning at or after scheduled time
    if (new Date(draw.scheduledAt) > new Date()) {
      setError("Cannot start draw before the scheduled time.");
      return;
    }
    setSpinning(true);
    setSpinDraw(draw);
    setSpinComplete(false);
    try {
      const res = await fetch("/api/admin/lucky-draw", {
        method: "PATCH", headers,
        body: JSON.stringify({ id: draw.id, action: "spin" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpinParticipants(data.participants || []);
        setSpinWinner(data.winner || null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to spin.");
        setSpinning(false);
        setSpinDraw(null);
      }
    } catch {
      setError("Network error.");
      setSpinning(false);
      setSpinDraw(null);
    }
  }

  async function confirmWinner() {
    if (!spinDraw || !spinWinner) return;
    try {
      await fetch("/api/admin/lucky-draw", {
        method: "PATCH", headers,
        body: JSON.stringify({
          id: spinDraw.id,
          action: "complete",
          winnerId: spinWinner.userId,
          winnerName: spinWinner.username,
          winnerReferrals: spinWinner.referrals,
        }),
      });
    } catch { /* ignore */ }
    setSpinning(false);
    setSpinDraw(null);
    setSpinWinner(null);
    setSpinParticipants([]);
    setSpinComplete(false);
    fetchDraws();
  }

  async function cancelDraw(id: string) {
    await fetch("/api/admin/lucky-draw", {
      method: "PATCH", headers,
      body: JSON.stringify({ id, action: "cancel" }),
    });
    fetchDraws();
  }

  async function deleteDraw(id: string) {
    await fetch("/api/admin/lucky-draw", {
      method: "DELETE", headers,
      body: JSON.stringify({ id }),
    });
    fetchDraws();
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      scheduled: { bg: "rgba(93,217,255,0.12)", color: "#5dd9ff" },
      spinning: { bg: "rgba(200,255,61,0.12)", color: "#c8ff3d" },
      completed: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
      cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
    };
    const c = colors[status] || colors.scheduled;
    return {
      padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, textTransform: "uppercase" as const,
    };
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Lucky Draw</h2>
        <span className={styles.tabDesc}>Schedule lucky draws from the referral leaderboard. More referrals = more chances to win.</span>
      </div>

      {/* Create button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className={styles.btnSave} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Schedule New Draw"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createDraw} style={{
          background: "var(--a-surface)", border: "1px solid var(--a-border)",
          borderRadius: 10, padding: 20, marginBottom: 24,
        }}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input className={styles.input} placeholder="Lucky Draw"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prize Name *</label>
              <input className={styles.input} placeholder="e.g. $50 Amazon Gift Card"
                value={form.prizeName} onChange={e => setForm(f => ({ ...f, prizeName: e.target.value }))} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prize Value</label>
              <input className={styles.input} placeholder="e.g. $50"
                value={form.prizeValue} onChange={e => setForm(f => ({ ...f, prizeValue: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Scheduled Date & Time *</label>
              <input className={styles.input} type="datetime-local"
                value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
          </div>
          {error && <div className={styles.dangerBanner}><AlertTriangle size={14} /> {error}</div>}
          <button className={styles.btnSave} type="submit" disabled={creating}>
            {creating ? "Creating..." : "Schedule Draw"}
          </button>
        </form>
      )}

      {/* Draws list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 60, background: "var(--a-surface)", borderRadius: 8,
              animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      ) : draws.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 40, color: "var(--a-ink-dim)",
          background: "var(--a-surface)", borderRadius: 10,
        }}>
          <Dices size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>No lucky draws scheduled yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {draws.map(d => (
            <div key={d.id} style={{
              background: "var(--a-surface)", border: "1px solid var(--a-border)",
              borderRadius: 10, padding: "14px 18px", display: "flex",
              alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              {/* Info */}
              <div style={{ flex: 2, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--a-ink)" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: "var(--a-ink-dim)", marginTop: 2 }}>
                  <Gift size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
                  {d.prizeName}{d.prizeValue ? ` (${d.prizeValue})` : ""}
                </div>
              </div>

              {/* Scheduled time */}
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "var(--a-ink-mute)", marginBottom: 2 }}>
                  <Calendar size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
                  Scheduled
                </div>
                <div style={{ fontSize: 12, color: "var(--a-ink-dim)", fontFamily: "var(--a-mono)" }}>
                  {new Date(d.scheduledAt).toLocaleString()}
                </div>
              </div>

              {/* Status */}
              <div style={{ flex: 0 }}>
                <span style={statusBadge(d.status)}>{d.status}</span>
              </div>

              {/* Winner */}
              {d.status === "completed" && d.winnerName && (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: "var(--a-ink-mute)", marginBottom: 2 }}>
                    <Crown size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
                    Winner
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--a-accent)" }}>
                    {d.winnerName}
                    <span style={{ fontWeight: 400, color: "var(--a-ink-dim)", marginLeft: 6, fontSize: 11 }}>
                      ({d.winnerReferrals} referrals)
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {d.status === "scheduled" && (
                  <>
                    {new Date(d.scheduledAt) <= new Date() ? (
                      <button className={styles.btnSave} style={{ padding: "6px 14px", fontSize: 12 }}
                        onClick={() => startSpin(d)}>
                        <Dices size={12} style={{ marginRight: 4 }} /> Start Draw
                      </button>
                    ) : (
                      <DrawCountdown scheduledAt={d.scheduledAt} onReady={() => fetchDraws()} />
                    )}
                    <button className={styles.btnSmall} onClick={() => cancelDraw(d.id)}>Cancel</button>
                  </>
                )}
                {(d.status === "cancelled" || d.status === "completed") && (
                  <button className={styles.btnDanger} style={{ padding: "4px 10px" }}
                    onClick={() => deleteDraw(d.id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slot Machine Overlay */}
      {spinning && spinWinner && spinParticipants.length > 0 && (
        <SlotMachineSpinner
          participants={spinParticipants}
          winner={spinWinner}
          onComplete={() => setSpinComplete(true)}
        />
      )}

      {/* Confirm Winner Overlay */}
      {spinComplete && spinWinner && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10002, flexDirection: "column", gap: 20,
        }}>
          <div style={{
            background: "var(--a-surface)", border: "2px solid var(--a-accent)",
            borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 380,
            boxShadow: "0 0 60px rgba(200,255,61,0.2)",
          }}>
            <Crown size={40} style={{ color: "var(--a-accent)", marginBottom: 12 }} />
            <div style={{ fontFamily: "var(--a-display)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Winner!
            </div>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "12px auto",
              background: "var(--a-surface-2)", display: "flex",
              alignItems: "center", justifyContent: "center",
              border: "2px solid var(--a-accent)", overflow: "hidden",
              fontSize: 22, fontWeight: 700, color: "var(--a-accent)",
            }}>
              {spinWinner.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spinWinner.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (spinWinner.username || "?").slice(0, 2).toUpperCase()
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--a-accent)", marginBottom: 4 }}>
              {spinWinner.username}
            </div>
            <div style={{ fontSize: 13, color: "var(--a-ink-dim)", marginBottom: 4 }}>
              {spinWinner.referrals} referral{spinWinner.referrals !== 1 ? "s" : ""}
            </div>
            {spinDraw && (
              <div style={{ fontSize: 12, color: "var(--a-ink-mute)", marginBottom: 20 }}>
                Prize: {spinDraw.prizeName}{spinDraw.prizeValue ? ` (${spinDraw.prizeValue})` : ""}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className={styles.btnSave} onClick={confirmWinner}>
                Confirm Winner
              </button>
              <button className={styles.btnGhost} onClick={() => {
                setSpinning(false);
                setSpinDraw(null);
                setSpinWinner(null);
                setSpinParticipants([]);
                setSpinComplete(false);
                fetchDraws();
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Nav items (grouped into sections) ────────── */
const NAV_SECTIONS = [
  {
    label: "Dashboard",
    items: [
      { key: "overview",    label: "Overview",    icon: LayoutDashboard },
      { key: "analytics",   label: "Analytics",   icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "users",       label: "Users",       icon: Users },
      { key: "debates",     label: "Debates",     icon: MessageSquare },
      { key: "moderation",  label: "Moderation",  icon: Shield },
      { key: "feedback",    label: "Feedback",    icon: MessageCircle },
    ],
  },
  {
    label: "Marketing",
    items: [
      { key: "notifications", label: "Notifications", icon: Megaphone },
      { key: "challenges",    label: "Challenges",    icon: Trophy },
      { key: "redeem-codes",   label: "Redeem Codes",  icon: Gift },
      { key: "lucky-draw",     label: "Lucky Draw",    icon: Dices },
      { key: "ads",            label: "Ads",           icon: DollarSign },
      { key: "sponsors",       label: "Sponsors",      icon: Building2 },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "flags",       label: "Feature Flags", icon: Flag },
      { key: "sports",      label: "Sports",        icon: Dumbbell },
      { key: "maintenance", label: "Maintenance",   icon: Wrench },
      { key: "notice",      label: "Site Notice",   icon: Bell },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

/* ── Main dashboard ────────────────────────────── */
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState("overview");
  const [flags, setFlags] = useState<AdminFlags>(DEFAULT_FLAGS);
  const [saveMsg, setSaveMsg] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const token = () => typeof window !== "undefined" ? localStorage.getItem("curly-admin-token") ?? "" : "";

  // Check session on mount
  useEffect(() => {
    const stored = localStorage.getItem("curly-admin-token");
    if (stored) {
      setAuthed(true);
      loadFlags(stored);
    } else {
      setAuthed(false);
    }
  }, []);

  const loadFlags = useCallback(async (t: string) => {
    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "x-admin-token": t, "content-type": "application/json" },
      body: "{}",
    });
    if (res.ok) setFlags(await res.json());
  }, []);

  async function saveFlags(updates: Partial<AdminFlags>, action: string) {
    const res = await fetch("/api/admin/flags", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-token": token() },
      body: JSON.stringify({ ...updates, _action: action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlags(updated);
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    }
  }

  function logout() {
    localStorage.removeItem("curly-admin-token");
    setAuthed(false);
  }

  if (authed === null) {
    return <div className={styles.splashLoad}><RefreshCw size={20} className={styles.spin} /> Loading...</div>;
  }

  if (!authed) {
    return <LoginScreen onLogin={() => { setAuthed(true); loadFlags(token()); }} />;
  }

  const activeFeatures = Object.values(flags.features ?? {}).filter(Boolean).length;
  const activeSports = Object.values(flags.sports ?? {}).filter(Boolean).length;

  return (
    <div className={styles.root}>
      {/* Mobile overlay */}
      {mobileNav && <div className={styles.mobileOverlay} onClick={() => setMobileNav(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarLogo}>
          <Image src="/curly-guy.png" alt="Curly" width={32} height={32} />
          <div>
            <div className={styles.sidebarBrand}>curly<span>.</span>sports</div>
            <div className={styles.sidebarRole}>Super Admin</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              {section.items.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`${styles.navItem} ${tab === key ? styles.navItemActive : ""}`}
                  onClick={() => { setTab(key); setMobileNav(false); }}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{label}</span>
                  {tab === key && <ChevronRight size={14} className={styles.navArrow} />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarStatus}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${flags.maintenanceMode ? styles.statusRed : styles.statusGreen}`} />
            <span>{flags.maintenanceMode ? "Maintenance" : "Live"}</span>
          </div>
          <div className={styles.statusRow} style={{ opacity: 0.6 }}>
            <Activity size={12} />
            <span>{activeFeatures} features | {activeSports} sports</span>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          {saveMsg && <div className={styles.savedPill}><CheckCircle2 size={12} /> {saveMsg}</div>}
          <a href="/dashboard" className={styles.backLink}>Back to app</a>
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={14} /> <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileNav(v => !v)}>
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className={styles.topbarTitle}>Admin Dashboard</div>
            <div className={styles.topbarCrumb}>
              {ALL_NAV_ITEMS.find((n) => n.key === tab)?.label}
            </div>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.refreshBtn} onClick={() => loadFlags(token())} title="Refresh">
              <RefreshCw size={15} />
            </button>
            <div className={`${styles.statusPill} ${flags.maintenanceMode ? styles.statusPillRed : styles.statusPillGreen}`}>
              {flags.maintenanceMode ? <WifiOff size={12} /> : <Wifi size={12} />}
              {flags.maintenanceMode ? "Maintenance" : "All systems live"}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {tab === "overview"       && <OverviewTab flags={flags} adminToken={token()} />}
          {tab === "analytics"      && <AnalyticsTab adminToken={token()} />}
          {tab === "users"          && <UsersTab adminToken={token()} />}
          {tab === "moderation"     && <ModerationTab adminToken={token()} />}
          {tab === "notifications"  && <NotificationsTab adminToken={token()} />}
          {tab === "ads"            && <AdsTab adminToken={token()} />}
          {tab === "sponsors"       && <SponsorsTab adminToken={token()} />}
          {tab === "debates"        && <DebatesTab adminToken={token()} />}
          {tab === "challenges"    && <ChallengesTab adminToken={token()} />}
          {tab === "redeem-codes"  && <RedeemCodesTab adminToken={token()} flags={flags} onSave={saveFlags} />}
          {tab === "lucky-draw"    && <LuckyDrawTab adminToken={token()} />}
          {tab === "flags"          && <FlagsTab flags={flags} onSave={saveFlags} />}
          {tab === "sports"         && <SportsTab flags={flags} onSave={saveFlags} />}
          {tab === "feedback"       && <FeedbackTab adminToken={token()} />}
          {tab === "maintenance"    && <MaintenanceTab flags={flags} onSave={saveFlags} />}
          {tab === "notice"         && <NoticeTab flags={flags} onSave={saveFlags} />}
        </div>
      </main>
    </div>
  );
}
