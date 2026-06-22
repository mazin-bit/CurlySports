'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Chip from './ui/Chip';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonTableRow, SkeletonList } from './ui/Skeletons';

// ─── Quiz data ────────────────────────────────────────────────────────────────
const QUIZ_DATA: Record<string, { q: string; options: string[]; answer: number }[]> = {
  football: [
    { q: "Who won the 2024 UEFA Champions League?", options: ["Real Madrid", "Bayern Munich", "Arsenal", "PSG"], answer: 0 },
    { q: "Which club has won the most Premier League titles?", options: ["Liverpool", "Manchester City", "Manchester United", "Arsenal"], answer: 2 },
    { q: "How many players are on a football team on the pitch?", options: ["10", "11", "12", "9"], answer: 1 },
    { q: "Which country won the 2022 FIFA World Cup?", options: ["Brazil", "France", "Argentina", "Germany"], answer: 2 },
    { q: "Who is the all-time top scorer in Champions League history?", options: ["Messi", "Ronaldo", "Lewandowski", "Müller"], answer: 1 },
  ],
  basketball: [
    { q: "How many players are on a basketball team on the court?", options: ["4", "5", "6", "7"], answer: 1 },
    { q: "Which team has the most NBA championships?", options: ["Lakers", "Celtics", "Bulls", "Warriors"], answer: 1 },
    { q: "How high is a standard basketball hoop?", options: ["8 feet", "9 feet", "10 feet", "11 feet"], answer: 2 },
    { q: "Who scored 100 points in a single NBA game?", options: ["Jordan", "Kobe", "Wilt Chamberlain", "LeBron"], answer: 2 },
    { q: "How long is a standard NBA game?", options: ["40 min", "48 min", "60 min", "36 min"], answer: 1 },
  ],
  nfl: [
    { q: "How many points is a touchdown worth?", options: ["3", "6", "7", "4"], answer: 1 },
    { q: "Which team has the most Super Bowl wins?", options: ["Patriots", "Cowboys", "49ers", "Steelers"], answer: 0 },
    { q: "How many players are on the field per team in NFL?", options: ["9", "11", "12", "10"], answer: 1 },
    { q: "How long is a standard NFL game?", options: ["Two 30-min", "Four 15-min", "Three 20-min", "Two 25-min"], answer: 1 },
  ],
  cricket: [
    { q: "How many players are in a cricket team?", options: ["9", "10", "11", "12"], answer: 2 },
    { q: "Which country has won the most Cricket World Cups?", options: ["India", "Australia", "West Indies", "England"], answer: 1 },
    { q: "What is a hat-trick in cricket?", options: ["3 sixes", "3 wickets in 3 balls", "3 catches", "3 fours"], answer: 1 },
    { q: "How many balls in a cricket over?", options: ["4", "5", "6", "8"], answer: 2 },
  ],
  tennis: [
    { q: "How many Grand Slams are there?", options: ["2", "3", "4", "5"], answer: 2 },
    { q: "What is 40-40 called in tennis?", options: ["Tie", "Deuce", "Love", "Break"], answer: 1 },
    { q: "Which Grand Slam is played on clay?", options: ["Wimbledon", "US Open", "Roland Garros", "Australian Open"], answer: 2 },
    { q: "What does a score of 0 mean in tennis?", options: ["Zero", "Nil", "Love", "None"], answer: 2 },
  ],
  f1: [
    { q: "How many points does an F1 race winner get?", options: ["15", "20", "25", "30"], answer: 2 },
    { q: "Which constructor has the most F1 championships?", options: ["McLaren", "Mercedes", "Ferrari", "Red Bull"], answer: 2 },
    { q: "Which driver has the most F1 World Championships?", options: ["Senna", "Schumacher", "Hamilton", "Vettel"], answer: 2 },
    { q: "What does DRS stand for in F1?", options: ["Drag Reduction System", "Dynamic Race Speed", "Driver Response System", "Dual Racing Speed"], answer: 0 },
  ],
  baseball: [
    { q: "How many innings in a standard baseball game?", options: ["7", "8", "9", "10"], answer: 2 },
    { q: "Which team has the most World Series titles?", options: ["Red Sox", "Yankees", "Dodgers", "Cardinals"], answer: 1 },
    { q: "How many strikes to strike out a batter?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What is a 'perfect game' in baseball?", options: ["No hits allowed", "No runs scored", "No baserunners in 27 outs", "Hitting 4 home runs"], answer: 2 },
  ],
  mma: [
    { q: "What does MMA stand for?", options: ["Multiple Martial Arts", "Mixed Martial Arts", "Modern Martial Arts", "Major Martial Arts"], answer: 1 },
    { q: "How many rounds in a non-title UFC fight?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What organization is the largest MMA promoter?", options: ["Bellator", "ONE Championship", "UFC", "PFL"], answer: 2 },
    { q: "What is it called when a fighter gives up by tapping?", options: ["Knockout", "TKO", "Submission", "DQ"], answer: 2 },
  ],
  golf: [
    { q: "What is a score of 1 under par called?", options: ["Eagle", "Birdie", "Bogey", "Albatross"], answer: 1 },
    { q: "How many holes in a standard round of golf?", options: ["9", "12", "18", "21"], answer: 2 },
    { q: "What is a score of 2 under par called?", options: ["Birdie", "Eagle", "Albatross", "Condor"], answer: 1 },
    { q: "Which surface is Wimbledon played on?", options: ["Clay", "Hard", "Grass", "Carpet"], answer: 2 },
  ],
  hockey: [
    { q: "How many players per team on the ice in NHL (excl. goalie)?", options: ["4", "5", "6", "7"], answer: 1 },
    { q: "Which team has won the most Stanley Cup championships?", options: ["Montreal Canadiens", "Toronto Maple Leafs", "Detroit Red Wings", "Boston Bruins"], answer: 0 },
    { q: "How many periods in a standard NHL game?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What is a hat trick in hockey?", options: ["3 assists in one game", "3 goals in one game", "3 saves", "3 penalties"], answer: 1 },
  ],
};

