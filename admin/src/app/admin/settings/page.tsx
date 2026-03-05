'use client';

/** Settings / Admin Tools: Limited settings for Admin. Cannot create Super Admin or modify system-wide feature flags. */

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings / Admin Tools</h1>
        <p className="mt-1 text-slate-400">Limited settings for Admin. You cannot create Super Admin or modify system-wide feature flags.</p>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-200">Admin limits</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>• You can manage users, view leaderboards, and see engagement analytics.</li>
          <li>• You cannot create or promote users to Super Admin.</li>
          <li>• You cannot change system-wide feature flags or maintenance mode.</li>
          <li>• Role assignment and system controls are Super Admin only.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-200">Optional admin preferences</h2>
        <p className="mt-2 text-sm text-slate-500">Placeholder for admin-only preferences (e.g. default date range, table page size). No system or Super Admin options here.</p>
      </div>
    </div>
  );
}
