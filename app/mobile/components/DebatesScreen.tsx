'use client';
import React, { useState } from 'react';
import { DATA } from '../data';
import type { DebatePost } from '../data';
import { useDebatesList } from './api';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';

interface DebatesProps {
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

export default function DebatesScreen({ onSearch, onBell, onOpenPlayer, unread }: DebatesProps) {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const D = DATA;

  // Fetch real debates from DB
  const { debates: realDebates } = useDebatesList();

  // Use first live debate from DB, fall back to mock
  const liveDebate = realDebates.find(d => d.isLive) ?? realDebates[0] ?? null;
  const debateQuestion = liveDebate?.question ?? 'Does Haaland go missing in big games?';
  const debateYesLabel = liveDebate?.optionA ?? 'YES';
  const debateNoLabel = liveDebate?.optionB ?? 'NO';
  const totalVotes = (liveDebate?._count?.votes ?? 2043) + (vote ? 1 : 0);
  const yesBase = liveDebate ? Math.round((liveDebate._count.votes * 0.6)) : 1240;
  const yesPct = vote
    ? Math.round(((yesBase + (vote === 'yes' ? 1 : 0)) / totalVotes) * 100)
    : Math.round((yesBase / (totalVotes || 1)) * 100);
  const noPct = 100 - yesPct;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      <Topbar title="Debates" subtitle="Bring receipts" logoSrc={D.mascot} onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />
      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Daily debate */}
        <Card style={{ background: 'var(--accent)', borderColor: 'var(--ink)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)', opacity: 0.7 }}>Today&apos;s debate</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '6px 0 12px', lineHeight: 1.1 }}>{debateQuestion}</div>
          {vote ? (
            <div>
              <div style={{ display: 'flex', height: 30, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--ink)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: `${yesPct}%`, background: 'var(--ink)', color: 'var(--accent)', display: 'flex', alignItems: 'center', paddingLeft: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>{debateYesLabel} {yesPct}%</div>
                <div style={{ flex: 1, background: 'var(--surface)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>{debateNoLabel} {noPct}%</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink)', opacity: 0.6, marginTop: 8 }}>You voted {vote.toUpperCase()} · {totalVotes.toLocaleString()} votes</div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setVote('yes')} style={voteBtn(true)}>Vote {debateYesLabel}</button>
              <button onClick={() => setVote('no')} style={voteBtn(false)}>Vote {debateNoLabel}</button>
            </div>
          )}
        </Card>

        {/* Debate posts — use real debates as posts if available, else mock */}
        {realDebates.length > 1
          ? realDebates.slice(1, 6).map(d => (
            <Card key={d.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, border: '2px solid var(--ink)', flexShrink: 0 }}>
                  {d.question.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{d.sport ?? 'Sports'} Debate</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{d._count.votes} votes</div>
                </div>
                <Badge tone="accent">{d.optionA}</Badge>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>{d.question}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', color: 'var(--ink)' }} onClick={() => onOpenPlayer()}>
                  <Icon name="bolt" size={12} /> {d.optionA}
                </Badge>
                <Badge style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', color: 'var(--ink)' }} onClick={() => onOpenPlayer()}>
                  <Icon name="spark" size={12} /> {d.optionB}
                </Badge>
              </div>
            </Card>
          ))
          : D.debates.map(p => <DebatePostCard key={p.id} p={p} onOpenPlayer={() => onOpenPlayer()} />)
        }
      </div>

      {/* Composer pinned above bottom nav */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 78, padding: '0 14px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 999, padding: 6, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--lime)', border: '2px solid var(--ink)', overflow: 'hidden', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={D.mascot} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <input placeholder="Drop your take… stats auto-attach" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--body)' }} />
          <button style={{ background: 'var(--orange)', color: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 999, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Post</button>
        </div>
      </div>
    </div>
  );
}

function voteBtn(primary: boolean): React.CSSProperties {
  return { flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', border: '2px solid var(--ink)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, background: primary ? 'var(--ink)' : 'var(--surface)', color: primary ? 'var(--accent)' : 'var(--ink)', boxShadow: 'var(--shadow-sm)' };
}

function DebatePostCard({ p, onOpenPlayer }: { p: DebatePost; onOpenPlayer: () => void }) {
  const [up, setUp] = useState(false);
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.avaTone === 'orange' ? 'var(--orange)' : 'var(--ink)', color: p.avaTone === 'orange' ? 'var(--paper)' : 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, border: '2px solid var(--ink)' }}>{p.ava}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
            {p.author}
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}><Icon name="check" size={9} strokeWidth={4} /></span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{p.handle} · {p.time} ago</div>
        </div>
        <Badge tone={p.against ? 'mute' : 'accent'} style={p.against ? { background: 'var(--surface-3)' } : undefined}>{p.stance} · {p.pct}%</Badge>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>{p.text}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {p.evidence.map(([k, v]) => (
          <div key={k} onClick={onOpenPlayer} style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)' }}>
        <span onClick={() => setUp(!up)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: up ? 'var(--orange)' : 'var(--text-mute)' }}><Icon name="arrow-up" size={14} /> {p.up + (up ? 1 : 0)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="chat" size={14} /> {p.replies}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="share" size={14} /></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}><Icon name="bookmark" size={14} /></span>
      </div>
    </Card>
  );
}
