'use client';

/** Server & Database Health: CPU, memory, disk, DB connection, API uptime. */

function MetricCard({ title, value, status, icon }: { title: string; value: string; status?: 'ok' | 'warn' | 'error'; icon: string }) {
  const statusColor = status === 'ok' ? 'text-emerald-400' : status === 'warn' ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`mt-1 text-xl font-semibold tabular-nums ${statusColor}`}>{value}</p>
        </div>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
    </div>
  );
}

export default function SuperAdminHealthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Server & Database Health</h1>
        <p className="mt-1 text-slate-400">Server CPU, memory, disk usage. Database connection status. API uptime metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Server CPU" value="—" status="ok" icon="◐" />
        <MetricCard title="Memory usage" value="—" status="ok" icon="◑" />
        <MetricCard title="Disk usage" value="—" status="ok" icon="◆" />
        <MetricCard title="Database" value="Connected" status="ok" icon="▤" />
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-200">API uptime metrics</h2>
        <p className="mt-2 text-sm text-slate-500">
          Connect your backend to report API health, latency, and uptime. No member or sports data here—system only.
        </p>
      </div>
    </div>
  );
}
