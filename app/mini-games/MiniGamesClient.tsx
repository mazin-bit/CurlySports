"use client";

import AppShell from "@/components/AppShell";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./mini-games.module.css";
import { Medal, Gamepad2, HelpCircle, Zap, RefreshCw, CheckCircle, XCircle, User, Trophy, Search, Clock, Target, Shield, CircleDot, Timer, Disc } from "lucide-react";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AdSlot from "@/components/AdSlot";
import { QUIZ_DATA } from "./quiz-data";
import { PLAYER_GUESSES } from "./player-guess-data";

/* ── Helper: shuffle + pick N questions from pool ──────────── */

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
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}


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

async function submitScore(game_type: string, sport: string, score: number) {
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
const DIFF_POINTS: Record<string, number> = { easy: 10, medium: 15, hard: 20 };

function QuizGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const { t } = useLanguage();
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
      const base = DIFF_POINTS[current.difficulty ?? "easy"] ?? 10;
      const bonus = timeLeft > 10 ? 5 : timeLeft > 5 ? 3 : 0;
      setScore(s => s + base + bonus);
    }
    setTimeout(() => advanceRef.current(), 1200);
  };

  const restart = () => { setQIdx(0); setScore(0); setSelected(null); setDone(false); setTimeLeft(QUIZ_TIME); setSubmitted(false); };

  if (done) {
    const pct = Math.round((score / (questions.length * 10)) * 100);
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Trophy size={36} strokeWidth={1.5} style={{ color: "var(--orange)" }} /></div>
        <h3 className={styles.quizDoneTitle}>{t("miniGames.quiz.complete")}</h3>
        <p className={styles.quizDoneScore}>{score} pts</p>
        <p className={styles.quizDoneSub}>
          {pct >= 90 ? t("miniGames.quiz.outstanding")
            : pct >= 70 ? t("miniGames.quiz.great")
            : pct >= 50 ? t("miniGames.quiz.notBad")
            : t("miniGames.quiz.keepStudying")}
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
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
        <span className={`${styles.diffBadge} ${styles[current.difficulty === "hard" ? "diffHard" : current.difficulty === "medium" ? "diffMedium" : "diffEasy"]}`}>
          {current.difficulty ?? "easy"}
        </span>
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
              {selected !== null && i === current.answer && <CheckCircle size={16} strokeWidth={2} style={{ marginInlineStart: "auto", color: "#22c55e" }} />}
              {selected !== null && i === selected && i !== current.answer && <XCircle size={16} strokeWidth={2} style={{ marginInlineStart: "auto", color: "var(--coral)" }} />}
            </button>
          );
        })}
      </div>
      {selected !== null && timeLeft <= 0 && (
        <div className={styles.timeoutBanner} style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> {t("miniGames.quiz.timesUp")} <strong>{current.options[current.answer]}</strong></div>
      )}
    </div>
  );
}

/* ── Guess the Player ───────────────────────────────────────── */

function PlayerGuessGame({ sport, onComplete }: { sport: string; onComplete: (score: number) => void }) {
  const { t } = useLanguage();
  const [players] = useState(() => {
    const pool = PLAYER_GUESSES[sport] ?? PLAYER_GUESSES.football;
    return shuffleArray(pool).slice(0, Math.min(5, pool.length));
  });
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
        <h3 className={styles.quizDoneTitle}>{t("miniGames.guessPlayer.allGuessed")}</h3>
        <p className={styles.quizDoneScore}>{totalScore} / {maxPossible} pts</p>
        <p className={styles.quizDoneSub}>
          {totalScore >= maxPossible * 0.8 ? t("miniGames.guessPlayer.genius")
            : totalScore >= maxPossible * 0.5 ? t("miniGames.guessPlayer.solid")
            : t("miniGames.guessPlayer.keepWatching")}
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.guessCard}>
      <div className={styles.guessMeta}>
        <span>Player {pIdx + 1} of {players.length}</span>
        <span className={styles.guessPoints}>
          {result === null ? `${t("miniGames.guessPlayer.correctPlus")}${pointsForCorrect} pts` : ""}
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
            placeholder={t("miniGames.guessPlayer.whoIsThis")}
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <button className={styles.guessBtn} onClick={submit}>Guess</button>
        </div>
      )}

      {result === "correct" && (
        <div className={styles.guessResult} style={{ background: "rgba(34,197,94,0.12)", borderColor: "#22c55e", color: "#22c55e" }}>
          <CheckCircle size={18} /> {t("miniGames.guessPlayer.correct")}{pointsForCorrect} pts — {current.answer}
        </div>
      )}
      {result === "wrong" && (
        <div className={styles.guessResult} style={{ background: "rgba(239,68,68,0.1)", borderColor: "var(--coral)", color: "var(--coral)" }}>
          <XCircle size={18} /> {t("miniGames.guessPlayer.theAnswerWas")} <strong style={{ color: "var(--ink)" }}>{current.answer}</strong>
        </div>
      )}
    </div>
  );
}

