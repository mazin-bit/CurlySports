'use client';

/** Role & Permissions Management: Define/modify permissions for Admin, feature flag control, audit logs for role changes. */

export default function SuperAdminRolesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Role & Permissions Management</h1>
        <p className="mt-1 text-slate-400">Define / modify permissions for Admin accounts. Feature flag control. Audit logs for role changes.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Admin permissions</h2>
          <p className="mt-2 text-sm text-slate-500">
            Define which actions Admins can perform (e.g. user management, streak leaderboard, ban/suspend). Only Super Admin can change these.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>• User management: view, ban, suspend, reset streak</li>
            <li>• Streak leaderboard: view</li>
            <li>• Engagement analytics: view</li>
            <li>• Cannot create Super Admin or modify system-wide feature flags</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Feature flag control</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enable/disable modules per role. Changes are audited. Use the Feature Flags / Maintenance tab for global flags.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-amber-950/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Audit logs for role changes</h2>
          <p className="text-xs text-slate-500">Recent role assignments and revocations.</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500">No role change events yet. Connect your backend to record and display role change audit entries.</p>
        </div>
      </div>
    </div>
  );
}
