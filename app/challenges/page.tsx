"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Trophy,
  Gift,
  Copy,
  Check,
  Clock,
  Users,
  ChevronRight,
  Crown,
  Medal,
  Sparkles,
  X,
} from "lucide-react";
import styles from "./challenges.module.css";

/* ── Types ────────────────────────────────────────────────────────── */

interface ChallengeTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
}

interface Challenge {
  id: string;
  title: string;
  teamA: ChallengeTeam;
  teamB: ChallengeTeam;
  matchDate: string;
  status: "active" | "settled" | "cancelled";
  winnerCount: number;
  userVote?: string | null;
  result?: string | null;
  userCorrect?: boolean;
}

interface ReferralStats {
  code: string;
  link: string;
  verified: number;
  total: number;
  totalEntries: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalReferrals: number;
  totalEntries: number;
  isCurrentUser?: boolean;
}

/* ── Countdown Timer ─────────────────────────────────────────────── */

function CountdownTimer({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className={styles.countdown}>
      <Clock size={18} />
      <span>{timeLeft}</span>
    </div>
  );
}

function calcTimeLeft(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "0d 0h 0m 0s";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

/* ── Team Logo with fallback ─────────────────────────────────────── */

function TeamLogo({
  team,
  size = 48,
}: {
  team: ChallengeTeam;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const hasValidLogo = team.logo && /\.(png|jpg|jpeg|gif|svg|webp)(\?|$)/i.test(team.logo);

  if (!hasValidLogo || failed) {
    return (
      <div
        className={styles.teamLogoFallback}
        style={{ width: size, height: size }}
      >
        {team.abbreviation?.slice(0, 3) || team.name.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.logo!}
      alt={team.name}
      className={styles.teamLogo}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const prevEntriesRef = useRef<number | null>(null);

  function showToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 6000);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fire all independent API calls in parallel
    const [challengesRes, codeRes, statsRes] = await Promise.allSettled([
      fetch("/api/challenges?status=active"),
      fetch("/api/referral/code"),
      fetch("/api/referral/stats"),
    ]);

    // Process challenges
    let activeId: string | null = null;
    if (challengesRes.status === "fulfilled" && challengesRes.value.ok) {
      const data = await challengesRes.value.json();
      const mapped = (data.challenges ?? []).map((c: Record<string, unknown>) => ({
        ...c,
        teamA: typeof c.teamA === "string"
          ? { id: "teamA", name: c.teamA, abbreviation: (c.teamA as string).slice(0, 3).toUpperCase(), logo: c.teamALogo ?? null }
          : c.teamA,
        teamB: typeof c.teamB === "string"
          ? { id: "teamB", name: c.teamB, abbreviation: (c.teamB as string).slice(0, 3).toUpperCase(), logo: c.teamBLogo ?? null }
          : c.teamB,
      }));
      setChallenges(mapped);
      const active = mapped.find((ch: Challenge) => ch.status === "active");
      if (active) activeId = active.id;
    }

    // Process referral (code + stats)
    if (codeRes.status === "fulfilled" && codeRes.value.ok) {
      const codeData = await codeRes.value.json();
      setIsLoggedIn(true);
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setReferral({
          code: codeData.code,
          link: statsData.link || codeData.link || `/invite/${codeData.code}`,
          verified: statsData.verified ?? 0,
          total: statsData.total ?? 0,
          totalEntries: statsData.totalEntries ?? 0,
        });
        if (statsData.hasRedeemed) setHasRedeemed(true);
      }
    }

    // Fetch global referral leaderboard
    try {
      const lbRes = await fetch("/api/referral/leaderboard");
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.entries ?? []);
      }
    } catch { /* ignore */ }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for entry updates every 30 seconds (silent background re-fetch)
  useEffect(() => {
    if (!isLoggedIn) return;

    const pollInterval = setInterval(async () => {
      try {
        const [statsRes, lbRes] = await Promise.allSettled([
          fetch("/api/referral/stats"),
          fetch("/api/referral/leaderboard"),
        ]);

        // Update leaderboard silently
        if (lbRes.status === "fulfilled" && lbRes.value.ok) {
          const lbData = await lbRes.value.json();
          setLeaderboard(lbData.entries ?? []);
        }

        // Check if entries increased — show toast
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          const newEntries = statsData.totalEntries ?? 0;

          if (prevEntriesRef.current !== null && newEntries > prevEntriesRef.current) {
            const gained = newEntries - prevEntriesRef.current;
            showToast(`You earned +${gained} new entr${gained === 1 ? "y" : "ies"} from a referral! Your total: ${newEntries}`);
          }
          prevEntriesRef.current = newEntries;

          setReferral((prev) =>
            prev
              ? {
                  ...prev,
                  verified: statsData.verified ?? prev.verified,
                  total: statsData.total ?? prev.total,
                  totalEntries: newEntries,
                }
              : prev
          );
        }
      } catch {
        /* silent polling — don't fail */
      }
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, [isLoggedIn]);

  // Initialize prevEntriesRef when referral data first loads
  useEffect(() => {
    if (referral && prevEntriesRef.current === null) {
      prevEntriesRef.current = referral.totalEntries;
    }
  }, [referral]);

  async function handleVote(challengeId: string, teamId: string) {
    if (votingId) return;
    setVotingId(challengeId);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, selectedTeam: teamId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId ? { ...c, userVote: teamId } : c
          )
        );
      }
    } catch {
      /* ignore */
    } finally {
      setVotingId(null);
    }
  }

  function copyToClipboard(text: string, type: "code" | "link") {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "code") {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    });
  }

  async function handleRedeemCode() {
    const trimmed = redeemCode.trim();
    if (!trimmed || redeemLoading) return;
    setRedeemLoading(true);
    setRedeemMsg(null);
    try {
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMsg({ type: "success", text: data.message });
        setRedeemCode("");
        setHasRedeemed(true);
        fetchData(); // Refresh stats + leaderboard
      } else {
        setRedeemMsg({ type: "error", text: data.error || "Failed to redeem code." });
      }
    } catch {
      setRedeemMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setRedeemLoading(false);
    }
  }

  const activeChallenge = challenges.find((c) => c.status === "active");
  const pastChallenges = challenges.filter((c) => c.status !== "active");

  if (loading) {
    return (
      <AppShell active="challenges" title="Prediction Challenge" titleKey="challenges.title" subtitleKey="challenges.subtitle">
        <div className={styles.skeleton}>
          <div className={styles.skeletonHero} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="challenges" title="Prediction Challenge" titleKey="challenges.title" subtitleKey="challenges.subtitle">
      {/* ── Toast notification ──────────────────────────────────── */}
      {toast.visible && (
        <div className={styles.toast}>
          <div className={styles.toastContent}>
            <Sparkles size={18} className={styles.toastIcon} />
            <span>{toast.message}</span>
          </div>
          <button className={styles.toastClose} onClick={() => setToast({ message: "", visible: false })}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className={styles.page}>
        {/* ── Hero Challenge Card ──────────────────────────────────── */}
        {activeChallenge ? (
          <div className={styles.heroCard}>
            <div className={styles.heroBadge}>
              <Trophy size={16} />
              MYSTERY PRIZE CHALLENGE
            </div>

            <div className={styles.heroBody}>
              <div className={styles.matchup}>
                <div className={styles.teamSide}>
                  <TeamLogo team={activeChallenge.teamA} />
                  <div className={styles.teamName}>
                    {activeChallenge.teamA.name}
                  </div>
                </div>

                <div className={styles.vsText}>VS</div>

                <div className={styles.teamSide}>
                  <TeamLogo team={activeChallenge.teamB} />
                  <div className={styles.teamName}>
                    {activeChallenge.teamB.name}
                  </div>
                </div>
              </div>

              <div className={styles.voteRow}>
                <button
                  className={`${styles.voteBtn} ${
                    activeChallenge.userVote === activeChallenge.teamA.id
                      ? styles.voteBtnSelected
                      : activeChallenge.userVote
                      ? styles.voteBtnDimmed
                      : ""
                  }`}
                  onClick={() =>
                    !activeChallenge.userVote &&
                    handleVote(activeChallenge.id, activeChallenge.teamA.id)
                  }
                  disabled={
                    !!activeChallenge.userVote ||
                    votingId === activeChallenge.id
                  }
                >
                  {activeChallenge.userVote === activeChallenge.teamA.id && (
                    <Check size={16} />
                  )}
                  {activeChallenge.teamA.name}
                </button>
                <div
                  className={styles.voteBtnWrapper}
                  onMouseEnter={() => activeChallenge.userVote && setTooltipVisible(true)}
                  onMouseLeave={() => setTooltipVisible(false)}
                >
                  <button
                    className={`${styles.voteBtn} ${
                      activeChallenge.userVote === activeChallenge.teamB.id
                        ? styles.voteBtnSelected
                        : activeChallenge.userVote
                        ? styles.voteBtnDimmed
                        : ""
                    }`}
                    onClick={() =>
                      !activeChallenge.userVote &&
                      handleVote(activeChallenge.id, activeChallenge.teamB.id)
                    }
                    disabled={
                      !!activeChallenge.userVote ||
                      votingId === activeChallenge.id
                    }
                  >
                    {activeChallenge.userVote === activeChallenge.teamB.id && (
                      <Check size={16} />
                    )}
                    {activeChallenge.teamB.name}
                  </button>
                  {tooltipVisible && activeChallenge.userVote && activeChallenge.userVote !== activeChallenge.teamB.id && (
                    <div className={`${styles.voteTooltip} ${styles.voteTooltipVisible}`}>
                      You&apos;ve already voted. Share your referral code — if someone new joins, you get an extra entry!
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.winnersLine}>
                <Gift size={18} />
                {activeChallenge.winnerCount} Winners Will Be Chosen
              </div>

              <CountdownTimer target={activeChallenge.matchDate} />
              <div className={styles.countdownSub}>
                Voting closes when the match starts
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Trophy size={32} />
            <p>No active challenges right now. Check back soon!</p>
          </div>
        )}

        {/* ── Your Stats ──────────────────────────────────────────── */}
        {isLoggedIn && referral ? (
          <div className={styles.statsCard}>
            <div className={styles.statsCardTitle}>
              <Users size={20} />
              Your Stats
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBig}>{referral.totalEntries}</div>
              <div className={styles.statLabel}>Total entries across all challenges</div>
            </div>

            <div className={styles.codeBox}>
              <span className={styles.codeText}>{referral.code}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(referral.code, "code")}
              >
                {codeCopied ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>
                {referral.link.replace(/^https?:\/\/localhost:\d+/, 'https://curlysports.com')}
              </span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(referral.link, "link")}
              >
                {linkCopied ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>

            <div className={styles.referralInfo}>
              {referral.verified} verified / {referral.total} total referrals
            </div>
          </div>
        ) : !isLoggedIn ? (
          <div className={styles.loginPrompt}>
            <div className={styles.loginPromptTitle}>
              Log in to track your entries
            </div>
            <div className={styles.loginPromptSub}>
              Vote on challenges, earn referral entries, and win mystery prizes.
            </div>
            <Link href="/login" className={styles.loginBtn}>
              Log In <ChevronRight size={16} />
            </Link>
          </div>
        ) : null}

        {/* ── Redeem Referral Code ──────────────────────────────── */}
        {isLoggedIn && !hasRedeemed && (
          <div className={styles.redeemCard}>
            <div className={styles.redeemTitle}>Have a referral code?</div>
            <div className={styles.redeemRow}>
              <input
                type="text"
                className={styles.redeemInput}
                placeholder="Enter referral code"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                maxLength={20}
              />
              <button
                className={styles.redeemBtn}
                onClick={handleRedeemCode}
                disabled={redeemLoading || !redeemCode.trim()}
              >
                {redeemLoading ? "Redeeming..." : "Redeem"}
              </button>
            </div>
            {redeemMsg && (
              <div
                className={`${styles.redeemMsg} ${
                  redeemMsg.type === "success" ? styles.redeemSuccess : styles.redeemError
                }`}
              >
                {redeemMsg.text}
              </div>
            )}
          </div>
        )}

        {/* ── Referral Leaderboard ─────────────────────────────── */}
        <div className={styles.leaderboardCard}>
          <div className={styles.leaderboardHeader}>
            <div className={styles.leaderboardTitle}>
              <Crown size={18} />
              Referral Leaderboard
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <>
              <div className={styles.lbColHeaders}>
                <span className={styles.lbColLabel} style={{ width: 36 }}>#</span>
                <span className={styles.lbColLabel} style={{ flex: 1 }}>User</span>
                <span className={styles.lbColLabel} style={{ width: 64, textAlign: "center" }}>Referrals</span>
                <span className={styles.lbColLabel} style={{ width: 56, textAlign: "right" }}>Entries</span>
              </div>

              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`${styles.lbRow} ${
                    entry.isCurrentUser ? styles.lbRowHighlight : ""
                  }`}
                >
                  <div
                    className={`${styles.lbRank} ${
                      entry.rank === 1
                        ? styles.rankGold
                        : entry.rank === 2
                        ? styles.rankSilver
                        : entry.rank === 3
                        ? styles.rankBronze
                        : ""
                    }`}
                  >
                    {entry.rank <= 3 ? (
                      entry.rank === 1 ? (
                        <Trophy size={18} />
                      ) : (
                        <Medal size={18} />
                      )
                    ) : (
                      entry.rank
                    )}
                  </div>

                  <div className={styles.lbAvatar}>
                    {entry.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.avatar} alt={entry.username} />
                    ) : (
                      entry.username.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className={styles.lbName}>{entry.username}</div>

                  <div className={styles.lbReferrals}>{entry.totalReferrals}</div>

                  <div>
                    <div className={styles.lbEntries}>{entry.totalEntries}</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.lbEmpty}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No referrals yet. Share your code to climb the leaderboard!</p>
            </div>
          )}
        </div>

        {/* ── Past Challenges ─────────────────────────────────────── */}
        {pastChallenges.length > 0 && (
          <div>
            <div className={styles.pastTitle}>Past Challenges</div>
            <div className={styles.pastGrid}>
              {pastChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className={styles.pastCard}
                >
                  <div className={styles.pastMatchup}>
                    <span className={styles.pastTeam}>{c.teamA.name}</span>
                    <span className={styles.pastVs}>VS</span>
                    <span className={styles.pastTeam}>{c.teamB.name}</span>
                  </div>
                  {c.result && (
                    <div className={styles.pastResult}>Result: {c.result}</div>
                  )}
                  <div className={styles.pastFooter}>
                    <span
                      className={`${styles.badge} ${
                        c.status === "settled"
                          ? styles.badgeSettled
                          : styles.badgeCancelled
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.userVote && (
                      <span
                        className={`${styles.badge} ${
                          c.userCorrect
                            ? styles.badgeCorrect
                            : styles.badgeIncorrect
                        }`}
                      >
                        {c.userCorrect ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
