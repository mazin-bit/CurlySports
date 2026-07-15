"use client";

import { useState, useEffect, useCallback } from "react";
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
  verified: number;
  total: number;
  totalEntries: number;
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

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/challenges?status=active");
      if (res.ok) {
        const data = await res.json();
        // API returns teamA/teamB as strings — transform to ChallengeTeam objects
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
            totalEntries: statsData.totalEntries ?? 0,
          });
        }
      }
    } catch {
      /* not logged in */
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                {typeof window !== "undefined"
                  ? `${window.location.origin}/invite/${referral.code}`
                  : `/invite/${referral.code}`}
              </span>
              <button
                className={styles.copyBtn}
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/invite/${referral.code}`,
                    "link"
                  )
                }
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
