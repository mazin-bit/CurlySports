'use client';
import React from 'react';

const SPORTS = [
  { slug: 'football', label: 'Football', abbr: 'FUT', color: '#c8ff3d' },
  { slug: 'basketball', label: 'Basketball', abbr: 'NBA', color: '#ff5b3d' },
  { slug: 'nfl', label: 'NFL', abbr: 'NFL', color: '#7c5cff' },
  { slug: 'tennis', label: 'Tennis', abbr: 'ATP', color: '#38c9ff' },
  { slug: 'baseball', label: 'Baseball', abbr: 'MLB', color: '#ffb74d' },
  { slug: 'f1', label: 'Formula 1', abbr: 'F1', color: '#ff5d9e' },
  { slug: 'cricket', label: 'Cricket', abbr: 'IPL', color: '#2dd4bf' },
];

interface SportSelectorProps {
  active?: string;
  onSelect?: (slug: string) => void;
}

export default function SportSelector({ active = 'football', onSelect }: SportSelectorProps) {
  const activeColor = (SPORTS.find(s => s.slug === active) ?? SPORTS[0]).color;
  return (
    <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 14px', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
        {SPORTS.map(s => {
          const isActive = active === s.slug;
          return (
            <button
              key={s.slug}
              onClick={() => onSelect?.(s.slug)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                padding: '9px 16px', borderRadius: 40, cursor: 'pointer',
                fontFamily: 'var(--body)', fontSize: 13, letterSpacing: '-0.01em',
                background: isActive ? 'var(--ink)' : 'var(--surface-2)',
                border: `2px solid ${isActive ? 'var(--ink)' : 'var(--border-2)'}`,
                color: isActive ? s.color : 'var(--text-dim)',
                fontWeight: isActive ? 700 : 600,
                boxShadow: isActive ? `3px 3px 0 ${s.color}` : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 900, letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 3, background: isActive ? `${s.color}22` : 'transparent', color: isActive ? s.color : 'var(--text-mute)', border: isActive ? `1px solid ${s.color}66` : '1px solid var(--border-2)' }}>{s.abbr}</span>
              {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ height: 3, width: '100%', background: activeColor, transition: 'background 0.3s' }} />
    </div>
  );
}
