"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  LayoutDashboard, Flag, Dumbbell, Wrench, Bell,
  LogOut, Eye, EyeOff, Shield, Save, RefreshCw,
  Activity, Zap, Globe, CheckCircle2, XCircle,
  ChevronRight, AlertTriangle, BarChart2, Clock,
  Wifi, WifiOff,
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
  funZone:    { label: "Fun Zone",     desc: "Debates, polls, and community content",       href: "/fun-zone" },
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
            {loading ? "Checking…" : "Enter dashboard →"}
          </button>
        </form>
        <div className={styles.loginBack}>
          <a href="/dashboard">← Back to app</a>
        </div>
      </div>
    </div>
  );
}

/* ── Overview tab ──────────────────────────────── */
function OverviewTab({ flags }: { flags: AdminFlags }) {
  const totalViews = Object.values(flags.pageViews ?? {}).reduce((a, b) => a + b, 0);
  const activeFeatures = Object.values(flags.features ?? {}).filter(Boolean).length;
  const activeSports = Object.values(flags.sports ?? {}).filter(Boolean).length;
  const topPages = Object.entries(flags.pageViews ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>Overview</h2>
        <span className={styles.tabDesc}>Platform health at a glance.</span>
      </div>

      <div className={styles.statsRow}>
        <StatCard icon={<BarChart2 size={20} />} label="Page Views" value={totalViews.toLocaleString()} sub="since deployment" />
        <StatCard icon={<Zap size={20} />} label="Active Features" value={`${activeFeatures} / ${Object.keys(flags.features ?? {}).length}`} color="#c8ff3d" />
        <StatCard icon={<Globe size={20} />} label="Active Sports" value={`${activeSports} / ${Object.keys(flags.sports ?? {}).length}`} color="#5dd9ff" />
        <StatCard
          icon={flags.maintenanceMode ? <WifiOff size={20} /> : <Wifi size={20} />}
          label="Site Status"
          value={flags.maintenanceMode ? "Maintenance" : "Live"}
          color={flags.maintenanceMode ? "#ef4444" : "#22c55e"}
        />
      </div>

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
          placeholder="Message shown to users during maintenance…"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Estimated downtime</div>
        <input
          className={styles.input}
          value={est}
          onChange={(e) => setEst(e.target.value)}
          placeholder="e.g. About 30 minutes  ·  Back by 3 PM"
        />
        <div className={styles.fieldHint}>Optional — shown under the maintenance message.</div>
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
        {saving ? <><RefreshCw size={14} className={styles.spin} /> Saving…</> : <><Save size={14} /> Save changes</>}
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
        <span className={styles.tabDesc}>Show a banner at the top of all pages — useful for announcements, alerts, or news.</span>
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
        <div className={styles.fieldHint}>Keep it short — one line ideal.</div>
      </div>

      {enabled && notice && (
        <div className={styles.noticePreviewWrap}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.noticeBannerPreview}>
            <Bell size={14} />
            <span>{notice}</span>
            <button className={styles.noticeClose}>×</button>
          </div>
        </div>
      )}

      <button className={styles.btnSave} onClick={save} disabled={saving} style={{ marginTop: 24 }}>
        {saving ? <><RefreshCw size={14} className={styles.spin} /> Saving…</> : <><Save size={14} /> Save changes</>}
      </button>
    </div>
  );
}

/* ── Nav items ─────────────────────────────────── */
const NAV = [
  { key: "overview",     label: "Overview",     icon: LayoutDashboard },
  { key: "flags",        label: "Feature Flags", icon: Flag },
  { key: "sports",       label: "Sports",       icon: Dumbbell },
  { key: "maintenance",  label: "Maintenance",  icon: Wrench },
  { key: "notice",       label: "Site Notice",  icon: Bell },
];

/* ── Main dashboard ────────────────────────────── */
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState("overview");
  const [flags, setFlags] = useState<AdminFlags>(DEFAULT_FLAGS);
  const [saveMsg, setSaveMsg] = useState("");

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
    return <div className={styles.splashLoad}><RefreshCw size={20} className={styles.spin} /> Loading…</div>;
  }

  if (!authed) {
    return <LoginScreen onLogin={() => { setAuthed(true); loadFlags(token()); }} />;
  }

  const activeFeatures = Object.values(flags.features ?? {}).filter(Boolean).length;
  const activeSports = Object.values(flags.sports ?? {}).filter(Boolean).length;

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Image src="/curly-guy.png" alt="Curly" width={32} height={32} />
          <div>
            <div className={styles.sidebarBrand}>curly<span>.</span>sports</div>
            <div className={styles.sidebarRole}>Super Admin</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`${styles.navItem} ${tab === key ? styles.navItemActive : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
              {tab === key && <ChevronRight size={14} className={styles.navArrow} />}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarStatus}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${flags.maintenanceMode ? styles.statusRed : styles.statusGreen}`} />
            <span>{flags.maintenanceMode ? "Maintenance" : "Live"}</span>
          </div>
          <div className={styles.statusRow} style={{ opacity: 0.6 }}>
            <Activity size={12} />
            <span>{activeFeatures} features · {activeSports} sports</span>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          {saveMsg && <div className={styles.savedPill}><CheckCircle2 size={12} /> {saveMsg}</div>}
          <a href="/dashboard" className={styles.backLink}>← Back to app</a>
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.topbarTitle}>Admin Dashboard</div>
            <div className={styles.topbarCrumb}>
              {NAV.find((n) => n.key === tab)?.label}
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
          {tab === "overview"    && <OverviewTab flags={flags} />}
          {tab === "flags"       && <FlagsTab flags={flags} onSave={saveFlags} />}
          {tab === "sports"      && <SportsTab flags={flags} onSave={saveFlags} />}
          {tab === "maintenance" && <MaintenanceTab flags={flags} onSave={saveFlags} />}
          {tab === "notice"      && <NoticeTab flags={flags} onSave={saveFlags} />}
        </div>
      </main>
    </div>
  );
}
