'use client';

import { useState } from 'react';

/** Admin Management: Create/Delete Admin, Assign/Revoke Admin roles, View all Admins and activity. */

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<{ id: string; email: string; role: string; lastActive?: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Management</h1>
          <p className="mt-1 text-slate-400">Create / Delete Admin accounts. Assign / Revoke Admin roles. View all Admins and their activity.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500"
        >
          Create Admin
        </button>
      </div>

      <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-amber-950/50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">All Admins</h2>
          <p className="text-xs text-slate-500">View and manage admin accounts. All actions are audited.</p>
        </div>
        <div className="overflow-x-auto">
          {admins.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No admin accounts yet. Use &quot;Create Admin&quot; to add one. Connect your backend to list and persist admins.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200">{a.email}</td>
                    <td className="px-4 py-3 text-slate-300">{a.role}</td>
                    <td className="px-4 py-3 text-slate-500">{a.lastActive ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="text-amber-400 hover:text-amber-300 text-sm mr-3">Assign role</button>
                      <button type="button" className="text-red-400 hover:text-red-300 text-sm">Revoke / Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-amber-950/50 bg-slate-900/50 p-6">
          <h3 className="text-sm font-semibold text-slate-200">Create Admin account</h3>
          <p className="mt-1 text-xs text-slate-500">Connect your backend to create and persist admin accounts.</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
