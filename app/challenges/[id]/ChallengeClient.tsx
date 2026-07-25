"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Trophy,
  Gift,
  Copy,
  Check,
  X,
  Clock,
  Crown,
  Medal,
  Users,
  ChevronRight,
  Share2,
} from "lucide-react";
import styles from "./challenge-detail.module.css";

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
  result?: string | null;
  winnerTeamId?: string | null;
  userVote?: string | null;
  userCorrect?: boolean;
  userWon?: boolean;
  userBaseEntries?: number;
  userReferralEntries?: number;
  userTotalEntries?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalEntries: number;
  isCurrentUser?: boolean;
}

interface ReferralStats {
  code: string;
  verified: number;
  total: number;
  maxReferralEntries: number;
}

/* ── Countdown Timer ─────────────────────────────────────────────── */

function CountdownTimer({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
      <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
      {timeLeft}
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
  size = 64,
}: {
  team: ChallengeTeam;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!team.logo || failed) {
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
      src={team.logo}
      alt={team.name}
      className={styles.teamLogo}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function ChallengeClient() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.challenge ?? data;
        // API returns teamA/teamB as strings — transform to ChallengeTeam objects
        if (typeof c.teamA === "string") {
          c.teamA = { id: "teamA", name: c.teamA, abbreviation: c.teamA.slice(0, 3).toUpperCase(), logo: c.teamALogo ?? null };
        }
        if (typeof c.teamB === "string") {
          c.teamB = { id: "teamB", name: c.teamB, abbreviation: c.teamB.slice(0, 3).toUpperCase(), logo: c.teamBLogo ?? null };
        }
        // Merge user-specific data from the API response into the challenge object
        if (data.userVote) {
          c.userVote = data.userVote.selectedTeam; // "teamA" or "teamB"
        }
        if (data.userEntries) {
          c.userBaseEntries = Number(data.userEntries.baseEntries ?? 0);
          c.userReferralEntries = Number(data.userEntries.referralEntries ?? 0);
          c.userTotalEntries = Number(data.userEntries.totalEntries ?? 0);
        }
        if (data.userWon) {
          c.userWon = true;
        }
        // Check if user's vote was correct (for settled challenges)
        if (c.status === "settled" && c.result && data.userVote) {
          c.userCorrect = data.userVote.selectedTeam === c.result;
        }
        setChallenge(c);
      }
    } catch {
      /* ignore */
    }

    try {
      const lbRes = await fetch(
        `/api/challenges/${challengeId}/leaderboard?page=1&limit=10`
      );
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.entries ?? []);
      }
    } catch {
      /* ignore */
    }

    try {
      const codeRes = await fetch("/api/referral/code");
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setIsLoggedIn(true);

        const statsRes = await fetch("/api/referral/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReferral({
            code: codeData.code,
            verified: statsData.verified ?? 0,
            total: statsData.total ?? 0,
            maxReferralEntries: statsData.maxReferralEntries ?? 20,
          });
        }
      }
    } catch {
      /* not logged in */
    }

    setLoading(false);
  }, [challengeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleVote(teamId: string) {
    if (votingId || !challenge) return;
    setVotingId(challenge.id);
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
        setChallenge((prev) =>
          prev ? { ...prev, userVote: teamId } : prev
        );
      }
    } catch {
      /* ignore */
    } finally {
      setVotingId(null);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
  }

  function shareWhatsApp() {
    if (!referral) return;
    const url = `${window.location.origin}/invite/${referral.code}`;
    const text = `Join me on CurlySports and win mystery prizes! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareTwitter() {
    if (!referral) return;
    const url = `${window.location.origin}/invite/${referral.code}`;
    const text = `Join me on @CurlySports and win mystery prizes!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  }

  if (loading) {
    return (
      <AppShell active="challenges" title="Challenge" titleKey="challenges.detailTitle">
        <div className={styles.skeleton}>
          <div className={styles.skeletonBlock} style={{ height: 320 }} />
          <div className={styles.skeletonBlock} style={{ height: 180 }} />
          <div className={styles.skeletonBlock} style={{ height: 200 }} />
          <div className={styles.skeletonBlock} style={{ height: 300 }} />
        </div>
      </AppShell>
    );
  }

  if (!challenge) {
    return (
      <AppShell active="challenges" title="Challenge" titleKey="challenges.detailTitle">
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-mute)", fontFamily: "var(--mono)" }}>
          Challenge not found.
        </div>
      </AppShell>
    );
  }

  const votedTeamName =
    challenge.userVote === challenge.teamA.id
      ? challenge.teamA.name
      : challenge.userVote === challenge.teamB.id
      ? challenge.teamB.name
      : null;

  const referralUsed = referral ? Math.min(referral.verified, referral.maxReferralEntries) : 0;
  const referralMax = referral?.maxReferralEntries ?? 20;

  return (
    <AppShell active="challenges" title="Challenge" titleKey="challenges.detailTitle">
      <div className={styles.page}>
        {/* ── Challenge Header ─────────────────────────────────── */}
        <div className={styles.headerCard}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              <Trophy size={20} />
              {challenge.title || "Mystery Prize Challenge"}
            </div>
            <span
              className={`${styles.statusBadge} ${
                challenge.status === "active"
                  ? styles.statusActive
                  : challenge.status === "settled"
                  ? styles.statusSettled
                  : styles.statusCancelled
              }`}
            >
              {challenge.status}
            </span>
          </div>

          <div className={styles.headerBody}>
            <div className={styles.matchup}>
              <div className={styles.teamSide}>
                <TeamLogo team={challenge.teamA} />
                <div className={styles.teamName}>{challenge.teamA.name}</div>
              </div>

              <div className={styles.vsText}>VS</div>

              <div className={styles.teamSide}>
                <TeamLogo team={challenge.teamB} />
                <div className={styles.teamName}>{challenge.teamB.name}</div>
              </div>
            </div>

            <div className={styles.matchDateTime}>
              <Clock size={14} />
              {new Date(challenge.matchDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(challenge.matchDate).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            {challenge.status === "active" && (
              <>
                <div className={styles.voteRow}>
                  <button
                    className={`${styles.voteBtn} ${
                      challenge.userVote === challenge.teamA.id
                        ? styles.voteBtnSelected
                        : challenge.userVote
                        ? styles.voteBtnDimmed
                        : ""
                    }`}
                    onClick={() =>
                      !challenge.userVote && handleVote(challenge.teamA.id)
                    }
                    disabled={!!challenge.userVote || !!votingId}
                  >
                    {challenge.userVote === challenge.teamA.id && (
                      <Check size={16} />
                    )}
                    {challenge.teamA.name}
                  </button>
                  <div
                    className={styles.voteBtnWrapper}
                    onMouseEnter={() => challenge.userVote && setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                  >
                    <button
                      className={`${styles.voteBtn} ${
                        challenge.userVote === challenge.teamB.id
                          ? styles.voteBtnSelected
                          : challenge.userVote
                          ? styles.voteBtnDimmed
                          : ""
                      }`}
                      onClick={() =>
                        !challenge.userVote && handleVote(challenge.teamB.id)
                      }
                      disabled={!!challenge.userVote || !!votingId}
                    >
                      {challenge.userVote === challenge.teamB.id && (
                        <Check size={16} />
                      )}
                      {challenge.teamB.name}
                    </button>
                    {tooltipVisible && challenge.userVote && challenge.userVote !== challenge.teamB.id && (
                      <div className={`${styles.voteTooltip} ${styles.voteTooltipVisible}`}>
                        You&apos;ve already voted. Share your referral code — if someone new joins, you get an extra entry!
                      </div>
                    )}
                  </div>
                </div>
                <CountdownTimer target={challenge.matchDate} />
              </>
            )}

            {challenge.status === "settled" && challenge.result && (
              <div className={styles.resultDisplay}>
                <div className={styles.resultLabel}>Result</div>
                <div className={styles.resultWinner}>{challenge.result}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Your Entry Card ─────────────────────────────────── */}
        {isLoggedIn && challenge.userVote && (
          <div className={styles.entryCard}>
            <div className={styles.entryCardTitle}>
              <Trophy size={18} />
              Your Entry
            </div>

            <div
              className={`${styles.predictionRow} ${
                challenge.status === "settled"
                  ? challenge.userCorrect
                    ? styles.predictionCorrect
                    : styles.predictionIncorrect
                  : ""
              }`}
            >
              {challenge.status === "settled" ? (
                challenge.userCorrect ? (
                  <Check size={18} />
                ) : (
                  <X size={18} />
                )
              ) : (
                <Check size={18} />
              )}
              Your Prediction: {votedTeamName}
            </div>

            <div className={styles.entriesGrid}>
              <div className={styles.entryItem}>
                <div className={styles.entryNum}>
                  {challenge.userBaseEntries ?? 0}
                </div>
                <div className={styles.entryLabel}>Base</div>
              </div>
              <div className={styles.entryItem}>
                <div className={styles.entryNum}>
                  {challenge.userReferralEntries ?? 0}
                </div>
                <div className={styles.entryLabel}>Referral</div>
              </div>
              <div className={styles.entryItem}>
                <div className={`${styles.entryNum} ${styles.entryNumAccent}`}>
                  {challenge.userTotalEntries ?? 0}
                </div>
                <div className={styles.entryLabel}>Total</div>
              </div>
            </div>

            {challenge.userWon && (
              <div className={styles.winnerBanner}>
                <Trophy size={24} />
                You won!
              </div>
            )}
          </div>
        )}

        {/* ── Referral Section ────────────────────────────────── */}
        {isLoggedIn && referral ? (
          <div className={styles.referralCard}>
            <div className={styles.referralCardTitle}>
              Invite Friends, Earn Entries
            </div>

            <div className={styles.codeDisplay}>
              <span className={styles.codeValue}>{referral.code}</span>
            </div>

            <div className={styles.shareRow}>
              <button
                className={styles.shareBtn}
                onClick={() =>
                  copyText(
                    `${window.location.origin}/invite/${referral.code}`
                  )
                }
              >
                <Copy size={16} />
                Copy Link
              </button>
              <button className={styles.shareBtn} onClick={shareWhatsApp}>
                <Share2 size={16} />
                WhatsApp
              </button>
              <button className={styles.shareBtn} onClick={shareTwitter}>
                <Share2 size={16} />
                Twitter/X
              </button>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                {referralUsed} of {referralMax} referral entries used
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(
                      (referralUsed / referralMax) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : !isLoggedIn ? (
          <div className={styles.loginPrompt}>
            <div className={styles.loginPromptTitle}>
              Log in to vote and earn entries
            </div>
            <div className={styles.loginPromptSub}>
              Make predictions, invite friends, and win mystery prizes.
            </div>
            <Link href="/login" className={styles.loginBtn}>
              Log In <ChevronRight size={16} />
            </Link>
          </div>
        ) : null}

        {/* ── Leaderboard Preview ─────────────────────────────── */}
        {leaderboard.length > 0 && (
          <div className={styles.leaderboardCard}>
            <div className={styles.leaderboardHeader}>
              <div className={styles.leaderboardTitle}>
                <Crown size={18} />
                Leaderboard
              </div>
              <Link
                href={`/challenges/${challengeId}/leaderboard`}
                className={styles.viewAllLink}
              >
                View Full Leaderboard
                <ChevronRight size={14} />
              </Link>
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

                <div>
                  <div className={styles.lbEntries}>{entry.totalEntries}</div>
                  <div className={styles.lbEntriesLabel}>entries</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mystery Prize Card ──────────────────────────────── */}
        <div className={styles.prizeCard}>
          <div className={styles.prizeIcon}>
            <Gift size={24} />
          </div>
          <div className={styles.prizeTitle}>MYSTERY PRIZE</div>
          <div className={styles.prizeWinners}>
            {challenge.winnerCount} Winners Will Be Chosen
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </AppShell>
  );
}
