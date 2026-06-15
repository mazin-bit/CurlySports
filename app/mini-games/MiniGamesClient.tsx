"use client";

import AppShell from "@/components/AppShell";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./mini-games.module.css";
import { Medal, Gamepad2, HelpCircle, Zap, RefreshCw, CheckCircle, XCircle, User, Trophy, Search, Clock } from "lucide-react";
import { useActiveSport } from "@/contexts/SportContext";

/* ── Quiz data ──────────────────────────────────────────────── */

const QUIZ_DATA: Record<string, { q: string; options: string[]; answer: number }[]> = {
  football: [
    { q: "Who won the 2024 UEFA Champions League?", options: ["Real Madrid", "Bayern Munich", "Arsenal", "PSG"], answer: 0 },
    { q: "Which club has won the most Premier League titles?", options: ["Liverpool", "Manchester City", "Manchester United", "Arsenal"], answer: 2 },
    { q: "How many players are on a football team on the pitch?", options: ["10", "11", "12", "9"], answer: 1 },
    { q: "Which country won the 2022 FIFA World Cup?", options: ["Brazil", "France", "Argentina", "Germany"], answer: 2 },
    { q: "Who is the all-time top scorer in Champions League history?", options: ["Messi", "Ronaldo", "Lewandowski", "Müller"], answer: 1 },
    { q: "What shape is a football pitch?", options: ["Square", "Circle", "Rectangle", "Oval"], answer: 2 },
  ],
  basketball: [
    { q: "How many players are on a basketball team on the court?", options: ["4", "5", "6", "7"], answer: 1 },
    { q: "Which team has the most NBA championships?", options: ["Lakers", "Celtics", "Bulls", "Warriors"], answer: 1 },
    { q: "How high is a standard basketball hoop?", options: ["8 feet", "9 feet", "10 feet", "11 feet"], answer: 2 },
    { q: "Who scored 100 points in a single NBA game?", options: ["Michael Jordan", "Kobe Bryant", "Wilt Chamberlain", "LeBron James"], answer: 2 },
    { q: "How long is a standard NBA game?", options: ["40 min", "48 min", "60 min", "36 min"], answer: 1 },
  ],
  nfl: [
    { q: "How many points is a touchdown worth?", options: ["3", "6", "7", "4"], answer: 1 },
    { q: "Which team has the most Super Bowl wins?", options: ["New England Patriots", "Dallas Cowboys", "San Francisco 49ers", "Pittsburgh Steelers"], answer: 0 },
    { q: "How many players are on the field per team in NFL?", options: ["9", "11", "12", "10"], answer: 1 },
    { q: "How long is a standard NFL game in quarters?", options: ["Two 30-min", "Four 15-min", "Three 20-min", "Two 25-min"], answer: 1 },
  ],
  cricket: [
    { q: "How many players are in a cricket team?", options: ["9", "10", "11", "12"], answer: 2 },
    { q: "Which country has won the most Cricket World Cups?", options: ["India", "Australia", "West Indies", "England"], answer: 1 },
    { q: "What is it called when a bowler takes 3 wickets in 3 balls?", options: ["Triple play", "Hat-trick", "Perfect over", "Golden wickets"], answer: 1 },
    { q: "How many balls in a standard cricket over?", options: ["4", "5", "6", "8"], answer: 2 },
  ],
  tennis: [
    { q: "How many Grand Slams are there in tennis?", options: ["2", "3", "4", "5"], answer: 2 },
    { q: "What is the term for a score of 40-40 in tennis?", options: ["Tie", "Deuce", "Love", "Break"], answer: 1 },
    { q: "Which Grand Slam is played on clay?", options: ["Wimbledon", "US Open", "Roland Garros", "Australian Open"], answer: 2 },
    { q: "What is the score called when a player wins 0 points in tennis?", options: ["Zero", "Nil", "Love", "None"], answer: 2 },
  ],
  f1: [
    { q: "How many points does a race winner get in F1?", options: ["15", "20", "25", "30"], answer: 2 },
    { q: "Which constructor has the most F1 championships?", options: ["McLaren", "Mercedes", "Ferrari", "Red Bull"], answer: 2 },
    { q: "Which driver has the most F1 World Championships?", options: ["Ayrton Senna", "Michael Schumacher", "Lewis Hamilton", "Sebastian Vettel"], answer: 2 },
    { q: "What does DRS stand for in F1?", options: ["Drag Reduction System", "Dynamic Race Speed", "Driver Response System", "Dual Racing Speed"], answer: 0 },
  ],
  mma: [
    { q: "What does MMA stand for?", options: ["Multiple Martial Arts", "Mixed Martial Arts", "Modern Martial Arts", "Major Martial Arts"], answer: 1 },
    { q: "How many rounds in a non-title UFC fight?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What organization is the largest MMA promoter?", options: ["Bellator", "ONE Championship", "UFC", "PFL"], answer: 2 },
    { q: "What is it called when a fighter gives up by tapping?", options: ["Knockout", "TKO", "Submission", "DQ"], answer: 2 },
  ],
  baseball: [
    { q: "How many innings in a standard baseball game?", options: ["7", "8", "9", "10"], answer: 2 },
    { q: "Which team has the most World Series titles?", options: ["Red Sox", "Yankees", "Dodgers", "Cardinals"], answer: 1 },
    { q: "How many strikes to strike out a batter?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "What is a 'perfect game' in baseball?", options: ["No hits allowed", "No runs scored", "No baserunners in 27 outs", "Hitting 4 home runs"], answer: 2 },
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

/* ── Player Guess data ──────────────────────────────────────── */

const PLAYER_GUESSES: Record<string, { clues: string[]; answer: string }[]> = {
  football: [
    { clues: ["Born in 1987 in Rosario, Argentina", "Has won 8 Ballon d'Or awards", "Scored 91 goals in calendar year 2012", "Currently plays for Inter Miami"], answer: "Lionel Messi" },
    { clues: ["Portuguese forward, born 1985", "Has scored 900+ career goals", "Won 5 UEFA Champions Leagues", "Currently plays in Saudi Arabia"], answer: "Cristiano Ronaldo" },
    { clues: ["Norwegian centre-forward", "Scored 36 Premier League goals in 22/23", "Plays for Manchester City"], answer: "Erling Haaland" },
    { clues: ["French forward, born 2 Feb 1998", "Won the 2018 FIFA World Cup at age 19", "Most expensive transfer in history at the time", "Now plays for Real Madrid"], answer: "Kylian Mbappé" },
  ],
  basketball: [
    { clues: ["Born in Akron, Ohio in 1984", "Nicknamed 'The King'", "Won 4 NBA championships with 3 different teams", "His son LeBron Jr is also in the NBA"], answer: "LeBron James" },
    { clues: ["Plays for the Golden State Warriors", "Nicknamed 'Chef Curry' for his shooting", "Holds the NBA record for 3-pointers made", "Won 4 NBA championships"], answer: "Stephen Curry" },
    { clues: ["Serbian point guard, born 1989", "6x NBA Most Valuable Player", "Known for his footwork and playmaking", "Plays for the Oklahoma City Thunder"], answer: "Nikola Jokic" },
  ],
  nfl: [
    { clues: ["Quarterback for the Kansas City Chiefs", "Son of former NFL pitcher Pat Mahomes Sr", "Youngest player to win the NFL MVP award", "Won 3 Super Bowls"], answer: "Patrick Mahomes" },
    { clues: ["Won 7 Super Bowl rings", "Played for the Patriots and Buccaneers", "Nicknamed 'GOAT'", "Retired in 2023 at age 45"], answer: "Tom Brady" },
  ],
  cricket: [
    { clues: ["Indian batsman, born 5 Nov 1988", "Has scored 50+ Test centuries", "Nicknamed 'King Kohli'", "Married to actress Anushka Sharma"], answer: "Virat Kohli" },
    { clues: ["Indian wicket-keeper, born 1981", "Won the 2011 Cricket World Cup as captain", "Known as 'Captain Cool'", "Famous for finishing matches with sixes"], answer: "MS Dhoni" },
  ],
  tennis: [
    { clues: ["Serbian tennis player, born 1987", "Holds the record for most Grand Slam singles titles", "Known as 'Nole'", "Career Grand Slam winner on all surfaces"], answer: "Novak Djokovic" },
    { clues: ["Spanish tennis player, born 1986", "King of clay, won Roland Garros 14 times", "Won 22 Grand Slams", "Nicknamed 'The Bull'"], answer: "Rafael Nadal" },
  ],
  f1: [
    { clues: ["Dutch racing driver", "Won 3 consecutive F1 World Championships (2021-2023)", "Drives the Red Bull RB", "His father Jos Verstappen also raced in F1"], answer: "Max Verstappen" },
    { clues: ["British driver, born 1985", "Holds the record for most F1 World Championships (7)", "Drives for Mercedes", "Raised in Stevenage, England"], answer: "Lewis Hamilton" },
  ],
  mma: [
    { clues: ["American fighter, born 1987", "Nicknamed 'Bones'", "Undefeated in official UFC title fights", "Former UFC Light Heavyweight Champion"], answer: "Jon Jones" },
    { clues: ["Irish fighter, born 1988", "First fighter to hold two UFC championships simultaneously", "Known as 'The Notorious'", "Famous for KO wins and trash talk"], answer: "Conor McGregor" },
  ],
  baseball: [
    { clues: ["Japanese-born pitcher and designated hitter", "First player since Babe Ruth to be elite at both pitching and hitting", "Won the AL MVP in 2021 and 2023", "Plays for the LA Dodgers"], answer: "Shohei Ohtani" },
    { clues: ["Known as 'The Great Bambino'", "Hit 714 career home runs", "Also an elite pitcher before switching to hitting", "Played for the New York Yankees"], answer: "Babe Ruth" },
  ],
  golf: [
    { clues: ["American golfer, born 1975", "Won 15 Major championships", "Returned from serious injuries to win the 2019 Masters", "Changed golf forever with his dominance"], answer: "Tiger Woods" },
    { clues: ["Northern Irish golfer", "Has won 4 Major championships", "Known as 'Rors'", "Plays in the PGA Tour and DP World Tour"], answer: "Rory McIlroy" },
  ],
  hockey: [
    { clues: ["Canadian centre, born 1997", "Plays for the Edmonton Oilers", "2x Hart Trophy winner", "Consistently wins the NHL fastest skater competition"], answer: "Connor McDavid" },
    { clues: ["Known as 'The Great One'", "Has more assists than any other player has total points", "Played for the Oilers and Kings", "Scored 894 career goals"], answer: "Wayne Gretzky" },
  ],
};

/* ── Score Predictor data ────────────────────────────────────── */

const PREDICT_MATCHES: Record<string, { home: string; away: string; league: string }[]> = {
  football: [
    { home: "Arsenal", away: "Man City", league: "Premier League" },
    { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
    { home: "Bayern Munich", away: "Borussia Dortmund", league: "Bundesliga" },
  ],
  basketball: [{ home: "Lakers", away: "Celtics", league: "NBA" }, { home: "Warriors", away: "Heat", league: "NBA" }],
  nfl: [{ home: "Chiefs", away: "Eagles", league: "NFL" }, { home: "49ers", away: "Cowboys", league: "NFL" }],
  cricket: [{ home: "India", away: "Australia", league: "Test Series" }, { home: "England", away: "Pakistan", league: "T20" }],
  tennis: [{ home: "Djokovic", away: "Alcaraz", league: "ATP Final" }],
  f1: [{ home: "Verstappen", away: "Hamilton", league: "F1 Race" }],
  mma: [{ home: "Jones", away: "Miocic", league: "UFC" }],
  baseball: [{ home: "Yankees", away: "Dodgers", league: "MLB" }],
  golf: [{ home: "McIlroy", away: "Scheffler", league: "PGA Tour" }],
  hockey: [{ home: "Maple Leafs", away: "Canadiens", league: "NHL" }],
};

/* ── Score submit helper ─────────────────────────────────────── */

async function submitScore(game_type: "quiz" | "player_guess", sport: string, score: number) {
  try {
    await fetch("/api/game-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_type, sport, score }),
    });
  } catch { /* ignore - score submission is best-effort */ }
}

/* ── Timed Quiz ──────────────────────────────────────────────── */

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
    if (qIdx + 1 >= questions.length) { setDone(true); }
    else { setQIdx(q => q + 1); setSelected(null); setTimeLeft(QUIZ_TIME); }
  };
  advanceRef.current = advance;

  useEffect(() => {
    if (selected !== null || done) return;
    let localTime = QUIZ_TIME;
    let advanceTimeout: ReturnType<typeof setTimeout> | undefined;
    timerRef.current = setInterval(() => {
      localTime -= 1;
      setTimeLeft(localTime);
      if (localTime <= 0) {
        clearInterval(timerRef.current);
        setSelected(-1);
        advanceTimeout = setTimeout(() => advanceRef.current(), 1400);
      }
    }, 1000);
    return () => { clearInterval(timerRef.current); clearTimeout(advanceTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, done, qIdx]);

  // Save score when done
  useEffect(() => {
    if (done && !submitted) {
      setSubmitted(true);
      submitScore("quiz", sport, score).then(() => onComplete(score));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const pick = (i: number) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(i);
    if (i === current.answer) {
      const bonus = timeLeft > 10 ? 5 : timeLeft > 5 ? 3 : 0;
      setScore(s => s + 10 + bonus);
    }
    setTimeout(() => advanceRef.current(), 1200);
  };

  const restart = () => { setQIdx(0); setScore(0); setSelected(null); setDone(false); setTimeLeft(QUIZ_TIME); setSubmitted(false); };

  if (done) {
    const pct = Math.round((score / (questions.length * 10)) * 100);
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Trophy size={36} strokeWidth={1.5} style={{ color: "var(--orange)" }} /></div>
        <h3 className={styles.quizDoneTitle}>Quiz Complete!</h3>
        <p className={styles.quizDoneScore}>{score} pts</p>
        <p className={styles.quizDoneSub}>
          {pct >= 90 ? "Outstanding! You know your stuff!"
            : pct >= 70 ? "Great job! Very knowledgeable!"
            : pct >= 50 ? "Not bad, keep learning!"
            : "Keep studying, you'll get better!"}
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> Play Again
        </button>
      </div>
    );
  }

  const timerPct = (timeLeft / QUIZ_TIME) * 100;
  const timerColor = timeLeft <= 5 ? "var(--coral)" : timeLeft <= 10 ? "var(--orange)" : "var(--accent)";

  return (
    <div className={styles.quizCard}>
      <div className={styles.quizProgress}>
        <div className={styles.quizProgressBar} style={{ width: `${((qIdx) / questions.length) * 100}%` }} />
      </div>
      <div className={styles.timerBar}>
        <div className={styles.timerBarFill} style={{ width: `${timerPct}%`, background: timerColor, transition: "width 1s linear, background 0.3s" }} />
      </div>
      <div className={styles.quizMeta}>
        <span className={styles.quizNum}>Q{qIdx + 1} / {questions.length}</span>
        <span className={styles.timerCount} style={{ color: timerColor }}>{timeLeft}s</span>
        <span className={styles.quizScore}>{score} pts</span>
      </div>
      <h3 className={styles.quizQ}>{current.q}</h3>
      <div className={styles.quizOptions}>
        {current.options.map((opt, i) => {
          let cls = styles.quizOpt;
          if (selected !== null) {
            if (i === current.answer) cls += " " + styles.correct;
            else if (i === selected && i !== current.answer) cls += " " + styles.wrong;
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={selected !== null}>
              <span className={styles.optLetter}>{["A", "B", "C", "D"][i]}</span>
              {opt}
              {selected !== null && i === current.answer && <CheckCircle size={16} strokeWidth={2} style={{ marginLeft: "auto", color: "#22c55e" }} />}
              {selected !== null && i === selected && i !== current.answer && <XCircle size={16} strokeWidth={2} style={{ marginLeft: "auto", color: "var(--coral)" }} />}
            </button>
          );
        })}
      </div>
      {selected !== null && timeLeft <= 0 && (
        <div className={styles.timeoutBanner} style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Time&apos;s up! The answer was <strong>{current.options[current.answer]}</strong></div>
      )}
    </div>
  );
}

/* ── Guess the Player ───────────────────────────────────────── */

function PlayerGuessGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const players = PLAYER_GUESSES[sport] ?? PLAYER_GUESSES.football;
  const [pIdx, setPIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = players[pIdx];
  const maxClues = current.clues.length;
  const pointsForCorrect = Math.max(5, 40 - (cluesShown - 1) * 10);

  const advance = () => {
    setTimeout(() => {
      if (pIdx + 1 >= players.length) { setDone(true); }
      else { setPIdx(p => p + 1); setCluesShown(1); setGuess(""); setResult(null); }
    }, 2000);
  };

  const submit = () => {
    if (!guess.trim() || result !== null) return;
    const g = guess.toLowerCase().trim();
    const a = current.answer.toLowerCase();
    const isCorrect = a.split(" ").some(w => w.length > 3 && g.includes(w)) || g === a;
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) setTotalScore(s => s + pointsForCorrect);
    advance();
  };

  const skip = () => {
    if (result !== null) return;
    setResult("wrong");
    advance();
  };

  const restart = () => { setPIdx(0); setCluesShown(1); setGuess(""); setResult(null); setTotalScore(0); setDone(false); setSubmitted(false); };

  useEffect(() => { if (result === null) inputRef.current?.focus(); }, [pIdx, result]);

  // Save score when done
  useEffect(() => {
    if (done && !submitted) {
      setSubmitted(true);
      submitScore("player_guess", sport, totalScore).then(() => onComplete(totalScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const maxPossible = players.length * 40;
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Search size={36} strokeWidth={1.5} style={{ color: "var(--orange)" }} /></div>
        <h3 className={styles.quizDoneTitle}>All Players Guessed!</h3>
        <p className={styles.quizDoneScore}>{totalScore} / {maxPossible} pts</p>
        <p className={styles.quizDoneSub}>
          {totalScore >= maxPossible * 0.8 ? "You're a true sports genius!"
            : totalScore >= maxPossible * 0.5 ? "Solid sports knowledge!"
            : "Keep watching the games!"}
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> Play Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.guessCard}>
      <div className={styles.guessMeta}>
        <span>Player {pIdx + 1} of {players.length}</span>
        <span className={styles.guessPoints}>
          {result === null ? `Correct = +${pointsForCorrect} pts` : ""}
        </span>
        <span className={styles.quizScore}>{totalScore} pts</span>
      </div>

      <div className={styles.cluesList}>
        {current.clues.slice(0, cluesShown).map((clue, i) => (
          <div key={i} className={`${styles.clue} ${i === cluesShown - 1 ? styles.clueNew : ""}`}>
            <span className={styles.clueNum}>{i + 1}</span>
            <span>{clue}</span>
          </div>
        ))}
      </div>

      {result === null && (
        <div className={styles.guessActions}>
          {cluesShown < maxClues && (
            <button className={styles.revealBtn} onClick={() => setCluesShown(n => n + 1)}>
              Reveal clue {cluesShown + 1} <span className={styles.revealCost}>(-10 pts)</span>
            </button>
          )}
          <button className={styles.skipBtn} onClick={skip}>Skip</button>
        </div>
      )}

      {result === null && (
        <div className={styles.guessInputWrap}>
          <input
            ref={inputRef}
            className={styles.guessBox}
            placeholder="Who is this player?"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <button className={styles.guessBtn} onClick={submit}>Guess</button>
        </div>
      )}

      {result === "correct" && (
        <div className={styles.guessResult} style={{ background: "rgba(34,197,94,0.12)", borderColor: "#22c55e", color: "#22c55e" }}>
          <CheckCircle size={18} /> Correct! +{pointsForCorrect} pts — {current.answer}
        </div>
      )}
      {result === "wrong" && (
        <div className={styles.guessResult} style={{ background: "rgba(239,68,68,0.1)", borderColor: "var(--coral)", color: "var(--coral)" }}>
          <XCircle size={18} /> The answer was <strong style={{ color: "var(--ink)" }}>{current.answer}</strong>
        </div>
      )}
    </div>
  );
}

/* ── Score Predictor ─────────────────────────────────────────── */

function PredictorGame({ sport }: { sport: string }) {
  const matches = PREDICT_MATCHES[sport] ?? PREDICT_MATCHES.football;
  const [preds, setPreds] = useState(() => matches.map(() => ({ home: 0, away: 0 })));
  const [submitted, setSubmitted] = useState(false);

  const update = (idx: number, side: "home" | "away", val: number) => {
    setPreds(p => p.map((pred, i) => i === idx ? { ...pred, [side]: Math.max(0, Math.min(20, val)) } : pred));
  };

  return (
    <div className={styles.predictorWrap}>
      {matches.map((m, idx) => (
        <div key={idx} className={styles.predCard}>
          <div className={styles.predComp}>{m.league}</div>
          <div className={styles.predTeams}>
            <div className={styles.predTeam}>
              <span className={styles.predName}>{m.home}</span>
              <input type="number" min="0" max="20" value={preds[idx].home}
                onChange={e => update(idx, "home", parseInt(e.target.value) || 0)}
                className={styles.predInput} disabled={submitted}
              />
            </div>
            <span className={styles.predVs}>VS</span>
            <div className={`${styles.predTeam} ${styles.predTeamAway}`}>
              <input type="number" min="0" max="20" value={preds[idx].away}
                onChange={e => update(idx, "away", parseInt(e.target.value) || 0)}
                className={styles.predInput} disabled={submitted}
              />
              <span className={styles.predName}>{m.away}</span>
            </div>
          </div>
        </div>
      ))}
      {!submitted ? (
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSubmitted(true)}>
          Submit Predictions
        </button>
      ) : (
        <div className={styles.predSubmitted}>
          <CheckCircle size={20} strokeWidth={2} style={{ color: "var(--teal)" }} />
          <span>Predictions locked in! Check back after the matches.</span>
        </div>
      )}
    </div>
  );
}

/* ── Leaderboard types ───────────────────────────────────────── */

interface LeaderboardEntry {
  id: string;
  username: string;
  sport: string;
  score: number;
  created_at: string;
}

const RANK_COLORS = ["#fbbf24", "#9ca3af", "#cd7c2e"];
const RANK_LABELS = ["1st", "2nd", "3rd"];

/* ── Main Page ───────────────────────────────────────────────── */

export default function MiniGamesPage() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const [activeGame, setActiveGame] = useState<"quiz" | "guess" | "predictor">("quiz");
  const [quizKey, setQuizKey] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbGame, setLbGame] = useState<"quiz" | "player_guess">("quiz");
  const [lbLoading, setLbLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (game_type: "quiz" | "player_guess") => {
    setLbLoading(true);
    try {
      const res = await fetch(`/api/game-scores?game_type=${game_type}`);
      const json = await res.json() as { leaderboard: LeaderboardEntry[] };
      setLeaderboard(json.leaderboard ?? []);
    } catch { setLeaderboard([]); }
    setLbLoading(false);
  }, []);

  useEffect(() => { fetchLeaderboard(lbGame); }, [lbGame, fetchLeaderboard]);
  useEffect(() => { setQuizKey(k => k + 1); }, [activeSport]);

  const handleGameComplete = (score: number) => {
    if (score > 0) fetchLeaderboard(lbGame);
  };

  return (
    <AppShell active="minigames" title="Mini Games" subtitle="Play · Compete · Win">
      <div className="stack">
        {/* Leaderboard */}
        <section className="section">
          <div className="sec-head">
            <div className="title"><Medal size={17} className="title-icon" strokeWidth={2} /> Weekly <span className="accent">Leaderboard</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setLbGame("quiz")}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
                  background: lbGame === "quiz" ? "var(--accent)" : "transparent",
                  color: lbGame === "quiz" ? "#000" : "var(--text-dim)" }}
              >Trivia</button>
              <button
                onClick={() => setLbGame("player_guess")}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
                  background: lbGame === "player_guess" ? "var(--accent)" : "transparent",
                  color: lbGame === "player_guess" ? "#000" : "var(--text-dim)" }}
              >Guess</button>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-mute)", alignSelf: "center", marginLeft: 4 }}>Resets Sunday</span>
            </div>
          </div>
          <div className={styles.leaderboard}>
            {lbLoading ? (
              <div className={styles.lbRow} style={{ justifyContent: "center", padding: "20px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)" }}>Loading…</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className={styles.lbRow} style={{ justifyContent: "center", padding: "28px 20px", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Medal size={28} strokeWidth={1.5} style={{ color: "var(--text-mute)", opacity: 0.4 }} />
                <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)", textAlign: "center", margin: 0 }}>
                  No scores yet this week.<br />Play a game below to claim the top spot!
                </p>
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className={styles.lbRow}>
                  <span className={styles.lbRank} style={{ color: RANK_COLORS[i] ?? "var(--text-mute)", fontWeight: 700 }}>
                    {RANK_LABELS[i] ?? `${i + 1}th`}
                  </span>
                  <span className={styles.lbName}>{entry.username}</span>
                  <span className={styles.lbSport} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-mute)", marginLeft: "auto", marginRight: 12 }}>
                    {entry.sport}
                  </span>
                  <span className={styles.lbScore}>{entry.score} pts</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Games */}
        <section className="section">
          <div className="sec-head">
            <div className="title"><Gamepad2 size={17} className="title-icon" strokeWidth={2} /> {activeSportConfig.icon} Games</div>
          </div>

          <div className={styles.gameTabs}>
            <button className={`${styles.gameTab}${activeGame === "quiz" ? " " + styles.gameTabActive : ""}`} onClick={() => setActiveGame("quiz")}>
              <HelpCircle size={15} strokeWidth={2} /> Trivia Quiz
            </button>
            <button className={`${styles.gameTab}${activeGame === "guess" ? " " + styles.gameTabActive : ""}`} onClick={() => setActiveGame("guess")}>
              <User size={15} strokeWidth={2} /> Guess the Player
            </button>
            <button className={`${styles.gameTab}${activeGame === "predictor" ? " " + styles.gameTabActive : ""}`} onClick={() => setActiveGame("predictor")}>
              <Zap size={15} strokeWidth={2} /> Score Predictor
            </button>
          </div>

          {activeGame === "quiz" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {activeSportConfig.label} trivia — 15s per question, +5 pts speed bonus
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> New quiz
                </button>
              </div>
              <QuizGame key={`${activeSport}-${quizKey}`} sport={activeSport} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "guess" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} Guess famous {activeSportConfig.label} athletes from clues — use fewer clues for more points
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> New round
                </button>
              </div>
              <PlayerGuessGame key={`guess-${activeSport}-${quizKey}`} sport={activeSport} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "predictor" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>
                {activeSportConfig.icon} Predict upcoming {activeSportConfig.label} results
              </p>
              <PredictorGame key={activeSport} sport={activeSport} />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
