'use client';

import { useState, useEffect } from 'react';

interface AuditEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  resource?: string;
  details?: string;
}

/** Audit Logs / System Logs: View all Admin actions, filter by date/user, export for reporting. */

export default function SuperAdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetch('/api/super-admin/audit')
      .then((res) => (res.ok ? res.json() : []))
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Audit Logs / System Logs</h1>
        <p className="mt-1 text-slate-400">View all Admin actions. Filter by date / user. Export logs for reporting.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Filter by user (email)"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 w-full sm:w-56"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 w-full sm:w-44"
        />
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          Export logs
        </button>
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No audit entries yet. Admin actions will appear here.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-500">{e.timestamp}</td>
                    <td className="px-4 py-3 text-slate-200">{e.actorEmail}</td>
                    <td className="px-4 py-3 text-slate-300">{e.action}</td>
                    <td className="px-4 py-3 text-slate-500">{e.resource ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{e.details ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