/* ── Score Predictor ─────────────────────────────────────────── */

function PredictorGame({ sport }: { sport: string }) {
  const { t } = useLanguage();
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
          {t("miniGames.predictor.submit")}
        </button>
      ) : (
        <div className={styles.predSubmitted}>
          <CheckCircle size={20} strokeWidth={2} style={{ color: "var(--teal)" }} />
          <span>{t("miniGames.predictor.locked")}</span>
        </div>
      )}
    </div>
  );
}

/* ── Penalty Kick Game (Football) ──────────────────────────── */

const KEEPER_ZONES = [0, 1, 2, 3, 4, 5]; // 6 zones in 3x2 grid
type PKResult = "goal" | "saved" | "keeper_goal" | "keeper_save" | null;

function PenaltyKickGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<"shoot" | "save" | "done">("shoot");
  const [round, setRound] = useState(0); // 0-4 for each phase
  const [playerGoals, setPlayerGoals] = useState(0);
  const [botGoals, setBotGoals] = useState(0);
  const [shootHistory, setShootHistory] = useState<("goal" | "miss" | "saved")[]>([]);
  const [saveHistory, setSaveHistory] = useState<("goal" | "save" | "miss")[]>([]);
  const [lastResult, setLastResult] = useState<PKResult>(null);
  const [shotZone, setShotZone] = useState<number | null>(null);
  const [keeperZone, setKeeperZone] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const totalRounds = 5;

  const handleShoot = (zone: number) => {
    if (waiting || phase !== "shoot") return;
    setWaiting(true);
    const kZone = KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)];
    setShotZone(zone);
    setKeeperZone(kZone);

    const scored = zone !== kZone;
    if (scored) {
      setPlayerGoals(g => g + 1);
      setShootHistory(h => [...h, "goal"]);
      setLastResult("goal");
    } else {
      setShootHistory(h => [...h, "saved"]);
      setLastResult("saved");
    }

    setTimeout(() => {
      setShotZone(null); setKeeperZone(null); setLastResult(null);
      if (round + 1 >= totalRounds) {
        setPhase("save"); setRound(0);
      } else {
        setRound(r => r + 1);
      }
      setWaiting(false);
    }, 1400);
  };

  const handleSave = (zone: number) => {
    if (waiting || phase !== "save") return;
    setWaiting(true);
    const botShot = KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)];
    setShotZone(botShot);
    setKeeperZone(zone);

    const saved = zone === botShot;
    if (saved) {
      setSaveHistory(h => [...h, "save"]);
      setLastResult("keeper_save");
    } else {
      setBotGoals(g => g + 1);
      setSaveHistory(h => [...h, "goal"]);
      setLastResult("keeper_goal");
    }

    setTimeout(() => {
      setShotZone(null); setKeeperZone(null); setLastResult(null);
      if (round + 1 >= totalRounds) {
        setPhase("done");
      } else {
        setRound(r => r + 1);
      }
      setWaiting(false);
    }, 1400);
  };

  useEffect(() => {
    if (phase === "done" && !submitted) {
      setSubmitted(true);
      const saves = saveHistory.filter(s => s === "save").length;
      const totalScore = playerGoals * 10 + saves * 10;
      submitScore("sport_game", "football", totalScore).then(() => onComplete(totalScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const restart = () => {
    setPhase("shoot"); setRound(0); setPlayerGoals(0); setBotGoals(0);
    setShootHistory([]); setSaveHistory([]); setLastResult(null);
    setShotZone(null); setKeeperZone(null); setSubmitted(false); setWaiting(false);
  };

  if (phase === "done") {
    const saves = saveHistory.filter(s => s === "save").length;
    const totalScore = playerGoals * 10 + saves * 10;
    const won = playerGoals > botGoals;
    const draw = playerGoals === botGoals;
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Target size={36} strokeWidth={1.5} style={{ color: won ? "#22c55e" : "var(--coral)" }} /></div>
        <h3 className={styles.quizDoneTitle}>{won ? t("miniGames.penalty.youWin") : draw ? t("miniGames.penalty.draw") : t("miniGames.penalty.youLose")}</h3>
        <p className={styles.quizDoneScore}>{playerGoals} - {botGoals}</p>
        <p className={styles.quizDoneSub}>
          {playerGoals} {t("miniGames.penalty.goalsScored")} {saves} {t("miniGames.penalty.savesMade")} {totalScore} pts
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
        </button>
      </div>
    );
  }

  const zoneLabels = ["TL", "TC", "TR", "BL", "BC", "BR"];

  return (
    <div className={styles.penaltyWrap}>
      <div className={styles.penaltyHeader}>
        <span className={styles.penaltyRound}>
          {phase === "shoot" ? t("miniGames.penalty.shooting") : t("miniGames.penalty.saving")} — {t("miniGames.penalty.kick")} {round + 1}/{totalRounds}
        </span>
        <div className={styles.penaltyScoreboard}>
          <span className={styles.penaltyScoreYou}>{playerGoals}</span>
          <span className={styles.penaltyScoreVs}>vs</span>
          <span className={styles.penaltyScoreBot}>{botGoals}</span>
        </div>
      </div>
      <p className={styles.penaltyPhase}>
        {phase === "shoot" ? t("miniGames.penalty.clickToShoot") : t("miniGames.penalty.clickToSave")}
      </p>
      <div className={styles.goalFrame}>
        <div className={styles.goalGrid}>
          {[0, 1, 2, 3, 4, 5].map(z => {
            let cls = styles.goalZone;
            if (shotZone === z && keeperZone === z) cls += " " + styles.goalZoneSaved;
            else if (shotZone === z) cls += " " + styles.goalZoneHit;
            else if (keeperZone === z) cls += " " + styles.goalZoneKeeper;
            return (
              <button key={z} className={cls}
                onClick={() => phase === "shoot" ? handleShoot(z) : handleSave(z)}
                disabled={waiting}
              >
                {shotZone === z && <Target size={20} strokeWidth={2} />}
                {keeperZone === z && shotZone !== z && <Shield size={20} strokeWidth={2} />}
                {shotZone === null && keeperZone === null && (
                  <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-mute)", opacity: 0.5 }}>{zoneLabels[z]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.goalGrass} />
      {lastResult && (
        <div className={styles.penaltyResult} style={{
          color: lastResult === "goal" || lastResult === "keeper_save" ? "#22c55e" : "var(--coral)",
        }}>
          {lastResult === "goal" && t("miniGames.penalty.goal")}
          {lastResult === "saved" && t("miniGames.penalty.savedByKeeper")}
          {lastResult === "keeper_save" && t("miniGames.penalty.greatSave")}
          {lastResult === "keeper_goal" && t("miniGames.penalty.goalConceded")}
        </div>
      )}
      <div className={styles.penaltyKicks}>
        {phase === "shoot"
          ? shootHistory.map((r, i) => (
              <div key={i} className={`${styles.penaltyDot} ${r === "goal" ? styles.penaltyDotGoal : styles.penaltyDotMiss}`} />
            ))
          : saveHistory.map((r, i) => (
              <div key={i} className={`${styles.penaltyDot} ${r === "save" ? styles.penaltyDotSave : styles.penaltyDotMiss}`} />
            ))
        }
        {Array.from({ length: totalRounds - (phase === "shoot" ? shootHistory.length : saveHistory.length) }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.penaltyDot} />
        ))}
      </div>
    </div>
  );
}

/* ── Super Over Game (Cricket) ─────────────────────────────── */

type ShotType = "defensive" | "normal" | "aggressive" | "slog";
type DeliveryType = "good_length" | "short" | "yorker" | "full_toss";

const SHOTS: { type: ShotType; label: string; risk: string }[] = [
  { type: "defensive", label: "Defensive", risk: "Safe - 0-2 runs" },
  { type: "normal", label: "Normal", risk: "Balanced - 1-4 runs" },
  { type: "aggressive", label: "Aggressive", risk: "Risky - 0-6 runs" },
  { type: "slog", label: "Slog Sweep", risk: "High risk - W or 4-6" },
];

const DELIVERIES: DeliveryType[] = ["good_length", "short", "yorker", "full_toss"];

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
  const { t } = useLanguage();
  const [phase, setPhase] = useState<"bat" | "bowl" | "done">("bat");
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
      setBallResults(r => [...r, "W"]);
      setLastOutcome(t("miniGames.superOver.wicketOut"));
      if (playerWickets + 1 >= 3) {
        setTimeout(() => { setPhase("bowl"); setBall(0); setBallResults([]); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    } else {
      setPlayerRuns(s => s + outcome.runs);
      setBallResults(r => [...r, String(outcome.runs)]);
      setLastOutcome(outcome.runs === 6 ? t("miniGames.superOver.six") : outcome.runs === 4 ? t("miniGames.superOver.four") : outcome.runs === 0 ? t("miniGames.superOver.dotBall") : `${outcome.runs} ${outcome.runs > 1 ? t("miniGames.superOver.runs") : t("miniGames.superOver.run")}`);
    }

    setTimeout(() => {
      setLastOutcome(null);
      if (ball + 1 >= totalBalls) {
        setPhase("bowl"); setBall(0); setBallResults([]);
      } else {
        setBall(b => b + 1);
      }
      setWaiting(false);
    }, 1200);
  };

  const playBowl = (bowlType: ShotType) => {
    if (waiting) return;
    setWaiting(true);
    // Bot picks a random shot, we use our bowl type as delivery modifier
    const botShot: ShotType = (["defensive", "normal", "aggressive", "slog"] as ShotType[])[Math.floor(Math.random() * 4)];
    const deliveryMap: Record<ShotType, DeliveryType> = {
      defensive: "good_length", normal: "good_length", aggressive: "yorker", slog: "short",
    };
    const outcome = getOutcome(botShot, deliveryMap[bowlType]);

    if (outcome.isWicket) {
      setBotWickets(w => w + 1);
      setBallResults(r => [...r, "W"]);
      setLastOutcome(t("miniGames.superOver.wicketGotThem"));
      if (botWickets + 1 >= 3) {
        setTimeout(() => { setPhase("done"); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    } else {
      setBotRuns(s => s + outcome.runs);
      setBallResults(r => [...r, String(outcome.runs)]);
      setLastOutcome(outcome.runs === 6 ? t("miniGames.superOver.sixConceded") : outcome.runs === 4 ? t("miniGames.superOver.fourConceded") : outcome.runs === 0 ? t("miniGames.superOver.dotBallBowl") : `${outcome.runs} ${outcome.runs > 1 ? t("miniGames.superOver.runs") : t("miniGames.superOver.run")} ${t("miniGames.superOver.conceded")}`);
      if (botRuns + outcome.runs > playerRuns) {
        setTimeout(() => { setPhase("done"); setLastOutcome(null); setWaiting(false); }, 1400);
        return;
      }
    }

    setTimeout(() => {
      setLastOutcome(null);
      if (ball + 1 >= totalBalls) {
        setPhase("done");
      } else {
        setBall(b => b + 1);
      }
      setWaiting(false);
    }, 1200);
  };

  useEffect(() => {
    if (phase === "done" && !submitted) {
      setSubmitted(true);
      const won = playerRuns > botRuns;
      const totalScore = playerRuns + (won ? 20 : 0) + (3 - Math.min(3, botWickets)) * 5;
      submitScore("sport_game", "cricket", totalScore).then(() => onComplete(totalScore));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const restart = () => {
    setPhase("bat"); setBall(0); setPlayerRuns(0); setPlayerWickets(0);
    setBotRuns(0); setBotWickets(0); setBallResults([]); setLastOutcome(null);
    setSubmitted(false); setWaiting(false);
  };

  if (phase === "done") {
    const won = playerRuns > botRuns;
    const draw = playerRuns === botRuns;
    const totalScore = playerRuns + (won ? 20 : 0) + (3 - Math.min(3, botWickets)) * 5;
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><CircleDot size={36} strokeWidth={1.5} style={{ color: won ? "#22c55e" : "var(--coral)" }} /></div>
        <h3 className={styles.quizDoneTitle}>{won ? t("miniGames.penalty.youWin") : draw ? t("miniGames.superOver.tied") : t("miniGames.penalty.youLose")}</h3>
        <p className={styles.quizDoneScore}>{playerRuns}/{playerWickets} vs {botRuns}/{botWickets}</p>
        <p className={styles.quizDoneSub}>{totalScore} pts earned</p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
        </button>
      </div>
    );
  }

  const bowlLabels: { type: ShotType; label: string; risk: string }[] = [
    { type: "defensive", label: t("miniGames.superOver.goodLength"), risk: t("miniGames.superOver.tightLine") },
    { type: "normal", label: t("miniGames.superOver.shortBall"), risk: t("miniGames.superOver.bouncer") },
    { type: "aggressive", label: t("miniGames.superOver.yorker"), risk: t("miniGames.superOver.deathBowling") },
    { type: "slog", label: t("miniGames.superOver.slowerBall"), risk: t("miniGames.superOver.variation") },
  ];

  return (
    <div className={styles.superOverWrap}>
      <div className={styles.soScoreboard}>
        <div className={styles.soTeam}>
          <div className={styles.soTeamLabel}>{t("miniGames.superOver.you")}</div>
          <div className={styles.soTeamScore}>{playerRuns}<span style={{ fontSize: 14, color: "var(--text-mute)" }}>/{playerWickets}</span></div>
        </div>
        <div className={styles.soVs}>vs</div>
        <div className={styles.soTeam}>
          <div className={styles.soTeamLabel}>{t("miniGames.superOver.bot")}</div>
          <div className={styles.soTeamScore}>{botRuns}<span style={{ fontSize: 14, color: "var(--text-mute)" }}>/{botWickets}</span></div>
        </div>
      </div>
      <div className={styles.soPhase}>
        {phase === "bat" ? t("miniGames.superOver.yourBatting") : t("miniGames.superOver.yourBowling")}
        {" "}({t("miniGames.superOver.ball")} {ball + 1}/{totalBalls})
      </div>
      <div className={styles.soBallsRow}>
        {ballResults.map((r, i) => (
          <div key={i} className={`${styles.soBall} ${r === "W" ? styles.soBallWicket : styles.soBallDone}`}>{r}</div>
        ))}
        {ball < totalBalls && <div className={`${styles.soBall} ${styles.soBallActive}`}>{ball + 1}</div>}
        {Array.from({ length: Math.max(0, totalBalls - ballResults.length - 1) }).map((_, i) => (
          <div key={`e-${i}`} className={styles.soBall}>{ballResults.length + i + 2}</div>
        ))}
      </div>
      <div className={styles.soShotGrid}>
        {(phase === "bat" ? SHOTS : bowlLabels).map(s => (
          <button key={s.type} className={styles.soShotBtn} onClick={() => phase === "bat" ? playBatShot(s.type) : playBowl(s.type)} disabled={waiting}>
            {s.label}
            <span className={styles.soShotRisk}>{s.risk}</span>
          </button>
        ))}
      </div>
      {lastOutcome && (
        <div className={styles.soResultBanner} style={{
          color: lastOutcome === t("miniGames.superOver.six") || lastOutcome === t("miniGames.superOver.four") || lastOutcome === t("miniGames.superOver.wicketGotThem") ? "#22c55e" : lastOutcome === t("miniGames.superOver.wicketOut") || lastOutcome === t("miniGames.superOver.sixConceded") || lastOutcome === t("miniGames.superOver.fourConceded") || lastOutcome.includes(t("miniGames.superOver.conceded")) ? "var(--coral)" : "var(--ink)",
          background: lastOutcome === t("miniGames.superOver.six") || lastOutcome === t("miniGames.superOver.four") || lastOutcome === t("miniGames.superOver.wicketGotThem") ? "rgba(34,197,94,0.1)" : lastOutcome === t("miniGames.superOver.wicketOut") || lastOutcome === t("miniGames.superOver.sixConceded") || lastOutcome === t("miniGames.superOver.fourConceded") || lastOutcome.includes(t("miniGames.superOver.conceded")) ? "rgba(239,68,68,0.08)" : "var(--surface-2)",
        }}>
          {lastOutcome}
        </div>
      )}
    </div>
  );
}

/* ── Free Throw Game (Basketball) ──────────────────────────── */

function FreeThrowGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLanguage();
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [meterPos, setMeterPos] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [result, setResult] = useState<"made" | "missed" | null>(null);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(true);
  const meterRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const dirRef = useRef(1);

  const totalAttempts = 10;
  // Sweet spot: 40-60% of the bar
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
    setShooting(true);
    setRunning(false);

    const made = meterPos >= sweetMin && meterPos <= sweetMax;
    setResult(made ? "made" : "missed");
    if (made) setScore(s => s + 10);
    setResults(r => [...r, made]);

    setTimeout(() => {
      if (attempt + 1 >= totalAttempts) {
        setDone(true);
      } else {
        setAttempt(a => a + 1);
        setShooting(false);
        setResult(null);
        setRunning(true);
      }
    }, 1200);
  };

  useEffect(() => {
    if (done && !submitted) {
      setSubmitted(true);
      submitScore("sport_game", "basketball", score).then(() => onComplete(score));
    }
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
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Disc size={36} strokeWidth={1.5} style={{ color: "var(--orange)" }} /></div>
        <h3 className={styles.quizDoneTitle}>{t("miniGames.freeThrow.complete")}</h3>
        <p className={styles.quizDoneScore}>{made}/{totalAttempts}</p>
        <p className={styles.quizDoneSub}>
          {made >= 9 ? t("miniGames.freeThrow.clutch") : made >= 7 ? t("miniGames.freeThrow.solid") : made >= 5 ? t("miniGames.freeThrow.decent") : t("miniGames.freeThrow.needPractice")}
          {" "}{score} pts
        </p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.ftWrap}>
      <div className={styles.ftHeader}>
        <span className={styles.ftAttempt}>Shot {attempt + 1} / {totalAttempts}</span>
        <span className={styles.ftScore}>{score} pts</span>
      </div>
      <div className={styles.ftCourt}>
        <div className={`${styles.ftHoop} ${result === "made" ? styles.ftHoopMade : result === "missed" ? styles.ftHoopMissed : ""}`}>
          <Disc size={28} strokeWidth={1.5} style={{ color: result === "made" ? "#22c55e" : result === "missed" ? "var(--coral)" : "var(--orange)" }} />
        </div>
        <div className={styles.ftMeterWrap} onClick={shoot}>
          <div className={styles.ftSweetSpot} style={{ left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%` }} />
          <div className={styles.ftMeterFill} style={{
            width: `${meterPos}%`,
            background: meterPos >= sweetMin && meterPos <= sweetMax ? "#22c55e" : "var(--coral)",
          }} />
          <div className={styles.ftMeterMarker} style={{ left: `${meterPos}%` }} />
        </div>
        <button className={styles.ftShootBtn} onClick={shoot} disabled={shooting}>
          {shooting ? (result === "made" ? t("miniGames.freeThrow.swish") : t("miniGames.freeThrow.clank")) : t("miniGames.freeThrow.shoot")}
        </button>
      </div>
      {result && (
        <div className={styles.ftResult} style={{ color: result === "made" ? "#22c55e" : "var(--coral)" }}>
          {result === "made" ? t("miniGames.freeThrow.nothingButNet") : t("miniGames.freeThrow.offTheRim")}
        </div>
      )}
      <div className={styles.ftDots}>
        {results.map((r, i) => (
          <div key={i} className={`${styles.ftDot} ${r ? styles.ftDotMade : styles.ftDotMissed}`} />
        ))}
        {Array.from({ length: totalAttempts - results.length }).map((_, i) => (
          <div key={`e-${i}`} className={styles.ftDot} />
        ))}
      </div>
    </div>
  );
}

/* ── Pit Stop Game (F1) ────────────────────────────────────── */

const TIRE_LABELS = ["Front Left", "Front Right", "Rear Left", "Rear Right"];

function PitStopGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLanguage();
  const [gameState, setGameState] = useState<"idle" | "running" | "done">("idle");
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
    setGameState("running");
    setActiveTire(-1);
    setElapsed(0);

    // Random delay before first tire lights up (0.5-1.5s)
    setTimeout(() => {
      const now = Date.now();
      setStartTime(now);
      setActiveTire(order[0]);
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - now);
      }, 50);
    }, 500 + Math.random() * 1000);
  };

  const hitTire = (tireIdx: number) => {
    if (gameState !== "running" || tireIdx !== activeTire) return;

    const newDone = [...tiresDone];
    newDone[tireIdx] = true;
    setTiresDone(newDone);

    const doneCount = newDone.filter(Boolean).length;
    if (doneCount >= 4) {
      clearInterval(timerRef.current);
      const total = Date.now() - startTime;
      setFinalTime(total);
      setElapsed(total);
      setActiveTire(-1);
      setGameState("done");
    } else {
      // Next tire with small delay
      setActiveTire(-1);
      setTimeout(() => {
        const nextIdx = tireOrder.current[doneCount];
        setActiveTire(nextIdx);
      }, 150 + Math.random() * 200);
    }
  };

  useEffect(() => {
    if (gameState === "done" && !submitted) {
      setSubmitted(true);
      const secs = finalTime / 1000;
      const pts = secs < 2.0 ? 50 : secs < 2.5 ? 40 : secs < 3.0 ? 30 : secs < 4.0 ? 20 : 10;
      submitScore("sport_game", "f1", pts).then(() => onComplete(pts));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const restart = () => {
    clearInterval(timerRef.current);
    setGameState("idle"); setActiveTire(-1); setTiresDone([false, false, false, false]);
    setElapsed(0); setFinalTime(0); setSubmitted(false);
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + "s";

  if (gameState === "done") {
    const secs = finalTime / 1000;
    const pts = secs < 2.0 ? 50 : secs < 2.5 ? 40 : secs < 3.0 ? 30 : secs < 4.0 ? 20 : 10;
    const rating = secs < 2.0 ? t("miniGames.pitStop.redBull") : secs < 2.5 ? t("miniGames.pitStop.worldClass") : secs < 3.0 ? t("miniGames.pitStop.solidStop") : secs < 4.0 ? t("miniGames.pitStop.needsPractice") : t("miniGames.pitStop.slowStop");
    const ratingColor = secs < 2.0 ? "#22c55e" : secs < 2.5 ? "var(--accent)" : secs < 3.0 ? "var(--orange)" : "var(--coral)";
    return (
      <div className={styles.quizDone}>
        <div className={styles.quizEmoji}><Timer size={36} strokeWidth={1.5} style={{ color: ratingColor }} /></div>
        <h3 className={styles.quizDoneTitle}>{t("miniGames.pitStop.complete")}</h3>
        <p className={styles.quizDoneScore}>{formatTime(finalTime)}</p>
        <p className={styles.pitStopRating} style={{ color: ratingColor }}>{rating}</p>
        <p className={styles.quizDoneSub}>{pts} pts earned</p>
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> {t("miniGames.playAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pitStopWrap}>
      <div className={styles.pitStopHeader}>
        <div className={styles.pitStopTimer}>
          {gameState === "running" ? formatTime(elapsed) : "0.00s"}
        </div>
        <div className={styles.pitStopPhase}>
          {gameState === "idle" ? t("miniGames.pitStop.pressStart") : activeTire === -1 ? t("miniGames.pitStop.getReady") : t("miniGames.pitStop.changeTire")}
        </div>
      </div>
      <div className={styles.pitStopCar}>
        {[0, 1, 2, 3].map(i => {
          const isReady = activeTire === i;
          const isDone = tiresDone[i];
          return (
            <button key={i}
              className={`${styles.tireSlot} ${isDone ? styles.tireSlotDone : isReady ? styles.tireSlotReady : styles.tireSlotWaiting}`}
              onClick={() => hitTire(i)}
              disabled={!isReady}
            >
              <Disc size={28} strokeWidth={2} style={{ color: isDone ? "#22c55e" : isReady ? "var(--orange)" : "var(--text-mute)" }} />
              <span className={`${styles.tireLabel} ${isDone ? styles.tireLabelDone : isReady ? styles.tireLabelReady : ""}`}>
                {TIRE_LABELS[i]}
              </span>
            </button>
          );
        })}
      </div>
      {gameState === "idle" && (
        <button className={styles.pitStopStartBtn} onClick={start}>
          {t("miniGames.pitStop.startPitStop")}
        </button>
      )}
    </div>
  );
}

/* ── Sport-specific game configs ───────────────────────────── */

type GameType = "quiz" | "guess" | "predictor" | "penalty" | "superover" | "freethrow" | "pitstop";

const SPORT_GAMES: Record<string, { type: GameType; labelKey: string; icon: typeof HelpCircle }[]> = {
  football: [
    { type: "quiz", labelKey: "miniGames.quiz.name", icon: HelpCircle },
    { type: "guess", labelKey: "miniGames.guessPlayer.name", icon: User },
    { type: "predictor", labelKey: "miniGames.predictor.name", icon: Zap },
    { type: "penalty", labelKey: "miniGames.penalty.name", icon: Target },
  ],
  cricket: [
    { type: "quiz", labelKey: "miniGames.quiz.name", icon: HelpCircle },
    { type: "guess", labelKey: "miniGames.guessPlayer.name", icon: User },
    { type: "predictor", labelKey: "miniGames.predictor.name", icon: Zap },
    { type: "superover", labelKey: "miniGames.superOver.name", icon: CircleDot },
  ],
  basketball: [
    { type: "quiz", labelKey: "miniGames.quiz.name", icon: HelpCircle },
    { type: "guess", labelKey: "miniGames.guessPlayer.name", icon: User },
    { type: "predictor", labelKey: "miniGames.predictor.name", icon: Zap },
    { type: "freethrow", labelKey: "miniGames.freeThrow.name", icon: Disc },
  ],
  f1: [
    { type: "quiz", labelKey: "miniGames.quiz.name", icon: HelpCircle },
    { type: "guess", labelKey: "miniGames.guessDriver.name", icon: User },
    { type: "predictor", labelKey: "miniGames.predictor.name", icon: Zap },
    { type: "pitstop", labelKey: "miniGames.pitStop.name", icon: Timer },
  ],
};

const DEFAULT_GAMES: { type: GameType; labelKey: string; icon: typeof HelpCircle }[] = [
  { type: "quiz", labelKey: "miniGames.quiz.name", icon: HelpCircle },
  { type: "guess", labelKey: "miniGames.guessPlayer.name", icon: User },
  { type: "predictor", labelKey: "miniGames.predictor.name", icon: Zap },
];

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
  const { t } = useLanguage();
  const { activeSport, activeSportConfig } = useActiveSport();
  const [activeGame, setActiveGame] = useState<GameType>("quiz");
  const [quizKey, setQuizKey] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbGame, setLbGame] = useState<"quiz" | "player_guess" | "sport_game">("quiz");
  const [lbLoading, setLbLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (game_type: "quiz" | "player_guess" | "sport_game") => {
    setLbLoading(true);
    try {
      const res = await fetch(`/api/game-scores?game_type=${game_type}`);
      const json = await res.json() as { leaderboard: LeaderboardEntry[] };
      setLeaderboard(json.leaderboard ?? []);
    } catch { setLeaderboard([]); }
    setLbLoading(false);
  }, []);

  useEffect(() => { fetchLeaderboard(lbGame); }, [lbGame, fetchLeaderboard]);
  useEffect(() => {
    setQuizKey(k => k + 1);
    // Reset to quiz if current game isn't available for the new sport
    const availableGames = SPORT_GAMES[activeSport] ?? DEFAULT_GAMES;
    if (!availableGames.some(g => g.type === activeGame)) {
      setActiveGame("quiz");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSport]);

  const handleGameComplete = (score: number) => {
    if (score > 0) fetchLeaderboard(lbGame);
  };

  return (
    <AppShell active="minigames" title="Mini Games" titleKey="miniGames.title" subtitleKey="miniGames.subtitle">
      <div className="stack">
        <AdSlot size="banner" />
        {/* Leaderboard */}
        <section className="section">
          <div className="sec-head">
            <div className="title"><Medal size={17} className="title-icon" strokeWidth={2} /> {t("miniGames.weekly")} <span className="accent">{t("miniGames.leaderboard")}</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setLbGame("quiz")}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
                  background: lbGame === "quiz" ? "var(--accent)" : "transparent",
                  color: lbGame === "quiz" ? "#000" : "var(--text-dim)" }}
              >{t("miniGames.leaderboardTab.trivia")}</button>
              <button
                onClick={() => setLbGame("player_guess")}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
                  background: lbGame === "player_guess" ? "var(--accent)" : "transparent",
                  color: lbGame === "player_guess" ? "#000" : "var(--text-dim)" }}
              >{t("miniGames.leaderboardTab.guess")}</button>
              <button
                onClick={() => setLbGame("sport_game")}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
                  background: lbGame === "sport_game" ? "var(--accent)" : "transparent",
                  color: lbGame === "sport_game" ? "#000" : "var(--text-dim)" }}
              >{t("miniGames.leaderboardTab.games")}</button>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-mute)", alignSelf: "center", marginInlineStart: 4 }}>{t("miniGames.resetsDay")}</span>
            </div>
          </div>
          <div className={styles.leaderboard}>
            {lbLoading ? (
              <div className={styles.lbRow} style={{ justifyContent: "center", padding: "20px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)" }}>{t("common.loading")}</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className={styles.lbRow} style={{ justifyContent: "center", padding: "28px 20px", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Medal size={28} strokeWidth={1.5} style={{ color: "var(--text-mute)", opacity: 0.4 }} />
                <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)", textAlign: "center", margin: 0 }}>
                  {t("miniGames.noScoresYet")}<br />{t("miniGames.playToClaimTop")}
                </p>
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className={styles.lbRow}>
                  <span className={styles.lbRank} style={{ color: RANK_COLORS[i] ?? "var(--text-mute)", fontWeight: 700 }}>
                    {RANK_LABELS[i] ?? `${i + 1}th`}
                  </span>
                  <span className={styles.lbName}>{entry.username}</span>
                  <span className={styles.lbSport} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-mute)", marginInlineStart: "auto", marginInlineEnd: 12 }}>
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
            <div className="title"><Gamepad2 size={17} className="title-icon" strokeWidth={2} /> {activeSportConfig.icon} {t("miniGames.games")}</div>
          </div>

          <div className={styles.gameTabs}>
            {(SPORT_GAMES[activeSport] ?? DEFAULT_GAMES).map(g => (
              <button key={g.type} className={`${styles.gameTab}${activeGame === g.type ? " " + styles.gameTabActive : ""}`}
                onClick={() => setActiveGame(g.type)}>
                <g.icon size={15} strokeWidth={2} /> {t(g.labelKey)}
              </button>
            ))}
          </div>

          {activeGame === "quiz" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {activeSportConfig.label} {t("miniGames.quiz.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.newQuiz")}
                </button>
              </div>
              <QuizGame key={`${activeSport}-${quizKey}`} sport={activeSport} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "guess" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {t("miniGames.guessPlayer.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.newRound")}
                </button>
              </div>
              <PlayerGuessGame key={`guess-${activeSport}-${quizKey}`} sport={activeSport} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "predictor" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>
                {activeSportConfig.icon} {t("miniGames.predictor.desc")}
              </p>
              <PredictorGame key={activeSport} sport={activeSport} />
            </div>
          )}

          {activeGame === "penalty" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {t("miniGames.penalty.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.restart")}
                </button>
              </div>
              <PenaltyKickGame key={`pk-${quizKey}`} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "superover" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {t("miniGames.superOver.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.restart")}
                </button>
              </div>
              <SuperOverGame key={`so-${quizKey}`} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "freethrow" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {t("miniGames.freeThrow.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.restart")}
                </button>
              </div>
              <FreeThrowGame key={`ft-${quizKey}`} onComplete={handleGameComplete} />
            </div>
          )}

          {activeGame === "pitstop" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {activeSportConfig.icon} {t("miniGames.pitStop.desc")}
                </p>
                <button className={styles.restartBtn} onClick={() => setQuizKey(k => k + 1)}>
                  <RefreshCw size={12} strokeWidth={2} /> {t("miniGames.restart")}
                </button>
              </div>
              <PitStopGame key={`ps-${quizKey}`} onComplete={handleGameComplete} />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
