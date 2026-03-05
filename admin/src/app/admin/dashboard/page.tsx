import { AdminStatCard } from '../_components/AdminStatCard';

/** Dashboard / Overview: Quick stats, engagement graphs, recent user activity. User engagement only — no system controls. */

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard / Overview</h1>
        <p className="mt-1 text-slate-400">Quick stats, engagement trends, and recent user activity. No system or Super Admin controls.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total users" value="—" icon={<span className="text-xl">👥</span>} />
        <AdminStatCard title="Active streaks" value="—" icon={<span className="text-xl">🔥</span>} />
        <AdminStatCard title="New signups" value="—" icon={<span className="text-xl">➕</span>} trend={{ label: 'this week', positive: true }} />
        <AdminStatCard title="Active today" value="—" icon={<span className="text-xl">✓</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Engagement trends</h2>
          <p className="mt-2 text-sm text-slate-500">Graphs for signups, DAU, and engagement over time. Connect your backend for live data.</p>
          <div className="mt-6 h-48 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 text-sm">
            Chart placeholder
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Recent user activity</h2>
          <p className="mt-2 text-sm text-slate-500">Latest logins and member actions.</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
              <span>—</span>
              <span>—</span>
            </div>
            <p className="text-xs text-slate-500">Connect backend to show recent activity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
