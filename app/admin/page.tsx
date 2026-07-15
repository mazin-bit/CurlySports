"use client";
import { useState, useEffect, useCallback } from "react";
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