// ─── Player Guess data ────────────────────────────────────────────────────────
const PLAYER_GUESSES: Record<string, { clues: string[]; answer: string }[]> = {
  football: [
    { clues: ["Born 1987 in Rosario, Argentina", "8 Ballon d'Or awards", "Scored 91 goals in 2012", "Currently plays for Inter Miami"], answer: "Lionel Messi" },
    { clues: ["Portuguese forward, born 1985", "900+ career goals", "Won 5 Champions Leagues", "Currently in Saudi Arabia"], answer: "Cristiano Ronaldo" },
    { clues: ["Norwegian centre-forward", "36 PL goals in 22/23", "Plays for Manchester City"], answer: "Erling Haaland" },
    { clues: ["French forward, born 1998", "Won 2018 World Cup at 19", "Most expensive transfer at time", "Now plays for Real Madrid"], answer: "Kylian Mbappé" },
  ],
  basketball: [
    { clues: ["Born in Akron, Ohio 1984", "Nicknamed 'The King'", "Won 4 NBA titles with 3 teams", "His son LeBron Jr is in NBA too"], answer: "LeBron James" },
    { clues: ["Plays for Golden State Warriors", "Nicknamed 'Chef Curry'", "Holds NBA record for 3-pointers", "Won 4 NBA championships"], answer: "Stephen Curry" },
  ],
  nfl: [
    { clues: ["QB for Kansas City Chiefs", "Youngest NFL MVP winner", "Son of pitcher Pat Mahomes Sr", "Won 3 Super Bowls"], answer: "Patrick Mahomes" },
    { clues: ["Won 7 Super Bowl rings", "Played for Patriots and Buccaneers", "Nicknamed 'GOAT'", "Retired in 2023 at age 45"], answer: "Tom Brady" },
  ],
  cricket: [
    { clues: ["Indian batsman, born 5 Nov 1988", "50+ Test centuries", "Nicknamed 'King Kohli'", "Married to Anushka Sharma"], answer: "Virat Kohli" },
    { clues: ["Indian wicket-keeper, born 1981", "Won 2011 Cricket World Cup as captain", "Known as 'Captain Cool'", "Famous for finishing with sixes"], answer: "MS Dhoni" },
  ],
  tennis: [
    { clues: ["Serbian player, born 1987", "Most Grand Slam singles titles", "Known as 'Nole'", "Career Grand Slam on all surfaces"], answer: "Novak Djokovic" },
    { clues: ["Spanish player, born 1986", "King of clay", "Won Roland Garros 14 times", "Won 22 Grand Slams"], answer: "Rafael Nadal" },
  ],
  f1: [
    { clues: ["Dutch racing driver", "3 consecutive F1 Championships 2021-2023", "Drives Red Bull", "Father Jos also raced F1"], answer: "Max Verstappen" },
    { clues: ["British driver, born 1985", "7 F1 World Championships", "Drives for Mercedes", "Raised in Stevenage"], answer: "Lewis Hamilton" },
  ],
  baseball: [
    { clues: ["Japanese-born pitcher and DH", "First since Babe Ruth at both roles", "Won AL MVP 2021 and 2023", "Plays for LA Dodgers"], answer: "Shohei Ohtani" },
    { clues: ["Known as 'The Great Bambino'", "714 career home runs", "Played for New York Yankees", "Also an elite pitcher"], answer: "Babe Ruth" },
  ],
  mma: [
    { clues: ["American fighter, born 1987", "Nicknamed 'Bones'", "Undefeated in official UFC title fights", "Former UFC Light Heavyweight Champion"], answer: "Jon Jones" },
    { clues: ["Irish fighter, born 1988", "First fighter to hold two UFC championships simultaneously", "Known as 'The Notorious'", "Famous for KO wins and trash talk"], answer: "Conor McGregor" },
  ],
  golf: [
    { clues: ["American golfer, born 1975", "Won 15 Major championships", "Returned from injury to win the 2019 Masters", "Changed golf forever with his dominance"], answer: "Tiger Woods" },
    { clues: ["Northern Irish golfer", "Has won 4 Major championships", "Known as 'Rors'", "Plays in PGA Tour and DP World Tour"], answer: "Rory McIlroy" },
  ],
  hockey: [
    { clues: ["Canadian centre, born 1997", "Plays for the Edmonton Oilers", "2x Hart Trophy winner", "Wins the NHL fastest skater competition"], answer: "Connor McDavid" },
    { clues: ["Known as 'The Great One'", "More assists than any player has total points", "Played for the Oilers and Kings", "Scored 894 career goals"], answer: "Wayne Gretzky" },
  ],
};

