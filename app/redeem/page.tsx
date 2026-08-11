"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import styles from "./redeem.module.css";
import {
  Copy,
  Share2,
  CheckCircle,
  Check,
  X,
  Link,
  MessageCircle,
  Mail,
  Trophy,
  Crown,
  Gift,
  Users,
  Star,
  Clock,
  ChevronDown,
  User,
  Sparkles,
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
  const [copied, setCopied] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
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
    const doCopy = () => {
      setCopied(true);
      setToast(label || "Copied!");
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      doCopy();
    }
  };

  /* Share */
  const shareMessage = `Join me on Curly Sports! Use my code: ${stats?.code ?? ""} to sign up. Download: https://curlysports.com/download`;
  const shareUrl = `https://curlysports.com/redeem?code=${stats?.code ?? ""}`;

  const handleShare = () => {
    setShowSharePopup(true);
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    setShowSharePopup(false);
  };
  const shareToGmail = () => {
    window.open(`https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(shareMessage)}&su=${encodeURIComponent("Join me on Curly Sports!")}`, "_blank");
    setShowSharePopup(false);
  };
  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, "_blank");
    setShowSharePopup(false);
  };
  const shareCopyLink = () => {
    copyText(shareUrl, "Link copied!");
    setShowSharePopup(false);
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
                className={`${styles.codeBtn} ${copied ? styles.codeBtnCopied : ""}`}
                onClick={() => copyText(stats.code!, "Code copied!")}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className={styles.shareBtn} onClick={handleShare}>
                <Share2 size={14} />
                Share
              </button>
            </div>

            {/* Share Popup */}
            {showSharePopup && (
              <div className={styles.shareOverlay} onClick={() => setShowSharePopup(false)}>
                <div className={styles.sharePopup} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.sharePopupHeader}>
                    <span>Share via</span>
                    <button className={styles.sharePopupClose} onClick={() => setShowSharePopup(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.shareOptions}>
                    <button className={styles.shareOption} onClick={shareToWhatsApp}>
                      <span className={styles.shareIconWa}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </span>
                      <span>WhatsApp</span>
                    </button>
                    <button className={styles.shareOption} onClick={shareToGmail}>
                      <span className={styles.shareIconGmail}>
                        <svg width="20" height="16" viewBox="0 0 24 18" fill="none">
                          <path d="M1.636 18h4.364V8.727L0 4.909V16.364C0 17.268.733 18 1.636 18z" fill="#4285F4"/>
                          <path d="M18 18h4.364c.904 0 1.636-.732 1.636-1.636V4.909L18 8.727z" fill="#34A853"/>
                          <path d="M18 1.636V8.727l6-3.818V2.455c0-2.024-2.311-3.178-3.927-1.963z" fill="#FBBC04"/>
                          <path d="M6 8.727V1.636L12 6l6-4.364V8.727L12 12.545z" fill="#EA4335"/>
                          <path d="M0 2.455v2.454l6 3.818V1.636L3.927.491C2.31-.723 0 .431 0 2.455z" fill="#C5221F"/>
                        </svg>
                      </span>
                      <span>Gmail</span>
                    </button>
                    <button className={styles.shareOption} onClick={shareToTwitter}>
                      <span className={styles.shareIconX}>𝕏</span>
                      <span>Twitter / X</span>
                    </button>
                    <button className={styles.shareOption} onClick={shareCopyLink}>
                      <span className={styles.shareIconLink}><Link size={20} /></span>
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
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

/* ── Lucky Draw Section ───────────────────────────────────── */

interface LuckyDrawInfo {
  id: string;
  title: string;
  prizeName: string;
  prizeValue?: string;
  scheduledAt: string;
}

interface PastWinner {
  id: string;
  title: string;
  prizeName: string;
  winnerName: string;
  winnerReferrals: number;
  drawnAt: string;
}

interface DrawParticipant {
  userId: string;
  username: string;
  avatar: string | null;
  referrals: number;
}

function PublicSlotMachineSpinner({
  participants, winner, title, prizeName, onComplete,
}: {
  participants: DrawParticipant[];
  winner: DrawParticipant;
  title: string;
  prizeName: string;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"spinning" | "slowing" | "done">("spinning");
  const [offset, setOffset] = useState(0);
  const CARD_H = 80;
  const VISIBLE = 3;

  const reel = useMemo(() => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const list: DrawParticipant[] = [];
    for (let i = 0; i < 8; i++) {
      list.push(...shuffled.sort(() => Math.random() - 0.5));
    }
    list.push(participants[0] || winner);
    list.push(winner);
    list.push(participants[1] || participants[0] || winner);
    return list;
  }, [participants, winner]);

  const winnerIdx = reel.length - 2;
  const finalOffset = winnerIdx * CARD_H - CARD_H;

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const TOTAL_DURATION = 5500;
    const totalDistance = finalOffset;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOffset = eased * totalDistance;
      setOffset(currentOffset);

      if (progress < 0.6) setPhase("spinning");
      else if (progress < 1) setPhase("slowing");

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setOffset(totalDistance);
        setPhase("done");
        setTimeout(onComplete, 3000);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [finalOffset, onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, flexDirection: "column", gap: 20,
    }}>
      <div style={{
        fontFamily: "var(--font-display, 'Bricolage Grotesque', sans-serif)", fontSize: 26, fontWeight: 800,
        color: "#fff", textAlign: "center",
      }}>
        <Sparkles size={20} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8, color: "#c8ff3d" }} />
        {title}
      </div>
      <div style={{
        fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace",
        textTransform: "uppercase", letterSpacing: 1,
      }}>
        Prize: {prizeName}
      </div>

      <div style={{
        width: 300, height: CARD_H * VISIBLE, overflow: "hidden",
        borderRadius: 16, border: "2px solid #c8ff3d",
        background: "#0d1117", position: "relative",
        boxShadow: "0 0 60px rgba(200,255,61,0.12)",
      }}>
        <div style={{
          position: "absolute", top: CARD_H, left: 0, right: 0, height: CARD_H,
          border: "2px solid #c8ff3d", borderRadius: 8,
          background: phase === "done" ? "rgba(200,255,61,0.12)" : "rgba(200,255,61,0.04)",
          zIndex: 2, pointerEvents: "none",
          transition: "background 0.3s",
          boxShadow: phase === "done" ? "0 0 30px rgba(200,255,61,0.3)" : "none",
        }} />

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
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "#1a1f2e", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, color: "#c8ff3d",
                  flexShrink: 0, overflow: "hidden",
                  border: isWinner ? "2px solid #c8ff3d" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (p.username || "?").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: isWinner ? "#c8ff3d" : "#fff",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {p.username}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {p.referrals} referral{p.referrals !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontFamily: "'Courier New', monospace", fontWeight: 600,
                  color: "rgba(255,255,255,0.3)", flexShrink: 0,
                }}>
                  {p.referrals} ticket{p.referrals !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 14, color: "rgba(255,255,255,0.5)",
        textAlign: "center",
      }}>
        {phase === "spinning" && "Spinning..."}
        {phase === "slowing" && "Slowing down..."}
        {phase === "done" && (
          <span style={{ color: "#c8ff3d", fontWeight: 700, fontSize: 18 }}>
            <Crown size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />
            {winner.username} wins!
          </span>
        )}
      </div>

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
              animation: `confettiFallPublic ${1.5 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: 0.9,
            }} />
          ))}
          <style>{`
            @keyframes confettiFallPublic {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function LuckyDrawSection() {
  const [upcoming, setUpcoming] = useState<LuckyDrawInfo | null>(null);
  const [pastWinners, setPastWinners] = useState<PastWinner[]>([]);
  const [countdown, setCountdown] = useState("");
  const [spinData, setSpinData] = useState<{
    title: string;
    prizeName: string;
    winner: DrawParticipant;
    participants: DrawParticipant[];
  } | null>(null);
  const [spinDone, setSpinDone] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/lucky-draw");
      if (res.ok) {
        const data = await res.json();
        if (data.upcoming) setUpcoming(data.upcoming);
        if (data.pastWinners) setPastWinners(data.pastWinners);
        // Check if a draw is currently spinning
        if (data.spinning && data.spinning.winner && data.spinning.participants?.length > 0 && !spinDone) {
          setSpinData({
            title: data.spinning.title,
            prizeName: data.spinning.prizeName,
            winner: data.spinning.winner,
            participants: data.spinning.participants,
          });
        } else if (!data.spinning) {
          setSpinData(null);
        }
      }
    } catch { /* ignore */ }
  }, [spinDone]);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds to detect when admin triggers a draw
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!upcoming) return;
    const target = new Date(upcoming.scheduledAt).getTime();
    function tick() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setCountdown("Starting soon!"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      parts.push(`${h}h`, `${m}m`, `${s}s`);
      setCountdown(parts.join(" "));
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [upcoming]);

  if (!upcoming && pastWinners.length === 0 && !spinData) return null;

  return (
    <>
      {/* Slot machine spinner overlay when a draw is active */}
      {spinData && !spinDone && (
        <PublicSlotMachineSpinner
          participants={spinData.participants}
          winner={spinData.winner}
          title={spinData.title}
          prizeName={spinData.prizeName}
          onComplete={() => {
            setSpinDone(true);
            setSpinData(null);
            // Re-fetch to get updated past winners
            fetchData();
          }}
        />
      )}

      {/* Upcoming draw countdown */}
      {upcoming && (
        <div className={styles.card} style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, var(--accent), var(--orange, #ff5b3d), var(--accent))",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }} />
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          <div className={styles.sectionLabel} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Sparkles size={14} />
            Lucky Draw
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 11,
            color: "var(--text-mute)", marginBottom: 8, textTransform: "uppercase",
            letterSpacing: 1,
          }}>
            {upcoming.title} — {upcoming.prizeName}
            {upcoming.prizeValue ? ` (${upcoming.prizeValue})` : ""}
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 28, fontWeight: 900,
            color: "var(--ink)", letterSpacing: 2, padding: "8px 0",
          }}>
            {countdown}
          </div>
          <div style={{
            fontSize: 11, color: "var(--text-mute)", marginTop: 4,
          }}>
            More referrals = more chances to win
          </div>
        </div>
      )}

      {/* Past winners */}
      {pastWinners.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionLabel} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Crown size={14} />
            Past Winners
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pastWinners.map(w => (
              <div key={w.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: "var(--bg, #f5f5f0)",
                borderRadius: 8, border: "1px solid var(--ink)",
              }}>
                <Crown size={16} style={{ color: "var(--accent, #c8ff3d)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13, color: "var(--ink)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {w.winnerName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
                    {w.prizeName} — {w.winnerReferrals} referral{w.winnerReferrals !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, color: "var(--text-mute)",
                  fontFamily: "'Courier New', monospace", flexShrink: 0,
                }}>
                  {new Date(w.drawnAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Redeem Page ──────────────────────────────────────────── */

function RedeemPageContent() {
  return (
    <AppShell active="redeem" title="Redeem" subtitle="Refer friends & earn rewards">
      <div className={styles.stack}>
        {/* Lucky draw countdown + past winners */}
        <LuckyDrawSection />

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
