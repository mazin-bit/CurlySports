'use client';

import { useState } from 'react';

type Filter = 'weekly' | 'monthly' | 'all-time';

interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  avatar?: string;
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
}

const MOCK: LeaderboardEntry[] = [];

/** Streak Leaderboard: Top 10 current streak, Top 10 longest streak, filters Weekly / Monthly / All-time. */

export default function AdminLeaderboardPage() {
  const [filter, setFilter] = useState<Filter>('all-time');
  const [view, setView] = useState<'current' | 'longest'>('current');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 10;
  const entries = MOCK;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Streak Leaderboard</h1>
        <p className="mt-1 text-slate-400">Top 10 users by current streak. Top 10 users by longest streak. Filters: Weekly / Monthly / All-time.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['weekly', 'monthly', 'all-time'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
          <div className="w-px h-8 bg-slate-600 hidden sm:block" />
          <button
            type="button"
            onClick={() => setView('current')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'current' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            By current streak
          </button>
          <button
            type="button"
            onClick={() => setView('longest')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'longest' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            By longest streak
          </button>
        </div>
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-slate-100 placeholder-slate-500 w-full sm:w-56"
        />
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No streak data yet. Connect your backend to show Top 10 by current streak, Top 10 by longest streak, with Weekly / Monthly / All-time filters.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Rank</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Current streak</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Longest streak</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Total logins</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-slate-700/30 hover:bg-slate-800/30 ${e.rank <= 3 ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-4 py-3 font-bold text-slate-200">#{e.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-sm text-slate-300">
                        {e.displayName?.charAt(0) || '?'}
                      </div>
                      <span className="text-slate-200">{e.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-amber-400">🔥 {e.currentStreak}</td>
                  <td className="px-4 py-3 text-slate-300">{e.longestStreak}</td>
                  <td className="px-4 py-3 text-slate-300">{e.totalLogins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {entries.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">Page {page + 1}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)} className="text-sm text-slate-400 hover:text-slate-200">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
