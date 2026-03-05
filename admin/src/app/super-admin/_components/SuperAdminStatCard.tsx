'use client';

import React from 'react';

interface SuperAdminStatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function SuperAdminStatCard({ title, value, icon, subtitle, className = '' }: SuperAdminStatCardProps) {
  return (
    <div
      className={`rounded-lg border bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50 ${className}`}
      style={{ borderColor: 'var(--sa-sidebar-border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-100">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className="rounded-md bg-slate-800/80 p-2 text-slate-400" aria-hidden>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
