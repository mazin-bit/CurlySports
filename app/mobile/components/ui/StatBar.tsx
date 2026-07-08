'use client';
import React from 'react';

interface StatBarProps {
  label: string;
  value: string;
  pct: number;
  color?: string;
}

export default function StatBar({ label, value, pct, color = 'var(--accent)' }: StatBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 78, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-2)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', width: 42, textAlign: 'right', direction: 'ltr', flexShrink: 0 }}>{value}</span>
    </div>
  );
}
