'use client';
import React from 'react';
import { DATA } from '../data';
import type { Match } from '../data';
import Icon from './ui/Icon';

interface NotificationsProps {
  onBack: () => void;
  onMarkAll: () => void;
  onOpenMatch: (m: Match) => void;
  onOpenPlayer: () => void;
}

export default function NotificationsScreen({ onBack, onMarkAll, onOpenMatch, onOpenPlayer }: NotificationsProps) {
  const D = DATA;
  const groups: ['today' | 'earlier', string][] = [['today', 'Today'], ['earlier', 'Earlier']];

  const route = (icon: string) => {
    if (icon === 'live' || icon === 'bell') onOpenMatch(D.liveFootball[0]);
    else if (icon === 'flame') onOpenPlayer();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-2)', borderBottom: '2.5px solid var(--ink)', flexShrink: 0 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 11, display: 'grid', placeItems: 'center', color: 'var(--ink)', transform: 'scaleX(-1)', cursor: 'pointer' }}>
          <Icon name="arrow-right" size={18} />
        </button>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Notifications</div>
        <button onClick={onMarkAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--orange)', cursor: 'pointer' }}>MARK ALL READ</button>
      </header>

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map(([key, label]) => (
          <React.Fragment key={key}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', padding: '8px 2px 4px' }}>{label}</div>
            {D.notifications.filter(n => n.group === key).map(n => (
              <button key={n.id} onClick={() => route(n.icon)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', padding: 14, borderRadius: 12, cursor: 'pointer', background: n.unread ? 'var(--surface)' : 'var(--surface-2)', border: '2px solid var(--ink)', boxShadow: n.unread ? 'var(--shadow-sm)' : 'none', position: 'relative' }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: n.color, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                  <Icon name={n.icon} size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3, flex: 1 }}>{n.title}</div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', flexShrink: 0 }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 3 }}>{n.body}</div>
                </div>
                {n.unread && <span style={{ position: 'absolute', top: 14, right: 12, width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', border: '1.5px solid var(--ink)' }} />}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
