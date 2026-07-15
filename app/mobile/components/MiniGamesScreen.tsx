'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonTableRow, SkeletonList } from './ui/Skeletons';
import AdSlot from './ui/AdSlot';
import { QUIZ_DATA } from '@/app/mini-games/quiz-data';
import { PLAYER_GUESSES } from '@/app/mini-games/player-guess-data';

/* ── Helpers ────────────────────────────────────────────────── */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(sport: string, count = 10) {
  const pool = QUIZ_DATA[sport] ?? QUIZ_DATA.football;
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}

/* ── Score Predictor data ────────────────────────────────────── */

const PREDICT_MATCHES: Record<string, { home: string; away: string; league: string }[]> = {
  football: [
    { home: "Arsenal", away: "Man City", league: "Premier League" },
    { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
    { home: "Bayern", away: "Dortmund", league: "Bundesliga" },
  ],
  basketball: [{ home: "Lakers", away: "Celtics", league: "NBA" }, { home: "Warriors", away: "Heat", league: "NBA" }],
  nfl: [{ home: "Chiefs", away: "Eagles", league: "NFL" }, { home: "49ers", away: "Cowboys", league: "NFL" }],
  cricket: [{ home: "India", away: "Australia", league: "Test Series" }, { home: "England", away: "Pakistan", league: "T20" }],
  tennis: [{ home: "Djokovic", away: "Alcaraz", league: "ATP Final" }],
  f1: [{ home: "Verstappen", away: "Hamilton", league: "F1 Race" }],
  baseball: [{ home: "Yankees", away: "Dodgers", league: "MLB" }],
  mma: [{ home: "Jones", away: "Miocic", league: "UFC" }],
  golf: [{ home: "McIlroy", away: "Scheffler", league: "PGA Tour" }],
  hockey: [{ home: "Maple Leafs", away: "Canadiens", league: "NHL" }],
};

async function submitScore(game_type: string, sport: string, score: number) {
  try {
    await fetch('/api/game-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game_type, sport, score }) });
  } catch { /* ignore */ }
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ── Quiz Game (uses 306 questions from shared pool) ────────── */

const QUIZ_TIME = 15;

function QuizGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const [questions] = useState(() => pickQuestions(sport, 10));
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const advanceRef = useRef<() => void>(() => {});

  const current = questions[qIdx];
  const advance = () => {
    clearInterval(timerRef.current);
    if (qIdx + 1 >= questions.length) setDone(true);
    else { setQIdx(q => q + 1); setSelected(null); setTimeLeft(QUIZ_TIME); }
  };
  advanceRef.current = advance;

  useEffect(() => {
    if (selected !== null || done) return;
    let localTime = QUIZ_TIME;
    timerRef.current = setInterval(() => {
      localTime -= 1;
      setTimeLeft(localTime);
      if (localTime <= 0) { clearInterval(timerRef.current); setSelected(-1); setTimeout(() => advanceRef.current(), 1400); }
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, done, qIdx]);

  useEffect(() => {
    if (done && !submitted) { setSubmitted(true); submitScore('quiz', sport, score).then(() => onComplete(score)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const pick = (i: number) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(i);
    if (i === current.answer) { const bonus = timeLeft > 10 ? 5 : timeLeft > 5 ? 3 : 0; setScore(s => s + 10 + bonus); }
    setTimeout(() => advanceRef.current(), 1200);
  };

  const restart = () => { setQIdx(0); setScore(0); setSelected(null); setDone(false); setTimeLeft(QUIZ_TIME); setSubmitted(false); };

  if (done) {
    const pct = Math.round((score / (questions.length * 10)) * 100);
    return (
      <Card style={{ background: 'var(--accent)', borderColor: 'var(--ink)', textAlign: 'center', padding: 24 }}>
        <div style={{ marginBottom: 8 }}><Icon name="trophy" size={28} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>Quiz Complete!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--ink)', marginBottom: 4 }}>{score} pts</div>
        <div style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.7, marginBottom: 16 }}>
          {pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Not bad!' : 'Keep learning!'}
        </div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  if (!current) return null;
  const timerColor = timeLeft <= 5 ? 'var(--coral)' : timeLeft <= 10 ? 'var(--orange)' : 'var(--accent)';

  return (
    <Card>
      <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(qIdx / questions.length) * 100}%`, background: 'var(--accent)', transition: 'width .3s' }} />
      </div>
      <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(timeLeft / QUIZ_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear, background .3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
        <span>Q{qIdx + 1} / {questions.length}</span>
        <span style={{ color: timerColor, fontWeight: 700 }}>{timeLeft}s</span>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{score} pts</span>
      </div>
      {'difficulty' in current && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, marginBottom: 8, display: 'inline-block', background: current.difficulty === 'easy' ? 'rgba(34,197,94,0.15)' : current.difficulty === 'medium' ? 'rgba(255,183,77,0.15)' : 'rgba(239,68,68,0.15)', color: current.difficulty === 'easy' ? '#22c55e' : current.difficulty === 'medium' ? 'var(--orange)' : 'var(--coral)', border: `1px solid ${current.difficulty === 'easy' ? '#22c55e44' : current.difficulty === 'medium' ? '#ffb74d44' : '#ef444444'}` }}>{current.difficulty}</span>
      )}
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 16 }}>{current.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {current.options.map((opt, i) => {
          let bg = 'var(--surface-2)', border = 'var(--border-2)', color = 'var(--ink)';
          if (selected !== null) {
            if (i === current.answer) { bg = 'var(--accent)'; border = 'var(--ink)'; }
            else if (i === selected && i !== current.answer) { bg = 'var(--coral)'; border = 'var(--coral)'; color = 'var(--paper)'; }
          }
          return (
            <button key={i} onClick={() => pick(i)} disabled={selected !== null}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `2px solid ${border}`, background: bg, color, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: selected !== null ? 'default' : 'pointer', textAlign: 'start' }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(0,0,0,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11 }}>{['A','B','C','D'][i]}</span>
              {opt}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Player Guess ─────────────────────────────────────────────── */

function PlayerGuessGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const allPlayers = PLAYER_GUESSES[sport] ?? PLAYER_GUESSES.football;
  const [players] = useState(() => shuffleArray(allPlayers).slice(0, Math.min(5, allPlayers.length)));
  const [pIdx, setPIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const current = players[pIdx];
  const maxClues = current?.clues.length ?? 0;
  const pointsForCorrect = Math.max(5, 40 - (cluesShown - 1) * 10);

  const advance = () => {
    setTimeout(() => {
      if (pIdx + 1 >= players.length) setDone(true);
      else { setPIdx(p => p + 1); setCluesShown(1); setGuess(''); setResult(null); }
    }, 2000);
  };

  const submit = () => {
    if (!guess.trim() || result !== null) return;
    const g = guess.toLowerCase().trim();
    const a = current.answer.toLowerCase();
    const isCorrect = a.split(' ').some(w => w.length > 3 && g.includes(w)) || g === a;
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setTotalScore(s => s + pointsForCorrect);
    advance();
  };

  const restart = () => { setPIdx(0); setCluesShown(1); setGuess(''); setResult(null); setTotalScore(0); setDone(false); setSubmitted(false); };

  useEffect(() => {
    if (done && !submitted) { setSubmitted(true); submitScore('player_guess', sport, totalScore).then(() => onComplete(totalScore)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    return (
      <Card style={{ background: 'var(--ink)', borderColor: 'var(--ink)', textAlign: 'center', padding: 24 }}>
        <div style={{ marginBottom: 8 }}><Icon name="search" size={28} style={{ color: 'var(--accent)' }} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--paper)', marginBottom: 4 }}>All Players!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--accent)', marginBottom: 12 }}>{totalScore} pts</div>
        <button onClick={restart} style={{ background: 'var(--accent)', color: 'var(--ink)', border: '2px solid var(--accent)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  if (!current) return null;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
        <span>Player {pIdx + 1} / {players.length}</span>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{totalScore} pts</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {current.clues.slice(0, cluesShown).map((clue, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', borderRadius: 9 }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{clue}</span>
          </div>
        ))}
      </div>
      {result === null && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {cluesShown < maxClues && (
            <button onClick={() => setCluesShown(n => n + 1)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '2px solid var(--border-2)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Reveal clue {cluesShown + 1} <span style={{ opacity: 0.5 }}>(-10 pts)</span>
            </button>
          )}
          <button onClick={() => { setResult('wrong'); advance(); }} style={{ padding: '9px 14px', borderRadius: 9, border: '2px solid var(--border-2)', background: 'transparent', color: 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Skip</button>
        </div>
      )}
      {result === null && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Who is this player?"
            style={{ flex: 1, border: '2px solid var(--border-2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--body)' }}
          />
          <button onClick={submit} disabled={!guess.trim()} style={{ padding: '10px 18px', borderRadius: 10, border: '2px solid var(--ink)', background: guess.trim() ? 'var(--ink)' : 'var(--surface-3)', color: guess.trim() ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: guess.trim() ? 'pointer' : 'not-allowed' }}>Guess</button>
        </div>
      )}
      {result === 'correct' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e', borderRadius: 10, color: '#22c55e', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
          <Icon name="check" size={16} /> Correct! +{pointsForCorrect} pts — {current.answer}
        </div>
      )}
      {result === 'wrong' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '2px solid var(--coral)', borderRadius: 10, color: 'var(--coral)', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
          <Icon name="close" size={16} /> The answer was <span style={{ color: 'var(--ink)' }}>{current.answer}</span>
        </div>
      )}
    </Card>
  );
}

/* ── Score Predictor ──────────────────────────────────────────── */

function PredictorGame({ sport }: { sport: string }) {
  const matches = PREDICT_MATCHES[sport] ?? PREDICT_MATCHES.football;
  const [preds, setPreds] = useState(() => matches.map(() => ({ home: 0, away: 0 })));
  const [submitted, setSubmitted] = useState(false);

  const update = (idx: number, side: 'home' | 'away', val: number) => {
    setPreds(p => p.map((pred, i) => i === idx ? { ...pred, [side]: Math.max(0, Math.min(20, val)) } : pred));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {matches.map((m, idx) => (
        <Card key={idx}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{m.league}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'end' }}>{m.home}</span>
            <input type="number" min="0" max="20" value={preds[idx].home} onChange={e => update(idx, 'home', parseInt(e.target.value) || 0)} disabled={submitted}
              style={{ width: 44, textAlign: 'center', border: '2px solid var(--border-2)', borderRadius: 8, padding: '7px 0', fontSize: 16, fontWeight: 800, background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)' }}>VS</span>
            <input type="number" min="0" max="20" value={preds[idx].away} onChange={e => update(idx, 'away', parseInt(e.target.value) || 0)} disabled={submitted}
              style={{ width: 44, textAlign: 'center', border: '2px solid var(--border-2)', borderRadius: 8, padding: '7px 0', fontSize: 16, fontWeight: 800, background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{m.away}</span>
          </div>
        </Card>
      ))}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)} style={{ padding: '14px 0', background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit Predictions</button>
      ) : (
        <Card style={{ background: 'var(--accent)', borderColor: 'var(--ink)' }}>
          <div style={{ textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Predictions locked in! Check back after the matches.</div>
        </Card>
      )}
    </div>
  );
}

/* ── Penalty Kick Game (Football) ────────────────────────────── */

type PKResult = 'goal' | 'saved' | 'keeper_save' | 'keeper_goal' | null;
const KEEPER_ZONES = [0, 1, 2, 3, 4, 5]; // TL TC TR BL BC BR

function PenaltyKickGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<'shoot' | 'save' | 'done'>('shoot');
  const [round, setRound] = useState(0);
  const [playerGoals, setPlayerGoals] = useState(0);
  const [botGoals, setBotGoals] = useState(0);
  const [shootHistory, setShootHistory] = useState<('goal' | 'miss' | 'saved')[]>([]);
  const [saveHistory, setSaveHistory] = useState<('goal' | 'save' | 'miss')[]>([]);
  const [lastResult, setLastResult] = useState<PKResult>(null);
  const [shotZone, setShotZone] = useState<number | null>(null);
  const [keeperZone, setKeeperZone] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const totalRounds = 5;

  const handleShoot = (zone: number) => {
    if (waiting || phase !== 'shoot') return;
    setWaiting(true);
    const kZone = KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)];
    setShotZone(zone); setKeeperZone(kZone);
    const scored = zone !== kZone;
    if (scored) { setPlayerGoals(g => g + 1); setShootHistory(h => [...h, 'goal']); setLastResult('goal'); }
    else { setShootHistory(h => [...h, 'saved']); setLastResult('saved'); }
    setTimeout(() => {
      setShotZone(null); setKeeperZone(null); setLastResult(null);
      if (round + 1 >= totalRounds) { setPhase('save'); setRound(0); }
      else setRound(r => r + 1);
      setWaiting(false);
    }, 1400);
  };

  const handleSave = (zone: number) => {
    if (waiting || phase !== 'save') return;
    setWaiting(true);
    const botShot = KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)];
    setShotZone(botShot); setKeeperZone(zone);
    const saved = zone === botShot;
    if (saved) { setSaveHistory(h => [...h, 'save']); setLastResult('keeper_save'); }
    else { setBotGoals(g => g + 1); setSaveHistory(h => [...h, 'goal']); setLastResult('keeper_goal'); }
    setTimeout(() => {
      setShotZone(null); setKeeperZone(null); setLastResult(null);
      if (round + 1 >= totalRounds) setPhase('done');
      else setRound(r => r + 1);
      setWaiting(false);
    }, 1400);
  };

  useEffect(() => {
    if (phase === 'done' && !submitted) {
      setSubmitted(true);
      const saves = saveHistory.filter(s => s === 'save').length;
      const totalScore = playerGoals * 10 + saves * 10;
      submitScore('sport_game', 'football', totalScore).then(() => onComplete(totalScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const restart = () => {
    setPhase('shoot'); setRound(0); setPlayerGoals(0); setBotGoals(0);
    setShootHistory([]); setSaveHistory([]); setLastResult(null);
    setShotZone(null); setKeeperZone(null); setSubmitted(false); setWaiting(false);
  };

  if (phase === 'done') {
    const saves = saveHistory.filter(s => s === 'save').length;
    const totalScore = playerGoals * 10 + saves * 10;
    const won = playerGoals > botGoals;
    const draw = playerGoals === botGoals;
    return (
      <Card style={{ textAlign: 'center', padding: 24, background: won ? 'rgba(34,197,94,0.08)' : 'var(--surface)' }}>
        <div style={{ marginBottom: 8 }}><Icon name="spark" size={28} style={{ color: won ? '#22c55e' : 'var(--coral)' }} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{won ? 'You Win!' : draw ? "It's a Draw!" : 'You Lose!'}</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--ink)', margin: '4px 0' }}>{playerGoals} - {botGoals}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>{playerGoals} goals scored, {saves} saves made — {totalScore} pts</div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  const zoneLabels = ['TL', 'TC', 'TR', 'BL', 'BC', 'BR'];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontFamily: 'var(--mono)', fontSize: 11 }}>
        <span style={{ color: 'var(--text-mute)' }}>{phase === 'shoot' ? 'Shooting' : 'Saving'} — Kick {round + 1}/{totalRounds}</span>
        <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{playerGoals}</span> <span style={{ color: 'var(--text-mute)' }}>vs</span> <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{botGoals}</span></span>
      </div>
      <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-dim)', marginBottom: 14, textAlign: 'center' }}>
        {phase === 'shoot' ? 'Tap a zone to shoot!' : 'Tap where you think they will shoot!'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12, padding: '12px', background: 'var(--surface-2)', borderRadius: 12, border: '2px solid var(--border-2)' }}>
        {[0, 1, 2, 3, 4, 5].map(z => {
          let bg = 'var(--surface-3)';
          let borderColor = 'var(--border-2)';
          let textColor = 'var(--text-mute)';
          if (shotZone === z && keeperZone === z) { bg = 'var(--orange)'; borderColor = 'var(--ink)'; textColor = 'var(--ink)'; }
          else if (shotZone === z) { bg = 'var(--accent)'; borderColor = 'var(--ink)'; textColor = 'var(--ink)'; }
          else if (keeperZone === z) { bg = 'var(--coral)'; borderColor = 'var(--coral)'; textColor = 'white'; }
          return (
            <button key={z} onClick={() => phase === 'shoot' ? handleShoot(z) : handleSave(z)} disabled={waiting}
              style={{ padding: '16px 0', borderRadius: 8, border: `2px solid ${borderColor}`, background: bg, cursor: waiting ? 'not-allowed' : 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: textColor, transition: 'all 0.2s' }}
            >
              {zoneLabels[z]}
            </button>
          );
        })}
      </div>
      {lastResult && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, padding: '8px 0', color: lastResult === 'goal' || lastResult === 'keeper_save' ? '#22c55e' : 'var(--coral)' }}>
          {lastResult === 'goal' && 'GOAL! +10 pts'}
          {lastResult === 'saved' && 'Saved by the keeper!'}
          {lastResult === 'keeper_save' && 'Great save! +10 pts'}
          {lastResult === 'keeper_goal' && 'Goal conceded!'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
        {(phase === 'shoot' ? shootHistory : saveHistory).map((r, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: r === 'goal' ? 'var(--accent)' : r === 'save' ? '#22c55e' : 'var(--coral)', border: '1px solid var(--ink)' }} />
        ))}
        {Array.from({ length: totalRounds - (phase === 'shoot' ? shootHistory.length : saveHistory.length) }).map((_, i) => (
          <div key={`e-${i}`} style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)', border: '1px solid var(--border-2)' }} />
        ))}
      </div>
    </Card>
  );
}

/* ── Super Over Game (Cricket) ────────────────────────────────── */

type ShotType = 'defensive' | 'normal' | 'aggressive' | 'slog';
type DeliveryType = 'good_length' | 'short' | 'yorker' | 'full_toss';

const SHOTS: { type: ShotType; label: string; risk: string }[] = [
  { type: 'defensive', label: 'Defensive', risk: 'Safe - 0-2 runs' },
  { type: 'normal', label: 'Normal', risk: 'Balanced - 1-4 runs' },
  { type: 'aggressive', label: 'Aggressive', risk: 'Risky - 0-6 runs' },
  { type: 'slog', label: 'Slog Sweep', risk: 'High risk - W or 4-6' },
];

const DELIVERIES: DeliveryType[] = ['good_length', 'short', 'yorker', 'full_toss'];

function getOutcome(shot: ShotType, delivery: DeliveryType): { runs: number; isWicket: boolean } {
  const rand = Math.random();
  const matrix: Record<ShotType, Record<DeliveryType, () => { runs: number; isWicket: boolean }>> = {
    defensive: {
      good_length: () => ({ runs: rand < 0.6 ? 0 : rand < 0.9 ? 1 : 2, isWicket: rand > 0.97 }),
      short: () => ({ runs: rand < 0.4 ? 0 : rand < 0.8 ? 1 : 2, isWicket: rand > 0.95 }),
      yorker: () => ({ runs: rand < 0.7 ? 0 : 1, isWicket: rand > 0.92 }),
      full_toss: () => ({ runs: rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3, isWicket: false }),
    },
    normal: {
      good_length: () => ({ runs: rand < 0.3 ? 0 : rand < 0.6 ? 1 : rand < 0.85 ? 2 : 4, isWicket: rand > 0.9 }),
      short: () => ({ runs: rand < 0.2 ? 0 : rand < 0.5 ? 1 : rand < 0.8 ? 4 : 6, isWicket: rand > 0.85 }),
      yorker: () => ({ runs: rand < 0.5 ? 0 : rand < 0.8 ? 1 : 2, isWicket: rand > 0.88 }),
      full_toss: () => ({ runs: rand < 0.2 ? 2 : rand < 0.6 ? 4 : 6, isWicket: rand > 0.95 }),
    },
    aggressive: {
      good_length: () => ({ runs: rand < 0.3 ? 0 : rand < 0.5 ? 2 : rand < 0.75 ? 4 : 6, isWicket: rand > 0.78 }),
      short: () => ({ runs: rand < 0.2 ? 0 : rand < 0.5 ? 4 : 6, isWicket: rand > 0.72 }),
      yorker: () => ({ runs: rand < 0.4 ? 0 : rand < 0.7 ? 1 : 4, isWicket: rand > 0.75 }),
      full_toss: () => ({ runs: rand < 0.1 ? 2 : rand < 0.4 ? 4 : 6, isWicket: rand > 0.9 }),
    },
    slog: {
      good_length: () => ({ runs: rand < 0.4 ? 0 : rand < 0.6 ? 4 : 6, isWicket: rand > 0.6 }),
      short: () => ({ runs: rand < 0.3 ? 0 : rand < 0.5 ? 4 : 6, isWicket: rand > 0.55 }),
      yorker: () => ({ runs: rand < 0.5 ? 0 : rand < 0.7 ? 2 : 6, isWicket: rand > 0.5 }),
      full_toss: () => ({ runs: rand < 0.15 ? 2 : rand < 0.45 ? 4 : 6, isWicket: rand > 0.7 }),
    },
  };
  return matrix[shot][delivery]();
}

function SuperOverGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<'bat' | 'bowl' | 'done'>('bat');
  const [ball, setBall] = useState(0);
  const [playerRuns, setPlayerRuns] = useState(0);
  const [playerWickets, setPlayerWickets] = useState(0);
  const [botRuns, setBotRuns] = useState(0);
  const [botWickets, setBotWickets] = useState(0);
  const [ballResults, setBallResults] = useState<string[]>([]);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const totalBalls = 6;

  const playBatShot = (shot: ShotType) => {
    if (waiting) return;
    setWaiting(true);
    const delivery = DELIVERIES[Math.floor(Math.random() * DELIVERIES.length)];
    const outcome = getOutcome(shot, delivery);
    if (outcome.isWicket) {
      setPlayerWickets(w => w + 1);
      setBallResults(r => [...r, 'W']);
      setLastOutcome('WICKET! Out!');
      if (playerWickets + 1 >= 3) {
        setTimeout(() => { setPhase('bowl'); setBall(0); setBallResults([]); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    } else {
      setPlayerRuns(s => s + outcome.runs);
      setBallResults(r => [...r, String(outcome.runs)]);
      setLastOutcome(outcome.runs === 6 ? 'SIX!' : outcome.runs === 4 ? 'FOUR!' : outcome.runs === 0 ? 'Dot ball' : `${outcome.runs} run${outcome.runs > 1 ? 's' : ''}`);
    }
    setTimeout(() => {
      setLastOutcome(null);
      if (ball + 1 >= totalBalls) { setPhase('bowl'); setBall(0); setBallResults([]); }
      else setBall(b => b + 1);
      setWaiting(false);
    }, 1200);
  };

  const playBowl = (bowlType: ShotType) => {
    if (waiting) return;
    setWaiting(true);
    const botShot: ShotType = (['defensive', 'normal', 'aggressive', 'slog'] as ShotType[])[Math.floor(Math.random() * 4)];
    const deliveryMap: Record<ShotType, DeliveryType> = { defensive: 'good_length', normal: 'good_length', aggressive: 'yorker', slog: 'short' };
    const outcome = getOutcome(botShot, deliveryMap[bowlType]);
    if (outcome.isWicket) {
      setBotWickets(w => w + 1);
      setBallResults(r => [...r, 'W']);
      setLastOutcome('WICKET! Got them!');
      if (botWickets + 1 >= 3) {
        setTimeout(() => { setPhase('done'); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    } else {
      setBotRuns(s => s + outcome.runs);
      setBallResults(r => [...r, String(outcome.runs)]);
      setLastOutcome(outcome.runs === 6 ? 'SIX conceded!' : outcome.runs === 4 ? 'FOUR conceded!' : outcome.runs === 0 ? 'Dot ball!' : `${outcome.runs} run${outcome.runs > 1 ? 's' : ''} conceded`);
      if (botRuns + outcome.runs > playerRuns) {
        setTimeout(() => { setPhase('done'); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    }
    setTimeout(() => {
      setLastOutcome(null);
      if (ball + 1 >= totalBalls) setPhase('done');
      else setBall(b => b + 1);
      setWaiting(false);
    }, 1200);
  };

  useEffect(() => {
    if (phase === 'done' && !submitted) {
      setSubmitted(true);
      const won = playerRuns > botRuns;
      const totalScore = playerRuns + (won ? 20 : 0) + (3 - Math.min(3, botWickets)) * 5;
      submitScore('sport_game', 'cricket', totalScore).then(() => onComplete(totalScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const restart = () => {
    setPhase('bat'); setBall(0); setPlayerRuns(0); setPlayerWickets(0);
    setBotRuns(0); setBotWickets(0); setBallResults([]); setLastOutcome(null);
    setSubmitted(false); setWaiting(false);
  };

  if (phase === 'done') {
    const won = playerRuns > botRuns;
    const draw = playerRuns === botRuns;
    const totalScore = playerRuns + (won ? 20 : 0) + (3 - Math.min(3, botWickets)) * 5;
    return (
      <Card style={{ textAlign: 'center', padding: 24, background: won ? 'rgba(34,197,94,0.08)' : 'var(--surface)' }}>
        <div style={{ marginBottom: 8 }}><Icon name="spark" size={28} style={{ color: won ? '#22c55e' : 'var(--coral)' }} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{won ? 'You Win!' : draw ? 'Super Over Tied!' : 'You Lose!'}</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 32, color: 'var(--ink)', margin: '4px 0' }}>{playerRuns}/{playerWickets} vs {botRuns}/{botWickets}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>{totalScore} pts earned</div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  const bowlLabels: { type: ShotType; label: string; risk: string }[] = [
    { type: 'defensive', label: 'Good Length', risk: 'Tight line' },
    { type: 'normal', label: 'Short Ball', risk: 'Bouncer' },
    { type: 'aggressive', label: 'Yorker', risk: 'Death bowling' },
    { type: 'slog', label: 'Slower Ball', risk: 'Variation' },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1.5px solid var(--border-2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)' }}>You</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{playerRuns}<span style={{ fontSize: 12, color: 'var(--text-mute)' }}>/{playerWickets}</span></div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)' }}>vs</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)' }}>Bot</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{botRuns}<span style={{ fontSize: 12, color: 'var(--text-mute)' }}>/{botWickets}</span></div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, textAlign: 'center' }}>
        {phase === 'bat' ? 'Your Batting — Pick a shot!' : 'Your Bowling — Pick a delivery!'} (Ball {ball + 1}/{totalBalls})
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
        {ballResults.map((r, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, background: r === 'W' ? 'var(--coral)' : 'var(--accent)', color: r === 'W' ? 'white' : 'var(--ink)', border: '1.5px solid var(--ink)' }}>{r}</div>
        ))}
        {ball < totalBalls && <div style={{ width: 24, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, background: 'var(--orange)', color: 'var(--ink)', border: '1.5px solid var(--ink)' }}>{ball + 1}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(phase === 'bat' ? SHOTS : bowlLabels).map(s => (
          <button key={s.type} onClick={() => phase === 'bat' ? playBatShot(s.type) : playBowl(s.type)} disabled={waiting}
            style={{ padding: '12px 8px', borderRadius: 10, border: '2px solid var(--border-2)', background: 'var(--surface)', cursor: waiting ? 'not-allowed' : 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>{s.risk}</div>
          </button>
        ))}
      </div>
      {lastOutcome && (
        <div style={{ textAlign: 'center', marginTop: 10, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 8, color: lastOutcome.includes('SIX') || lastOutcome.includes('FOUR') || lastOutcome.includes('Got them') ? '#22c55e' : lastOutcome.includes('WICKET') || lastOutcome.includes('conceded') ? 'var(--coral)' : 'var(--ink)', background: lastOutcome.includes('SIX') || lastOutcome.includes('FOUR') || lastOutcome.includes('Got them') ? 'rgba(34,197,94,0.1)' : lastOutcome.includes('WICKET') || lastOutcome.includes('conceded') ? 'rgba(239,68,68,0.08)' : 'var(--surface-2)' }}>
          {lastOutcome}
        </div>
      )}
    </Card>
  );
}

/* ── Free Throw Game (Basketball) ────────────────────────────── */

function FreeThrowGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [meterPos, setMeterPos] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [result, setResult] = useState<'made' | 'missed' | null>(null);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(true);
  const meterRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const dirRef = useRef(1);

  const totalAttempts = 10;
  const sweetMin = 40;
  const sweetMax = 60;

  useEffect(() => {
    if (done || !running) return;
    dirRef.current = 1;
    let pos = 0;
    meterRef.current = setInterval(() => {
      pos += dirRef.current * 2.5;
      if (pos >= 100) { pos = 100; dirRef.current = -1; }
      if (pos <= 0) { pos = 0; dirRef.current = 1; }
      setMeterPos(pos);
    }, 25);
    return () => clearInterval(meterRef.current);
  }, [done, running, attempt]);

  const shoot = () => {
    if (shooting || done) return;
    clearInterval(meterRef.current);
    setShooting(true); setRunning(false);
    const made = meterPos >= sweetMin && meterPos <= sweetMax;
    setResult(made ? 'made' : 'missed');
    if (made) setScore(s => s + 10);
    setResults(r => [...r, made]);
    setTimeout(() => {
      if (attempt + 1 >= totalAttempts) setDone(true);
      else { setAttempt(a => a + 1); setShooting(false); setResult(null); setRunning(true); }
    }, 1200);
  };

  useEffect(() => {
    if (done && !submitted) { setSubmitted(true); submitScore('sport_game', 'basketball', score).then(() => onComplete(score)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const restart = () => {
    setAttempt(0); setScore(0); setResults([]);
    setMeterPos(0); setShooting(false); setResult(null);
    setDone(false); setSubmitted(false); setRunning(true);
  };

  if (done) {
    const made = results.filter(Boolean).length;
    return (
      <Card style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ marginBottom: 8 }}><Icon name="spark" size={28} style={{ color: 'var(--orange)' }} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>Free Throws Complete!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--ink)', margin: '4px 0' }}>{made}/{totalAttempts}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
          {made >= 9 ? 'Clutch shooter!' : made >= 7 ? 'Solid from the line!' : made >= 5 ? 'Decent shooting!' : 'Need more practice!'} {score} pts
        </div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontFamily: 'var(--mono)', fontSize: 11 }}>
        <span style={{ color: 'var(--text-mute)' }}>Shot {attempt + 1} / {totalAttempts}</span>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{score} pts</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Icon name="spark" size={32} style={{ color: result === 'made' ? '#22c55e' : result === 'missed' ? 'var(--coral)' : 'var(--orange)' }} />
      </div>
      {/* Timing meter */}
      <div onClick={shoot} style={{ position: 'relative', height: 24, background: 'var(--surface-3)', borderRadius: 12, border: '2px solid var(--border-2)', overflow: 'hidden', marginBottom: 12, cursor: 'pointer' }}>
        <div style={{ position: 'absolute', left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%`, height: '100%', background: 'rgba(34,197,94,0.15)', borderLeft: '2px solid #22c55e', borderRight: '2px solid #22c55e' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${meterPos}%`, background: meterPos >= sweetMin && meterPos <= sweetMax ? '#22c55e' : 'var(--coral)', transition: 'background 0.1s', borderRadius: 10 }} />
        <div style={{ position: 'absolute', left: `${meterPos}%`, top: -2, width: 4, height: 28, background: 'var(--ink)', borderRadius: 2, transform: 'translateX(-2px)' }} />
      </div>
      <button onClick={shoot} disabled={shooting} style={{ width: '100%', padding: '14px 0', background: shooting ? 'var(--surface-3)' : 'var(--ink)', color: shooting ? 'var(--text-mute)' : 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, cursor: shooting ? 'not-allowed' : 'pointer', letterSpacing: '0.08em' }}>
        {shooting ? (result === 'made' ? 'Swish!' : 'Clank!') : 'SHOOT'}
      </button>
      {result && (
        <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: result === 'made' ? '#22c55e' : 'var(--coral)' }}>
          {result === 'made' ? 'Nothing but net! +10 pts' : 'Off the rim!'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
        {results.map((r, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: r ? '#22c55e' : 'var(--coral)', border: '1px solid var(--ink)' }} />
        ))}
        {Array.from({ length: totalAttempts - results.length }).map((_, i) => (
          <div key={`e-${i}`} style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)', border: '1px solid var(--border-2)' }} />
        ))}
      </div>
    </Card>
  );
}

/* ── Pit Stop Game (F1) ──────────────────────────────────────── */

const TIRE_LABELS = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];

function PitStopGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'done'>('idle');
  const [activeTire, setActiveTire] = useState(-1);
  const [tiresDone, setTiresDone] = useState<boolean[]>([false, false, false, false]);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const tireOrder = useRef<number[]>([]);

  const start = () => {
    const order = shuffleArray([0, 1, 2, 3]);
    tireOrder.current = order;
    setTiresDone([false, false, false, false]);
    setGameState('running');
    setActiveTire(-1);
    setElapsed(0);
    setTimeout(() => {
      const t = Date.now();
      setStartTime(t);
      setActiveTire(order[0]);
      timerRef.current = setInterval(() => { setElapsed(Date.now() - t); }, 50);
    }, 500 + Math.random() * 1000);
  };

  const hitTire = (tireIdx: number) => {
    if (gameState !== 'running' || tireIdx !== activeTire) return;
    const newDone = [...tiresDone];
    newDone[tireIdx] = true;
    setTiresDone(newDone);
    const doneCount = newDone.filter(Boolean).length;
    if (doneCount >= 4) {
      clearInterval(timerRef.current);
      const total = Date.now() - startTime;
      setFinalTime(total); setElapsed(total); setActiveTire(-1); setGameState('done');
    } else {
      setActiveTire(-1);
      setTimeout(() => { setActiveTire(tireOrder.current[doneCount]); }, 150 + Math.random() * 200);
    }
  };

  useEffect(() => {
    if (gameState === 'done' && !submitted) {
      setSubmitted(true);
      const secs = finalTime / 1000;
      const pts = secs < 2.0 ? 50 : secs < 2.5 ? 40 : secs < 3.0 ? 30 : secs < 4.0 ? 20 : 10;
      submitScore('sport_game', 'f1', pts).then(() => onComplete(pts));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const restart = () => {
    clearInterval(timerRef.current);
    setGameState('idle'); setActiveTire(-1); setTiresDone([false, false, false, false]);
    setElapsed(0); setFinalTime(0); setSubmitted(false);
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';

  if (gameState === 'done') {
    const secs = finalTime / 1000;
    const pts = secs < 2.0 ? 50 : secs < 2.5 ? 40 : secs < 3.0 ? 30 : secs < 4.0 ? 20 : 10;
    const rating = secs < 2.0 ? 'Red Bull-level!' : secs < 2.5 ? 'World class!' : secs < 3.0 ? 'Solid stop!' : secs < 4.0 ? 'Needs practice' : 'Slow stop!';
    const ratingColor = secs < 2.0 ? '#22c55e' : secs < 2.5 ? 'var(--accent)' : secs < 3.0 ? 'var(--orange)' : 'var(--coral)';
    return (
      <Card style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ marginBottom: 8 }}><Icon name="bolt" size={28} style={{ color: ratingColor }} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>Pit Stop Complete!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--ink)', margin: '4px 0' }}>{formatTime(finalTime)}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: ratingColor, marginBottom: 4 }}>{rating}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>{pts} pts earned</div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: 'var(--ink)' }}>
          {gameState === 'running' ? formatTime(elapsed) : '0.00s'}
        </div>
        <div style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
          {gameState === 'idle' ? 'Press start when ready' : activeTire === -1 ? 'Get ready...' : 'Change the highlighted tire!'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => {
          const isReady = activeTire === i;
          const isDone = tiresDone[i];
          return (
            <button key={i} onClick={() => hitTire(i)} disabled={!isReady}
              style={{
                padding: '20px 12px', borderRadius: 12,
                border: `2.5px solid ${isDone ? '#22c55e' : isReady ? 'var(--orange)' : 'var(--border-2)'}`,
                background: isDone ? 'rgba(34,197,94,0.1)' : isReady ? 'rgba(255,183,77,0.15)' : 'var(--surface-2)',
                cursor: isReady ? 'pointer' : 'default',
                textAlign: 'center',
                animation: isReady ? 'cs-pulse 0.6s ease-in-out infinite' : 'none',
              }}
            >
              <Icon name="spark" size={24} style={{ color: isDone ? '#22c55e' : isReady ? 'var(--orange)' : 'var(--text-mute)', margin: '0 auto 6px', display: 'block' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: isDone ? '#22c55e' : isReady ? 'var(--orange)' : 'var(--text-mute)' }}>
                {TIRE_LABELS[i]}
              </div>
            </button>
          );
        })}
      </div>
      {gameState === 'idle' && (
        <button onClick={start} style={{ width: '100%', padding: '14px 0', background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' }}>
          START PIT STOP
        </button>
      )}
    </Card>
  );
}

/* ── Sport-specific game configs ──────────────────────────────── */

type GameType = 'quiz' | 'guess' | 'predictor' | 'penalty' | 'superover' | 'freethrow' | 'pitstop';

const SPORT_GAMES: Record<string, { type: GameType; label: string; icon: string }[]> = {
  football: [
    { type: 'quiz', label: 'Trivia', icon: 'spark' },
    { type: 'guess', label: 'Guess Player', icon: 'user' },
    { type: 'predictor', label: 'Predict', icon: 'bolt' },
    { type: 'penalty', label: 'Penalty Kick', icon: 'spark' },
  ],
  cricket: [
    { type: 'quiz', label: 'Trivia', icon: 'spark' },
    { type: 'guess', label: 'Guess Player', icon: 'user' },
    { type: 'predictor', label: 'Predict', icon: 'bolt' },
    { type: 'superover', label: 'Super Over', icon: 'spark' },
  ],
  basketball: [
    { type: 'quiz', label: 'Trivia', icon: 'spark' },
    { type: 'guess', label: 'Guess Player', icon: 'user' },
    { type: 'predictor', label: 'Predict', icon: 'bolt' },
    { type: 'freethrow', label: 'Free Throw', icon: 'spark' },
  ],
  f1: [
    { type: 'quiz', label: 'Trivia', icon: 'spark' },
    { type: 'guess', label: 'Guess Driver', icon: 'user' },
    { type: 'predictor', label: 'Predict', icon: 'bolt' },
    { type: 'pitstop', label: 'Pit Stop', icon: 'bolt' },
  ],
};

const DEFAULT_GAMES: { type: GameType; label: string; icon: string }[] = [
  { type: 'quiz', label: 'Trivia', icon: 'spark' },
  { type: 'guess', label: 'Guess Player', icon: 'user' },
  { type: 'predictor', label: 'Predict', icon: 'bolt' },
];

/* ── Leaderboard ──────────────────────────────────────────────── */

interface LeaderboardEntry { id: string; username: string; sport: string; score: number; created_at: string; }
const RANK_COLORS = ['#fbbf24', '#9ca3af', '#cd7c2e'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

/* ── Main ──────────────────────────────────────────────────────── */

interface MiniGamesProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

export default function MiniGamesScreen({ sport, setSport, onSearch, onBell, unread }: MiniGamesProps) {
  const availableGames = SPORT_GAMES[sport] ?? DEFAULT_GAMES;
  const [activeGame, setActiveGame] = useState<GameType>(availableGames[0].type);
  const [lbGame, setLbGame] = useState<'quiz' | 'player_guess' | 'sport_game'>('quiz');
  const [quizKey, setQuizKey] = useState(0);

  // Reset active game when sport changes and current game isn't available
  useEffect(() => {
    const games = SPORT_GAMES[sport] ?? DEFAULT_GAMES;
    if (!games.some(g => g.type === activeGame)) {
      setActiveGame(games[0].type);
    }
    setQuizKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  const { data: lbData, isLoading: lbLoading, mutate: mutateLb } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    `/api/game-scores?game_type=${lbGame}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const leaderboard = lbData?.leaderboard ?? [];

  const handleComplete = (score: number) => { if (score > 0) mutateLb(); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Mini Games"
        subtitle="Play · Compete · Win"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SportSelector active={sport} onSelect={setSport} />

        <AdSlot size="banner" />

        {/* Leaderboard */}
        <Card subtitle="This week" title="Leaderboard">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Chip active={lbGame === 'quiz'} onClick={() => setLbGame('quiz')}>Trivia</Chip>
            <Chip active={lbGame === 'player_guess'} onClick={() => setLbGame('player_guess')}>Guess</Chip>
            <Chip active={lbGame === 'sport_game'} onClick={() => setLbGame('sport_game')}>Games</Chip>
          </div>
          {lbLoading && <SkeletonList count={5}>{i => <SkeletonTableRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>}
          {!lbLoading && leaderboard.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>No scores yet. Play to claim top spot!</div>
            </div>
          )}
          {!lbLoading && leaderboard.map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-3)' : 'none' }}>
              <span style={{ width: 28, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: RANK_COLORS[i] ?? 'var(--text-mute)' }}>{RANK_LABELS[i] ?? `${i + 1}th`}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{entry.username}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{entry.sport}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{entry.score} pts</span>
            </div>
          ))}
        </Card>

        {/* Game tabs — sport-aware */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', border: '2px solid var(--ink)', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
          {(SPORT_GAMES[sport] ?? DEFAULT_GAMES).map(g => (
            <button key={g.type} onClick={() => setActiveGame(g.type)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '9px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeGame === g.type ? 'var(--ink)' : 'transparent', color: activeGame === g.type ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, flexShrink: 0, minWidth: 56 }}>
              <Icon name={g.icon as 'spark'} size={16} />
              {g.label}
            </button>
          ))}
        </div>

        {/* Refresh button for quiz/guess */}
        {(activeGame === 'quiz' || activeGame === 'guess') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
              {activeGame === 'quiz' ? '15s per question, +5 pts speed bonus' : 'Use fewer clues for more points'}
            </div>
            <button onClick={() => setQuizKey(k => k + 1)} style={{ background: 'none', border: '1.5px solid var(--border-2)', borderRadius: 8, padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', cursor: 'pointer' }}>New round</button>
          </div>
        )}

        {activeGame === 'quiz' && <QuizGame key={`${sport}-${quizKey}`} sport={sport} onComplete={handleComplete} />}
        {activeGame === 'guess' && <PlayerGuessGame key={`guess-${sport}-${quizKey}`} sport={sport} onComplete={handleComplete} />}
        {activeGame === 'predictor' && <PredictorGame key={sport} sport={sport} />}
        {activeGame === 'penalty' && <PenaltyKickGame key={`pk-${quizKey}`} onComplete={handleComplete} />}
        {activeGame === 'superover' && <SuperOverGame key={`so-${quizKey}`} onComplete={handleComplete} />}
        {activeGame === 'freethrow' && <FreeThrowGame key={`ft-${quizKey}`} onComplete={handleComplete} />}
        {activeGame === 'pitstop' && <PitStopGame key={`ps-${quizKey}`} onComplete={handleComplete} />}
      </div>
    </div>
  );
}
