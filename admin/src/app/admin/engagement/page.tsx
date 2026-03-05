import { AdminStatCard } from '../_components/AdminStatCard';

/** Engagement Analytics: DAU graph, login trends, streak distribution, optional charts for member behavior. */

export default function AdminEngagementPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Engagement Analytics</h1>
        <p className="mt-1 text-slate-400">Daily active users, login trends, streak distribution. Optional charts for member behavior. Admin only — no system controls.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Daily active users (7d)" value="—" icon={<span className="text-xl">📈</span>} />
        <AdminStatCard title="New signups (7d)" value="—" icon={<span className="text-xl">➕</span>} />
        <AdminStatCard title="Retention" value="—" icon={<span className="text-xl">🔄</span>} />
        <AdminStatCard title="Avg. streak" value="—" icon={<span className="text-xl">🔥</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Daily active users</h2>
          <p className="mt-1 text-sm text-slate-500">Graph of DAU over time. Connect backend for live data.</p>
          <div className="mt-6 h-48 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 text-sm">
            DAU chart placeholder
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Login trends</h2>
          <p className="mt-1 text-sm text-slate-500">Login frequency over time.</p>
          <div className="mt-6 h-48 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 text-sm">
            Login trends chart placeholder
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Streak distribution</h2>
        <p className="mt-2 text-sm text-slate-500">How many users have 0–7 day streaks, 8–30, etc. Connect backend for distribution data.</p>
        <div className="mt-6 h-40 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 text-sm">
          Streak distribution chart placeholder
        </div>
      </div>
    </div>
  );
}