// ─── Score predictor data ─────────────────────────────────────────────────────
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

async function submitScore(game_type: 'quiz' | 'player_guess', sport: string, score: number) {
  try {
    await fetch('/api/game-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game_type, sport, score }) });
  } catch {}
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Quiz Game ────────────────────────────────────────────────────────────────
const QUIZ_TIME = 15;

function QuizGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const questions = QUIZ_DATA[sport] ?? QUIZ_DATA.football;
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
        <div style={{ fontSize: 36, marginBottom: 8 }}><Icon name="trophy" size={28} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>Quiz Complete!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--ink)', marginBottom: 4 }}>{score} pts</div>
        <div style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.7, marginBottom: 16 }}>
          {pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Not bad!' : 'Keep learning!'}
        </div>
        <button onClick={restart} style={{ background: 'var(--ink)', color: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

  const timerColor = timeLeft <= 5 ? 'var(--coral)' : timeLeft <= 10 ? 'var(--orange)' : 'var(--accent)';

  return (
    <Card>
      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(qIdx / questions.length) * 100}%`, background: 'var(--accent)', transition: 'width .3s' }} />
      </div>
      {/* Timer */}
      <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(timeLeft / QUIZ_TIME) * 100}%`, background: timerColor, transition: 'width 1s linear, background .3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
        <span>Q{qIdx + 1} / {questions.length}</span>
        <span style={{ color: timerColor, fontWeight: 700 }}>{timeLeft}s</span>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{score} pts</span>
      </div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 16 }}>{current.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {current.options.map((opt, i) => {
          let bg = 'var(--surface-2)', border = 'var(--border-2)', color = 'var(--ink)';
          if (selected !== null) {
            if (i === current.answer) { bg = 'var(--accent)'; border = 'var(--ink)'; }
            else if (i === selected && i !== current.answer) { bg = 'var(--coral)'; border = 'var(--coral)'; color = 'var(--paper)'; }
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={selected !== null}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `2px solid ${border}`, background: bg, color, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: selected !== null ? 'default' : 'pointer', textAlign: 'left' }}
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

// ─── Player Guess ─────────────────────────────────────────────────────────────
function PlayerGuessGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const players = PLAYER_GUESSES[sport] ?? PLAYER_GUESSES.football;
  const [pIdx, setPIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const current = players[pIdx];
  const maxClues = current.clues.length;
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
        <div style={{ fontSize: 36, marginBottom: 8 }}><Icon name="search" size={28} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--paper)', marginBottom: 4 }}>All Players!</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 36, color: 'var(--accent)', marginBottom: 12 }}>{totalScore} pts</div>
        <button onClick={restart} style={{ background: 'var(--accent)', color: 'var(--ink)', border: '2px solid var(--accent)', borderRadius: 10, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Play again</button>
      </Card>
    );
  }

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
          <input
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Who is this player?"
            style={{ flex: 1, border: '2px solid var(--border-2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--body)' }}
          />
          <button onClick={submit} disabled={!guess.trim()} style={{ padding: '10px 18px', borderRadius: 10, border: '2px solid var(--ink)', background: guess.trim() ? 'var(--ink)' : 'var(--surface-3)', color: guess.trim() ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: guess.trim() ? 'pointer' : 'not-allowed' }}>Guess</button>
        </div>
      )}

      {result === 'correct' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e', borderRadius: 10, color: '#22c55e', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
          ✓ Correct! +{pointsForCorrect} pts — {current.answer}
        </div>
      )}
      {result === 'wrong' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '2px solid var(--coral)', borderRadius: 10, color: 'var(--coral)', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
          ✗ The answer was <span style={{ color: 'var(--ink)' }}>{current.answer}</span>
        </div>
      )}
    </Card>
  );
}

