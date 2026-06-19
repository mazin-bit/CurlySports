'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Icon from './ui/Icon';
import TeamCrest from './ui/TeamCrest';
import Badge from './ui/Badge';

interface ProfileProps {
  fav?: { code: string; name: string; first: string } | null;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 46, height: 27, borderRadius: 999, border: '2px solid var(--ink)', background: on ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .15s', boxShadow: 'var(--shadow-sm)' }}
    >
      <span style={{ position: 'absolute', top: 1.5, left: on ? 21 : 1.5, width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', transition: 'left .15s' }} />
    </button>
  );
}

function Row({ icon, color, title, sub, children, last }: { icon: string; color: string; title: string; sub?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--border-3)' }}>
      <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: color, border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
        <Icon name={icon} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 1 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfileScreen({ fav, onSearch, onBell, unread }: ProfileProps) {
  const { profile, logout } = useAuth();
  const [toggles, setToggles] = useState({ goals: true, debates: true, news: false, theme: false });
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: statsData } = useSWR<{ posts: number; votes: number }>(
    '/api/user/stats',
    fetcher,
    { refreshInterval: 60_000 }
  );

  const t = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));
  const team = fav ?? profile?.favTeam ?? { code: 'mun', name: 'Man United' };

  const displayName = profile?.name || profile?.username || 'You';
  const handleText  = [
    profile?.username ? `@${profile.username}` : null,
    profile?.email,
  ].filter(Boolean).join(' · ');

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar title="You" subtitle="Profile & settings" logoSrc="/curly-mark.png" onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Identity */}
        <Card style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--lime)', border: '2px solid var(--paper)', display: 'grid', placeItems: 'center', overflow: 'hidden', transform: 'rotate(-6deg)', flexShrink: 0 }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'rotate(6deg)' }} />
                : <img src="/curly-mark.png" alt="" style={{ width: '84%', height: '84%', objectFit: 'contain', transform: 'rotate(6deg)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--paper)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,253,247,0.6)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {handleText}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, borderTop: '1px solid rgba(255,253,247,0.15)', paddingTop: 14 }}>
            {([
              ['Takes', statsData?.posts != null ? String(statsData.posts) : '—'],
              ['Votes',  statsData?.votes  != null ? String(statsData.votes)  : '—'],
              ['Streak', '—'],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>{v}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'rgba(255,253,247,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Favourite team */}
        <Card subtitle="Your club" title="Favourite team" action="Change →">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <TeamCrest code={team.code} abbr={team.name.slice(0, 3).toUpperCase()} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{team.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>ALERTS ON · GOALS, LINEUPS, FT</div>
            </div>
            <Badge tone="accent">★ Pinned</Badge>
          </div>
        </Card>

        {/* Notifications */}
        <Card subtitle="Alerts" title="Notifications">
          <Row icon="live" color="var(--coral)" title="Goal alerts" sub="Your team scores or concedes"><Toggle on={toggles.goals} onClick={() => t('goals')} /></Row>
          <Row icon="spark" color="var(--accent)" title="Debate replies" sub="When your takes get heat"><Toggle on={toggles.debates} onClick={() => t('debates')} /></Row>
          <Row icon="news" color="var(--sky)" title="News digest" sub="Daily, 8am" last><Toggle on={toggles.news} onClick={() => t('news')} /></Row>
        </Card>

        {/* Preferences */}
        <Card subtitle="App" title="Preferences">
          <Row icon="bolt" color="var(--purple)" title="Bedroom mode" sub="Founder's dark theme"><Toggle on={toggles.theme} onClick={() => t('theme')} /></Row>
          <Row icon="globe" color="var(--amber)" title="Region & odds" sub="United Kingdom · GMT"><Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} /></Row>
          <Row icon="cog" color="var(--surface-3)" title="Privacy & data" last><Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} /></Row>
        </Card>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: loggingOut ? 'var(--text-mute)' : 'var(--coral)', cursor: loggingOut ? 'not-allowed' : 'pointer' }}
        >
          <Icon name="logout" size={15} /> {loggingOut ? 'Signing out…' : 'Log out'}
        </button>

        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>CURLYSPORTS.COM · v2.4 · MADE IN A BEDROOM</div>
      </div>
    </div>
  );
}
