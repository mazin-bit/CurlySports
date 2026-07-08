'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Icon from './ui/Icon';
import TeamCrest from './ui/TeamCrest';
import Badge from './ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALES, type Locale } from '@/lib/i18n';

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
      <span style={{ position: 'absolute', top: 1.5, insetInlineStart: on ? 21 : 1.5, width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', transition: 'inset-inline-start .15s' }} />
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
  const { profile, logout, deleteAccount } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const [toggles, setToggles] = useState({ goals: true, debates: true, news: false, theme: false });
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);

  const { data: statsData } = useSWR<{ posts: number; votes: number }>(
    '/api/user/stats',
    fetcher,
    { refreshInterval: 60_000 }
  );

  const toggle = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));
  const team = fav ?? profile?.favTeam ?? { code: 'mun', name: 'Man United' };

  const displayName = profile?.name || profile?.username || t('profile.title');
  const handleText  = [
    profile?.username ? `@${profile.username}` : null,
    profile?.email,
  ].filter(Boolean).join(' \u00b7 ');

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account.';
      setDeleteError(msg);
      setDeleting(false);
    }
  };

  const currentLocale = LOCALES.find(l => l.code === locale);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar title={t('profile.title')} subtitle={t('profile.subtitle')} logoSrc="/curly-guy.png" onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Identity */}
        <Card style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--lime)', border: '2px solid var(--paper)', display: 'grid', placeItems: 'center', overflow: 'hidden', transform: 'rotate(-6deg)', flexShrink: 0 }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'rotate(6deg)' }} />
                : <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
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
              [t('profile.takes'), statsData?.posts != null ? String(statsData.posts) : '\u2014'],
              [t('profile.votes'),  statsData?.votes  != null ? String(statsData.votes)  : '\u2014'],
              [t('profile.streak'), '\u2014'],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>{v}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'rgba(255,253,247,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Favourite team */}
        <Card subtitle="Your club" title="Favourite team" action="Change \u2192">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <TeamCrest code={team.code} abbr={team.name.slice(0, 3).toUpperCase()} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{team.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>ALERTS ON \u00b7 GOALS, LINEUPS, FT</div>
            </div>
            <Badge tone="accent">{'\u2605'} Pinned</Badge>
          </div>
        </Card>

        {/* Notifications */}
        <Card subtitle={t('favorites.alerts')} title={t('nav.notifications')}>
          <Row icon="live" color="var(--coral)" title={t('profile.goalAlerts')} sub="Your team scores or concedes"><Toggle on={toggles.goals} onClick={() => toggle('goals')} /></Row>
          <Row icon="spark" color="var(--accent)" title={t('profile.debateReplies')} sub="When your takes get heat"><Toggle on={toggles.debates} onClick={() => toggle('debates')} /></Row>
          <Row icon="news" color="var(--sky)" title={t('profile.newsDigest')} sub="Daily, 8am" last><Toggle on={toggles.news} onClick={() => toggle('news')} /></Row>
        </Card>

        {/* Preferences */}
        <Card subtitle={t('navSection.app')} title="Preferences">
          <Row icon="bolt" color="var(--purple)" title={t('profile.bedroomMode')} sub="Founder's dark theme"><Toggle on={toggles.theme} onClick={() => toggle('theme')} /></Row>
          <Row icon="globe" color="var(--amber)" title={t('profile.language')} sub={currentLocale?.nativeLabel ?? 'English'}>
            <button
              onClick={() => setLangOpen(v => !v)}
              style={{ background: 'var(--surface-3)', border: '1.5px solid var(--border-2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}
            >
              {currentLocale?.nativeLabel ?? 'EN'}
            </button>
          </Row>
          {langOpen && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 0 10px', borderBottom: '1px solid var(--border-3)' }}>
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code as Locale); setLangOpen(false); }}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: locale === l.code ? '2px solid var(--ink)' : '1.5px solid var(--border-2)',
                    background: locale === l.code ? 'var(--accent)' : 'var(--surface-3)',
                    color: locale === l.code ? 'var(--ink)' : 'var(--text-dim)',
                    fontFamily: 'var(--body)', fontSize: 12, fontWeight: locale === l.code ? 700 : 500,
                    cursor: 'pointer', boxShadow: locale === l.code ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {l.nativeLabel}
                </button>
              ))}
            </div>
          )}
          <Row icon="cog" color="var(--surface-3)" title={t('profile.privacyData')} last><Icon name="arrow-right" size={16} style={{ color: 'var(--text-mute)' }} /></Row>
        </Card>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: loggingOut ? 'var(--text-mute)' : 'var(--coral)', cursor: loggingOut ? 'not-allowed' : 'pointer' }}
        >
          <Icon name="logout" size={15} /> {loggingOut ? t('common.signingOut') : t('common.logOut')}
        </button>

        <button
          onClick={() => { setShowDeleteModal(true); setDeleteError(null); setDeletePassword(''); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', cursor: 'pointer', opacity: 0.7 }}
        >
          <Icon name="trash" size={13} /> {t('common.deleteAccount')}
        </button>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)', padding: 20 }}>
            <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, boxShadow: '6px 6px 0 var(--ink)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--coral)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                  <Icon name="trash" size={18} />
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{t('common.deleteAccount')}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)', marginTop: 1 }}>{t('common.cannotBeUndone')}</div>
                </div>
              </div>

              <p style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.5, margin: '0 0 16px' }}>
                Your profile, favourites, predictions, and votes will be permanently removed.
              </p>

              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--bg)', border: '2px solid var(--border-2)', borderRadius: 10, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
              />

              {deleteError && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--coral)', marginTop: 8 }}>{deleteError}</div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{ flex: 1, padding: 12, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, background: 'var(--surface-3)', border: '2px solid var(--border-2)', borderRadius: 10, color: 'var(--ink)', cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{ flex: 1, padding: 12, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, background: 'var(--coral)', border: '2px solid var(--ink)', borderRadius: 10, color: 'var(--ink)', cursor: deleting ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 var(--ink)' }}
                >
                  {deleting ? 'Deleting\u2026' : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em' }}>CURLYSPORTS.COM \u00b7 v2.4 \u00b7 MADE IN A BEDROOM</div>
      </div>
    </div>
  );
}
