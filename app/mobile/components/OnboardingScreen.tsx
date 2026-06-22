'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext';
import Button from './ui/Button';
import TeamCrest from './ui/TeamCrest';
import Chip from './ui/Chip';
import Icon from './ui/Icon';

const SPORTS = ['Football', 'Basketball', 'F1', 'Tennis', 'NFL', 'Cricket'];

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface OnboardingProps {
  onDone: (team: { code: string; name: string }) => void | Promise<void>;
}

interface RealTeam {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  logo: string | null;
}

type PickTeam = { code: string; name: string; logo: string | null };

// Well-known clubs shown in onboarding picker
const KNOWN_CLUBS = [
  'Manchester United','Arsenal','Manchester City','Liverpool','Chelsea','Tottenham Hotspur',
  'Barcelona','Real Madrid','Bayern Munich','Paris Saint-Germain',
  'Los Angeles Lakers','Boston Celtics','Golden State Warriors',
];

const STATIC_FALLBACK: PickTeam[] = [
  { code: 'mun', name: 'Man United', logo: null },
  { code: 'ars', name: 'Arsenal',    logo: null },
  { code: 'cit', name: 'Man City',   logo: null },
  { code: 'liv', name: 'Liverpool',  logo: null },
  { code: 'che', name: 'Chelsea',    logo: null },
  { code: 'tot', name: 'Tottenham',  logo: null },
  { code: 'bar', name: 'Barcelona',  logo: null },
  { code: 'rm',  name: 'Real Madrid',logo: null },
  { code: 'bay', name: 'Bayern',     logo: null },
  { code: 'psg', name: 'PSG',        logo: null },
  { code: 'lal', name: 'Lakers',     logo: null },
  { code: 'bos', name: 'Celtics',    logo: null },
];

export default function OnboardingScreen({ onDone }: OnboardingProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState<string | null>(null);
  const [sports, setSports] = useState<string[]>(['Football']);
  const [saving, setSaving] = useState(false);

  const toggleSport = (s: string) => setSports(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const { data: plData }  = useSWR<{ teams: RealTeam[] }>('/api/espn/teams?sport=football&league=eng.1',   fetcher, { revalidateOnFocus: false });
  const { data: laData }  = useSWR<{ teams: RealTeam[] }>('/api/espn/teams?sport=football&league=esp.1',   fetcher, { revalidateOnFocus: false });
  const { data: bunData } = useSWR<{ teams: RealTeam[] }>('/api/espn/teams?sport=football&league=ger.1',   fetcher, { revalidateOnFocus: false });
  const { data: fraData } = useSWR<{ teams: RealTeam[] }>('/api/espn/teams?sport=football&league=fra.1',   fetcher, { revalidateOnFocus: false });
  const { data: nbaData } = useSWR<{ teams: RealTeam[] }>('/api/espn/teams?sport=basketball&league=nba',   fetcher, { revalidateOnFocus: false });

  const allTeams = [
    ...(plData?.teams ?? []),
    ...(laData?.teams ?? []),
    ...(bunData?.teams ?? []),
    ...(fraData?.teams ?? []),
    ...(nbaData?.teams ?? []),
  ];

  const seen = new Set<string>();
  const realPickTeams: PickTeam[] = allTeams
    .filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return KNOWN_CLUBS.some(k => t.name.includes(k.split(' ').slice(-1)[0]) || k.includes(t.name));
    })
    .map(t => ({
      code: t.abbr.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4),
      name: t.shortName || t.name,
      logo: t.logo,
    }))
    .slice(0, 18);

  const displayTeams: PickTeam[] = realPickTeams.length >= 6 ? realPickTeams : STATIC_FALLBACK;

  const finish = async () => {
    const t = displayTeams.find(d => d.code === team);
    if (!t) return;
    setSaving(true);
    await onDone({ code: t.code, name: t.name });
    setSaving(false);
  };

  const firstName = profile?.name?.split(' ')[0] || profile?.username || 'there';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', paddingTop: 54 }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 20px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? 'var(--ink)' : 'var(--surface-3)', border: '1.5px solid var(--ink)' }} />
        ))}
      </div>

      {/* Step 0 — Welcome */}
      {step === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', gap: 4 }}>
          <div style={{ width: 92, height: 92, background: 'var(--lime)', borderRadius: 22, border: '2.5px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curlysports.com</div>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 38, lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '8px 0 0' }}>
            Hey, {firstName}.<br />Welcome in.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.5, margin: '14px 0 0', maxWidth: 300 }}>
            150+ leagues, the numbers that matter, and hot takes that come with receipts. Let&apos;s set you up.
          </p>
          <div style={{ marginTop: 32 }}>
            <Button variant="orange" size="lg" block onClick={() => setStep(1)}>Pick your team →</Button>
          </div>
        </div>
      )}

      {/* Step 1 — Pick team */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '24px 20px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>01 · Your club</div>
          <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '6px 0 18px' }}>Pick your team</h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 12 }}>
            {displayTeams.map(t => {
              const on = team === t.code;
              return (
                <button
                  key={t.code}
                  onClick={() => setTeam(t.code)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 6px', borderRadius: 14, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface)', border: '2px solid var(--ink)', boxShadow: on ? '4px 4px 0 var(--ink)' : 'var(--shadow-sm)', transform: on ? 'translate(-2px,-2px)' : 'none', transition: 'all .12s' }}
                >
                  <TeamCrest code={t.code} abbr={t.name.slice(0, 3).toUpperCase()} logoUrl={t.logo} size="lg" />
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.15 }}>{t.name}</span>
                </button>
              );
            })}
          </div>
          <div style={{ flexShrink: 0, padding: '12px 0 22px' }}>
            <Button variant="primary" size="lg" block disabled={!team} onClick={() => setStep(2)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Sports preferences */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>02 · Follow</div>
          <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '6px 0 8px' }}>What do you watch?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>We&apos;ll tune your scores, debates and alerts. Change it anytime.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {SPORTS.map(s => <Chip key={s} active={sports.includes(s)} onClick={() => toggleSport(s)}>{s}</Chip>)}
          </div>
          <div style={{ marginTop: 28, background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bell" size={20} style={{ color: 'var(--accent)' }} />
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--paper)' }}>Goal alerts on</div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,253,247,0.7)', lineHeight: 1.5, margin: '8px 0 0' }}>Get pinged the moment your team scores — and when a debate about them heats up.</p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ flexShrink: 0, padding: '12px 0 22px' }}>
            <Button variant="orange" size="lg" block disabled={saving} onClick={finish}>
              {saving ? 'Saving…' : 'Enter Curly →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
