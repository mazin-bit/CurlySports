export default function MemberDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          Sports analytics, live scores, streaks, and favorites. No admin or system controls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <p className="text-sm font-medium text-slate-400">Live scores</p>
              <p className="text-xl font-semibold text-slate-100">—</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-medium text-slate-400">Current streak</p>
              <p className="text-xl font-semibold text-slate-100">—</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❤️</span>
            <div>
              <p className="text-sm font-medium text-slate-400">Favorites</p>
              <p className="text-xl font-semibold text-slate-100">—</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm font-medium text-slate-400">Top players</p>
              <p className="text-xl font-semibold text-slate-100">—</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Sports analytics</h2>
        <p className="mt-2 text-sm text-slate-400">
          Use the sidebar to view live scores, teams, top players, your streaks, and favorites. This area is for members only—no admin or system controls.
        </p>
      </div>
    </div>
  );
}
