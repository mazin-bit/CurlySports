'use client';
import React, { useState } from 'react';
import { DATA } from '../data';
import Button from './ui/Button';
import TeamCrest from './ui/TeamCrest';
import Chip from './ui/Chip';
import Icon from './ui/Icon';

const SPORTS = ['Football', 'Basketball', 'F1', 'Tennis', 'NFL', 'Cricket'];

interface OnboardingProps {
  onDone: (team: { code: string; name: string; first: string }) => void;
}

export default function OnboardingScreen({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState<string | null>(null);
  const [sports, setSports] = useState<string[]>(['Football']);
  const D = DATA;

  const toggleSport = (s: string) => setSports(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const finish = () => {
    const t = D.pickTeams.find(([c]) => c === team);
    onDone(t ? { code: t[0], name: t[1], first: 'Mazin' } : { code: 'mun', name: 'Man United', first: 'Mazin' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', paddingTop: 54 }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 20px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? 'var(--ink)' : 'var(--surface-3)', border: '1.5px solid var(--ink)' }} />
        ))}
      </div>

      {step === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', gap: 4 }}>
          <div style={{ width: 92, height: 92, background: 'var(--lime)', borderRadius: 22, border: '2.5px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 28 }}>
            <img src={D.mascot} alt="" style={{ width: '82%', height: '82%', objectFit: 'contain', transform: 'rotate(6deg)' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curly<span style={{ color: 'var(--orange)' }}>.</span>sports</div>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '8px 0 0' }}>Live scores.<br />Deep stats.<br />Real debates.</h1>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.5, margin: '16px 0 0', maxWidth: 300 }}>150+ leagues, the numbers that matter, and hot takes that come with receipts. Made in a bedroom.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
            <Button variant="orange" size="lg" block onClick={() => setStep(1)}>Get started →</Button>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-mute)', cursor: 'pointer', padding: 8 }}>I already have an account</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '24px 20px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>01 · Your club</div>
          <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '6px 0 18px' }}>Pick your team</h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingBottom: 12 }}>
            {D.pickTeams.map(([code, name]) => {
              const on = team === code;
              return (
                <button key={code} onClick={() => setTeam(code)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 6px', borderRadius: 14, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface)', border: '2px solid var(--ink)', boxShadow: on ? '4px 4px 0 var(--ink)' : 'var(--shadow-sm)', transform: on ? 'translate(-2px,-2px)' : 'none', transition: 'all .12s' }}>
                  <TeamCrest code={code} abbr={name.slice(0, 3).toUpperCase()} size="lg" />
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.15 }}>{name}</span>
                </button>
              );
            })}
          </div>
          <div style={{ flexShrink: 0, padding: '12px 0 22px' }}>
            <Button variant="primary" size="lg" block disabled={!team} onClick={() => setStep(2)}>Continue →</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>02 · Follow</div>
          <h2 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '6px 0 8px' }}>What do you watch?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>We'll tune your scores, debates and alerts. Change it anytime.</p>
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
          <div style={{ flexShrink: 0, padding: '12px 0 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="orange" size="lg" block onClick={finish}>Enter Curly →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
