'use client';

import { useState, useEffect } from 'react';

/** User Management: View all users, search/filter by role/streak/activity, Ban/Suspend/Reset streak. */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<{ id: string; email?: string; displayName?: string; role?: string; status?: string; streak?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActivity, setFilterActivity] = useState<string>('');

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
        <p className="mt-1 text-slate-400">View all users. Search / filter by role, streak, activity. Ban / Suspend / Reset streak.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <input
          type="search"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder-slate-500 w-full sm:w-56"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 w-full sm:w-40"
        >
          <option value="">All roles</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 w-full sm:w-40"
        >
          <option value="">All activity</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No users yet. Add an API (e.g. GET /api/admin/users) to list users. Then add Ban / Suspend / Reset streak actions that call your backend.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Streak</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-200">{u.email || u.displayName || u.id}</td>
                  <td className="px-4 py-3 text-slate-300">{u.role || 'member'}</td>
                  <td className="px-4 py-3 text-slate-300">{u.streak ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        u.status === 'banned' ? 'text-red-400' : u.status === 'suspended' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-sm text-slate-400 hover:text-slate-200 mr-3">
                      Reset streak
                    </button>
                    <button type="button" className="text-sm text-amber-400 hover:text-amber-300 mr-3">
                      Suspend
                    </button>
                    <button type="button" className="text-sm text-red-400 hover:text-red-300">
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
