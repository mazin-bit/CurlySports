'use client';
import React from 'react';
import Icon from './ui/Icon';
import Badge from './ui/Badge';

const SECTIONS: [string, [string, string, string, string?][]][] = [
  ['App', [
    ['home', 'Home', 'home'],
    ['live', 'Live Scores', 'live'],
    ['leagues', 'Leagues', 'trophy'],
    ['teams', 'Teams', 'user'],
    ['players', 'Players', 'user'],
    ['news', 'News', 'news'],
    ['search', 'Search', 'search'],
  ]],
  ['Entertainment', [
    ['funzone', 'Debates', 'spark', 'HOT'],
    ['videos', 'Videos', 'live'],
    ['minigames', 'Mini Games', 'bolt'],
  ]],
  ['You', [
    ['profile', 'Profile & settings', 'cog'],
    ['favorites', 'Favourites', 'heart'],
    ['notifications', 'Notifications', 'bell'],
  ]],
];

interface MenuDrawerProps {
  active?: string;
  onClose: () => void;
  onNavigate: (key: string) => void;
}

export default function MenuDrawer({ active, onClose, onNavigate }: MenuDrawerProps) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(12,10,29,0.55)', backdropFilter: 'blur(4px)', zIndex: 100, animation: 'cs-mnFadeIn 0.2s ease' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 101, background: 'var(--bg-2)', borderTop: '2.5px solid var(--ink)', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(12,10,29,0.18)', maxHeight: '88%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'cs-mnSlideUp 0.28s var(--ease-pop)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-2)', margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 10px', borderBottom: '1.5px solid var(--border-2)' }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Menu</span>
          <button onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', background: 'var(--surface-3)', border: '1.5px solid var(--border-2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)' }}>
            <Icon name="close" size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {SECTIONS.map(([label, items]) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', padding: '10px 6px 5px' }}>{label}</div>
              {items.map(([key, name, icon, badge]) => {
                const isActive = active === key;
                return (
                  <button key={key} onClick={() => onNavigate(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 10, borderRadius: 10, marginBottom: 2, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${isActive ? 'var(--ink)' : 'transparent'}`, background: isActive ? 'var(--accent)' : 'transparent', boxShadow: isActive ? 'var(--shadow-sm)' : 'none', color: isActive ? 'var(--ink)' : 'var(--text-dim)', fontWeight: isActive ? 700 : 600, fontSize: 13.5 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: isActive ? 'var(--ink)' : 'var(--surface-3)', color: isActive ? 'var(--accent)' : 'var(--text-dim)', border: `1.5px solid ${isActive ? 'var(--ink)' : 'var(--border-2)'}`, flexShrink: 0 }}>
                      <Icon name={icon} size={14} />
                    </span>
                    <span style={{ flex: 1 }}>{name}</span>
                    {badge && <Badge tone={isActive ? 'ink' : 'mute'}>{badge}</Badge>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, borderTop: '2px solid var(--border-2)', padding: '12px 14px 18px', background: 'var(--bg-2)' }}>
          <button onClick={() => onNavigate('profile')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, border: '2px solid var(--ink)', flexShrink: 0 }}>MZ</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Mazin</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>View profile & settings</div>
            </div>
            <Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} />
          </button>
        </div>
      </div>
    </>
  );
}
