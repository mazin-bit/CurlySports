'use client';
import React from 'react';
import Icon from './Icon';

interface TopbarProps {
  title: string;
  subtitle?: string;
  logoSrc?: string;
  onSearch?: () => void;
  onBell?: () => void;
  hasNotification?: boolean;
}

export default function Topbar({ title, subtitle, logoSrc, onSearch, onBell, hasNotification = false }: TopbarProps) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, background: 'var(--lime)', borderRadius: 11, display: 'grid', placeItems: 'center', transform: 'rotate(-6deg)', boxShadow: '3px 3px 0 var(--ink)', border: '2px solid var(--ink)', overflow: 'hidden', flexShrink: 0 }}>
        {logoSrc && <img src={logoSrc} alt="" style={{ width: '84%', height: '84%', objectFit: 'contain', transform: 'rotate(6deg)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>{subtitle}</div>}
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {onSearch && (
          <button onClick={onSearch} style={{ width: 36, height: 36, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--ink)', cursor: 'pointer' }}>
            <Icon name="search" size={17} />
          </button>
        )}
        {onBell && (
          <button onClick={onBell} style={{ width: 36, height: 36, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--ink)', cursor: 'pointer', position: 'relative' }}>
            <Icon name="bell" size={17} />
            {hasNotification && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', border: '1.5px solid var(--bg-2)' }} />}
          </button>
        )}
      </div>
    </header>
  );
}
