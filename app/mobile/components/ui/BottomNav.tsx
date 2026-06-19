'use client';
import React from 'react';
import Icon from './Icon';

const ITEMS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'live', label: 'Live', icon: 'live' },
  { key: 'funzone', label: 'Debates', icon: 'spark' },
  { key: 'leagues', label: 'Leagues', icon: 'trophy' },
  { key: 'more', label: 'More', icon: 'bars' },
];

interface BottomNavProps {
  active?: string;
  onSelect?: (key: string) => void;
}

export default function BottomNav({ active = 'home', onSelect }: BottomNavProps) {
  return (
    <nav aria-label="Mobile navigation" style={{ display: 'grid', gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)`, background: 'var(--bg-2)', borderTop: '2.5px solid var(--ink)', padding: '10px 6px 12px', flexShrink: 0 }}>
      {ITEMS.map(item => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className="cs-tap"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: isActive ? 'var(--orange)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'color 0.15s, transform 0.12s ease', WebkitTapHighlightColor: 'transparent' }}
          >
            <div style={{ transition: 'transform 0.15s var(--ease-pop)', transform: isActive ? 'scale(1.15)' : 'scale(1)' }}>
              <Icon name={item.icon} size={22} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
