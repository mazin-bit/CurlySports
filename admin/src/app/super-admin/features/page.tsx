'use client';

import { useState } from 'react';

/** Feature Flags / Maintenance: Enable/disable features, maintenance mode, global controls over app modules. */

interface Flag {
  key: string;
  enabled: boolean;
  description: string;
}

export default function SuperAdminFeaturesPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleMaintenance() {
    setLoading(true);
    setMaintenanceOn((v) => !v);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Feature Flags / Maintenance</h1>
        <p className="mt-1 text-slate-400">Enable/Disable new features. Toggle maintenance mode. Global controls over app modules.</p>
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Maintenance mode</h2>
        <p className="mt-1 text-sm text-slate-500">When ON, the app can show a global maintenance message. Super Admin only.</p>
        <button
          type="button"
          onClick={toggleMaintenance}
          disabled={loading}
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-medium ${
            maintenanceOn ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {maintenanceOn ? 'Maintenance ON' : 'Maintenance OFF'}
        </button>
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-amber-950/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Feature flags</h2>
          <p className="text-xs text-slate-500">Enable or disable app modules globally. Changes are audited.</p>
        </div>
        <div className="p-4">
          {flags.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No feature flags defined. Connect your backend to manage flags.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Key</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.key} className="border-t border-slate-800">
                    <td className="py-3 pr-4 font-medium text-slate-200">{f.key}</td>
                    <td className="py-3 pr-4 text-slate-400">{f.description}</td>
                    <td className="py-3">{f.enabled ? 'On' : 'Off'}</td>
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