// ─── Score Predictor ──────────────────────────────────────────────────────────
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
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>{m.home}</span>
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
          <div style={{ textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>✓ Predictions locked in! Check back after the matches.</div>
        </Card>
      )}
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
interface LeaderboardEntry { id: string; username: string; sport: string; score: number; created_at: string; }
const RANK_COLORS = ['#fbbf24', '#9ca3af', '#cd7c2e'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

// ─── Main ──────────────────────────────────────────────────────────────────────
interface MiniGamesProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

export default function MiniGamesScreen({ sport, setSport, onSearch, onBell, unread }: MiniGamesProps) {
  const [activeGame, setActiveGame] = useState<'quiz' | 'guess' | 'predictor'>('quiz');
  const [lbGame, setLbGame] = useState<'quiz' | 'player_guess'>('quiz');
  const [quizKey, setQuizKey] = useState(0);

  const { data: lbData, isLoading: lbLoading, mutate: mutateLb } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    `/api/game-scores?game_type=${lbGame}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const leaderboard = lbData?.leaderboard ?? [];

  useEffect(() => { setQuizKey(k => k + 1); }, [sport]);

  const handleComplete = (score: number) => { if (score > 0) mutateLb(); };

  const GAME_TABS: [string, string, string][] = [['quiz', 'Trivia', 'spark'], ['guess', 'Guess Player', 'user'], ['predictor', 'Predict', 'bolt']];

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

        {/* Leaderboard */}
        <Card subtitle="This week" title="Leaderboard">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Chip active={lbGame === 'quiz'} onClick={() => setLbGame('quiz')}>Trivia</Chip>
            <Chip active={lbGame === 'player_guess'} onClick={() => setLbGame('player_guess')}>Guess</Chip>
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

        {/* Game tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', border: '2px solid var(--ink)', borderRadius: 12, padding: 4 }}>
          {GAME_TABS.map(([key, label, icon]) => (
            <button key={key} onClick={() => setActiveGame(key as typeof activeGame)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '9px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeGame === key ? 'var(--ink)' : 'transparent', color: activeGame === key ? 'var(--accent)' : 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700 }}>
              <Icon name={icon as 'spark'} size={16} />
              {label}
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
      </div>
    </div>
  );
}
