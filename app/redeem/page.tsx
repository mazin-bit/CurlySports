"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import styles from "./redeem.module.css";
import {
  Copy,
  Share2,
  CheckCircle,
  Trophy,
  Crown,
  Gift,
  Users,
  Star,
  Clock,
  ChevronDown,
  User,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────── */

interface ReferralStats {
  code: string | null;
  link: string | null;
  totalReferrals: number;
  verifiedReferrals: number;
  totalEntries: number;
  hasRedeemed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
  isCurrentUser: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
}

/* ── Toast ────────────────────────────────────────────────── */

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2000);
    return () => clearTimeout(t);
  }, [onHide]);

  return <div className={styles.toast}>{message}</div>;
}

/* ── Leaderboard Section (always visible) ─────────────────── */

function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchLb = useCallback(async (limit: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/referral/leaderboard?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLb(10);
  }, [fetchLb]);

  const handleShowAll = () => {
    setExpanded(true);
    fetchLb(0);
  };

  const rankClass = (rank: number) => {
    if (rank === 1) return styles.lbRankGold;
    if (rank === 2) return styles.lbRankSilver;
    if (rank === 3) return styles.lbRankBronze;
    return styles.lbRank;
  };

  const scoreClass = (rank: number) => {
    if (rank === 1) return styles.lbScoreGold;
    if (rank === 2) return styles.lbScoreSilver;
    if (rank === 3) return styles.lbScoreBronze;
    return styles.lbScore;
  };

  return (
    <div className={styles.card}>
      <div className={styles.lbHeader}>
        <div className={styles.sectionLabel}>Leaderboard</div>
        {total > 0 && (
          <span className={styles.lbCount}>
            {total} referrer{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && leaderboard.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: 44 }} />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className={styles.emptyLb}>
          <Trophy size={24} className={styles.emptyLbIcon} />
          <div>No referrals yet. Be the first!</div>
        </div>
      ) : (
        <>
          {leaderboard.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.userId}
                className={entry.isCurrentUser ? styles.lbRowYou : styles.lbRow}
              >
                {/* Rank */}
                <div className={rankClass(entry.rank)}>
                  {isTop3 ? <Crown size={14} /> : entry.rank}
                </div>

                {/* Avatar */}
                <div
                  className={
                    entry.isCurrentUser ? styles.lbAvatarYou : styles.lbAvatar
                  }
                >
                  {entry.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.avatar}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    entry.username.slice(0, 2).toUpperCase()
                  )}
                </div>

                {/* Name */}
                <div
                  className={
                    entry.isCurrentUser ? styles.lbNameYou : styles.lbName
                  }
                >
                  {entry.username}
                  {entry.isCurrentUser && (
                    <span className={styles.youBadge}>YOU</span>
                  )}
                </div>

                {/* Score */}
                <div className={scoreClass(entry.rank)}>
                  {entry.totalReferrals}
                </div>
              </div>
            );
          })}

          {!expanded && total > 10 && (
            <button
              onClick={handleShowAll}
              disabled={loading}
              className={styles.showAllBtn}
            >
              <ChevronDown size={14} />
              {loading ? "..." : `Show All (${total})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── Challenge Section ────────────────────────────────────── */

function ChallengeSection() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/challenges/active");
        if (res.ok) {
          const data = await res.json();
          if (data.challenge) setChallenge(data.challenge);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!challenge) return null;

  return (
    <div className={styles.challengeCard}>
      <div className={styles.challengeBadge}>
        <Star size={12} />
        Active Challenge
      </div>
      <div className={styles.challengeTitle}>{challenge.title}</div>
      <div className={styles.challengeDesc}>{challenge.description}</div>
      <div className={styles.challengeReward}>
        <Gift size={12} />
        Reward: {challenge.reward}
      </div>
      {challenge.deadline && (
        <div className={styles.challengeDeadline}>
          <Clock size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
          Ends {new Date(challenge.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

/* ── User Stats Section (auth-gated) ──────────────────────── */

function UserSection() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendCode, setFriendCode] = useState(searchParams.get("code") || "");
  const [redeemStatus, setRedeemStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [redeemMsg, setRedeemMsg] = useState("");
  const [toast, setToast] = useState("");
  const [autoRedeemDone, setAutoRedeemDone] = useState(false);

  /* Check auth via API (app uses custom JWT, not Supabase Auth) */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.id ?? data.userId ?? "authed" });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  /* Fetch stats */
  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // Ensure code exists + fetch stats in parallel
      const [, statsRes] = await Promise.all([
        fetch("/api/referral/code"),
        fetch("/api/referral/stats"),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchStats();
  }, [authLoading, fetchStats]);

  /* Auto-redeem if code query param is present (after login redirect) */
  useEffect(() => {
    if (autoRedeemDone || !user || loading) return;
    const codeParam = searchParams.get("code");
    if (codeParam && !stats?.hasRedeemed) {
      setAutoRedeemDone(true);
      setFriendCode(codeParam.toUpperCase());
      // Trigger redeem
      (async () => {
        setRedeemStatus("loading");
        try {
          const res = await fetch("/api/referral/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeParam.trim().toUpperCase() }),
          });
          const data = await res.json();
          if (res.ok) {
            setRedeemStatus("success");
            setRedeemMsg(data.message || "Code redeemed successfully!");
            setFriendCode("");
            fetchStats();
          } else {
            setRedeemStatus("error");
            setRedeemMsg(data.error || "Invalid code.");
          }
        } catch {
          setRedeemStatus("error");
          setRedeemMsg("Network error. Try again.");
        }
      })();
    }
  }, [user, loading, autoRedeemDone, searchParams, stats?.hasRedeemed, fetchStats]);

  /* Clipboard */
  const copyText = (text: string, label?: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => setToast(label || "Copied!"))
        .catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast(label || "Copied!");
    }
  };

  /* Share */
  const handleShare = () => {
    const code = stats?.code ?? "";
    const shareMessage = `Join me on Curly Sports! Use my code: ${code} to sign up. Download: https://curlysports.com/download`;
    if (navigator.share) {
      navigator.share({ title: "Curly Sports Referral", text: shareMessage }).catch(() => {});
    } else {
      copyText(shareMessage, "Share message copied!");
    }
  };

  /* Redeem */
  const handleRedeem = async () => {
    const trimmed = friendCode.trim().toUpperCase();
    if (!trimmed) return;
    setRedeemStatus("loading");
    try {
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemStatus("success");
        setRedeemMsg(data.message || "Code redeemed successfully!");
        setFriendCode("");
        fetchStats();
      } else {
        setRedeemStatus("error");
        setRedeemMsg(data.error || "Invalid code.");
      }
    } catch {
      setRedeemStatus("error");
      setRedeemMsg("Network error. Try again.");
    }
  };

  const hasRedeemed = stats?.hasRedeemed || redeemStatus === "success";

  /* Not logged in */
  if (authLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[120, 90, 70].map((h, i) => (
          <div key={i} className={styles.skeleton} style={{ height: h }} />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {/* ── Your Referral Code (sign in prompt) ─────────── */}
        <div className={styles.card}>
          <div className={styles.sectionLabel}>Your Referral Code</div>
          <div className={styles.signInCodeBox}>
            <div className={styles.signInCodePlaceholder}>- - - - - -</div>
            <a href="/login" className={styles.signInLink}>
              Sign in to get your code
            </a>
          </div>
          <div className={styles.codeBtns}>
            <button className={styles.codeBtn} disabled>
              <Copy size={14} />
              Copy
            </button>
            <button className={styles.shareBtn} disabled style={{ opacity: 0.5 }}>
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>

        {/* ── Enter a Friend's Code ──────────────────────── */}
        <div className={styles.card}>
          <div className={styles.sectionLabel}>Enter a Friend&apos;s Code</div>
          <div className={styles.redeemRow}>
            <input
              type="text"
              className={styles.redeemInput}
              value={friendCode}
              onChange={(e) => {
                setFriendCode(e.target.value.toUpperCase());
                setRedeemStatus("idle");
                setRedeemMsg("");
              }}
              placeholder="e.g. CURLY1234"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.location.href = `/login?redirect=${encodeURIComponent(`/redeem?code=${friendCode.trim().toUpperCase()}`)}`;
                }
              }}
            />
            <button
              className={styles.redeemBtn}
              onClick={() => {
                const trimmed = friendCode.trim().toUpperCase();
                if (trimmed) {
                  window.location.href = `/login?redirect=${encodeURIComponent(`/redeem?code=${trimmed}`)}`;
                }
              }}
              disabled={!friendCode.trim()}
            >
              Redeem
            </button>
          </div>
          {redeemStatus === "error" && redeemMsg && (
            <div className={styles.redeemError}>{redeemMsg}</div>
          )}
          <div className={styles.redeemHint}>Sign in required to redeem codes</div>
        </div>

        {/* ── Your Stats (zeroed) ────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.sectionLabel}>Your Stats</div>
          <div className={styles.statsGrid}>
            {[
              { label: "Referrals", value: 0 },
              { label: "Verified", value: 0 },
              { label: "Entries", value: 0 },
            ].map((s) => (
              <div key={s.label} className={styles.statBox}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[120, 90, 70].map((h, i) => (
          <div key={i} className={styles.skeleton} style={{ height: h }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* ── Your Referral Code ──────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.sectionLabel}>Your Referral Code</div>
        {stats?.code ? (
          <>
            <div className={styles.codeDisplay}>{stats.code}</div>
            <div className={styles.codeBtns}>
              <button
                className={styles.codeBtn}
                onClick={() => copyText(stats.code!, "Code copied!")}
              >
                <Copy size={14} />
                Copy
              </button>
              <button className={styles.shareBtn} onClick={handleShare}>
                <Share2 size={14} />
                Share
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noCode}>No code available yet.</div>
        )}
      </div>

      {/* ── Enter a Friend's Code ──────────────────────────── */}
      {!hasRedeemed ? (
        <div className={styles.card}>
          <div className={styles.sectionLabel}>Enter a Friend&apos;s Code</div>
          <div className={styles.redeemRow}>
            <input
              type="text"
              className={styles.redeemInput}
              value={friendCode}
              onChange={(e) => {
                setFriendCode(e.target.value.toUpperCase());
                setRedeemStatus("idle");
                setRedeemMsg("");
              }}
              placeholder="e.g. CURLY1234"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRedeem();
              }}
            />
            <button
              className={styles.redeemBtn}
              onClick={handleRedeem}
              disabled={!friendCode.trim() || redeemStatus === "loading"}
            >
              {redeemStatus === "loading" ? "..." : "Redeem"}
            </button>
          </div>
          {redeemStatus === "error" && redeemMsg && (
            <div className={styles.redeemError}>{redeemMsg}</div>
          )}
          {redeemMsg && redeemStatus !== "error" && redeemStatus !== "idle" && redeemStatus !== "loading" && (
            <div className={styles.redeemSuccess}>
              <CheckCircle size={14} />
              {redeemMsg}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.sectionLabel}>Enter a Friend&apos;s Code</div>
          <div className={styles.alreadyRedeemed}>
            <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span className={styles.alreadyRedeemedText}>Already Redeemed</span>
          </div>
        </div>
      )}

      {/* ── Your Stats ─────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.sectionLabel}>Your Stats</div>
        <div className={styles.statsGrid}>
          {[
            { label: "Referrals", value: stats?.totalReferrals ?? 0 },
            { label: "Verified", value: stats?.verifiedReferrals ?? 0 },
            { label: "Entries", value: stats?.totalEntries ?? 0 },
          ].map((s) => (
            <div key={s.label} className={styles.statBox}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onHide={() => setToast("")} />}
    </>
  );
}

/* ── Redeem Page ──────────────────────────────────────────── */

function RedeemPageContent() {
  return (
    <AppShell active="redeem" title="Redeem" subtitle="Refer friends & earn rewards">
      <div className={styles.stack}>
        {/* Auth-gated sections: code, friend code, stats */}
        <UserSection />

        {/* Active challenge (only renders if admin has one) */}
        <ChallengeSection />

        {/* Public leaderboard */}
        <LeaderboardSection />
      </div>
    </AppShell>
  );
}

export default function RedeemPage() {
  return (
    <Suspense>
      <RedeemPageContent />
    </Suspense>
  );
}
