'use client';

import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { label: string; positive: boolean };
  className?: string;
}

export function AdminStatCard({ title, value, icon, trend, className = '' }: AdminStatCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 transition-all hover:border-slate-600/50 hover:bg-slate-800/80 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-100 tabular-nums">{value}</p>
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-slate-700/50 p-2 text-slate-400">{icon}</div>
        )}
      </div>
    </div>
  );
}
