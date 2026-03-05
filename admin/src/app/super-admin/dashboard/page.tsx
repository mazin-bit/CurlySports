'use client';

/** System Overview only. Total admin accounts, server status/uptime, recent system activity. No member/sports data. */

function StatBlock({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard / System Overview</h1>
        <p className="mt-1 text-slate-400">System control only. No sports or member engagement data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock title="Total Admin accounts" value="—" sub="Admins with admin role" icon="◈" />
        <StatBlock title="Server status" value="OK" sub="Uptime" icon="◆" />
        <StatBlock title="Uptime" value="—" sub="Server uptime" icon="⏱" />
        <StatBlock title="DB connection" value="Connected" sub="PostgreSQL" icon="▤" />
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-amber-950/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-200">Recent system activity</h2>
          <p className="text-sm text-slate-500">Logins, role changes, and system events.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50">
                <td className="px-4 py-3 text-slate-500">—</td>
                <td className="px-4 py-3 text-slate-300">—</td>
                <td className="px-4 py-3 text-slate-400">—</td>
                <td className="px-4 py-3 text-slate-500">Connect backend for live activity.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
