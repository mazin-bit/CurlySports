"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Trophy,
  Medal,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import styles from "./leaderboard.module.css";

/* ── Types ────────────────────────────────────────────────────────── */

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  baseEntries: number;
  referralEntries: number;
  totalEntries: number;
  isCurrentUser?: boolean;
}

const LIMIT = 50;

/* ── Main Page ───────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const params = useParams();
  const challengeId = params.id as string;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/challenges/${challengeId}/leaderboard?page=${p}&limit=${LIMIT}`
        );
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    },
    [challengeId]
  );

  useEffect(() => {
    fetchLeaderboard(page);
  }, [fetchLeaderboard, page]);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AppShell active="challenges" title="Leaderboard" titleKey="challenges.leaderboardTitle">
      <div className={styles.page}>
        <Link
          href={`/challenges/${challengeId}`}
          className={styles.backLink}
        >
          <ChevronLeft size={14} />
          Back to Challenge
        </Link>

        {loading ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonBlock} style={{ height: 48 }} />
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeletonBlock}
                style={{ height: 56 }}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={32} />
            <p>No entries yet. Be the first to vote!</p>
          </div>
        ) : (
          <>
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <span>Rank</span>
                <span>User</span>
                <span className={styles.colCenter}>Base</span>
                <span className={styles.colCenter}>Referral</span>
                <span className={styles.colRight}>Total</span>
              </div>

              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={`${styles.row} ${
                    entry.isCurrentUser ? styles.rowHighlight : ""
                  }`}
                >
                  <div
                    className={`${styles.rank} ${
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
                    ) : null}
                    {entry.rank}
                  </div>

                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {entry.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.avatar} alt={entry.username} />
                      ) : (
                        entry.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className={styles.username}>{entry.username}</span>
                  </div>

                  <div className={styles.numCell}>{entry.baseEntries}</div>
                  <div className={styles.numCell}>{entry.referralEntries}</div>
                  <div className={styles.totalCell}>{entry.totalEntries}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - page) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dots-${idx}`} className={styles.pageInfo}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`${styles.pageBtn} ${
                          page === item ? styles.pageBtnActive : ""
                        }`}
                        onClick={() => goToPage(item as number)}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
