// @ts-nocheck
import React, { useState } from 'react';

const SUPER_OVER_SHOTS = [
  { id: 'block', label: 'Block', icon: 'shield', desc: 'Safe run', weight: 0 },
  { id: 'drive', label: 'Drive', icon: 'sports_martial_arts', desc: 'Boundary chance', weight: 1 },
  { id: 'six', label: 'Swing', icon: 'rocket_launch', desc: 'Go big', weight: 2 }
];

function getSuperOverOutcome(shotId) {
  const r = Math.random();
  if (shotId === 'block') {
    if (r < 0.02) return { runs: 0, text: 'Dot ball', wicket: true };
    if (r < 0.55) return { runs: 0, text: 'Dot ball', wicket: false };
    if (r < 0.88) return { runs: 1, text: 'Single', wicket: false };
    if (r < 0.97) return { runs: 2, text: 'Two runs', wicket: false };
    return { runs: 4, text: 'FOUR!', wicket: false };
  }
  if (shotId === 'drive') {
    if (r < 0.05) return { runs: 0, text: 'OUT! Caught.', wicket: true };
    if (r < 0.35) return { runs: 0, text: 'Dot', wicket: false };
    if (r < 0.60) return { runs: 1, text: 'Single', wicket: false };
    if (r < 0.80) return { runs: 2, text: 'Two runs', wicket: false };
    if (r < 0.95) return { runs: 4, text: 'FOUR!', wicket: false };
    return { runs: 6, text: 'SIX!', wicket: false };
  }
  // six
  if (r < 0.08) return { runs: 0, text: 'OUT!', wicket: true };
  if (r < 0.22) return { runs: 0, text: 'Dot', wicket: false };
  if (r < 0.42) return { runs: 1, text: 'Single', wicket: false };
  if (r < 0.58) return { runs: 2, text: 'Two', wicket: false };
  if (r < 0.78) return { runs: 4, text: 'FOUR!', wicket: false };
  return { runs: 6, text: 'SIX!', wicket: false };
}

const SuperOverGame = ({ triggerCelebration, bestScore = 0, onBestScore }) => {
  const [ball, setBall] = useState(0);
  const [score, setScore] = useState(0);
  const [out, setOut] = useState(false);
  const [ballResults, setBallResults] = useState([]);
  const [message, setMessage] = useState('Pick your shot!');
  const [isHitting, setIsHitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const totalBalls = 6;
  const canPlay = !gameOver && !out && ball < totalBalls && !isHitting;

  const playShot = (shotId) => {
    if (!canPlay) return;
    setIsHitting(true);
    setMessage('...');

    setTimeout(() => {
      const outcome = getSuperOverOutcome(shotId);
      const display = outcome.wicket ? 'W' : String(outcome.runs);
      setBallResults(prev => [...prev, display]);
      setScore(prev => prev + (outcome.wicket ? 0 : outcome.runs));
      setMessage(outcome.text);
      if (outcome.runs >= 4) triggerCelebration(outcome.runs === 6 ? 'SIX!' : 'FOUR!', 'SUPER OVER');

      if (outcome.wicket || ball + 1 >= totalBalls) {
        setGameOver(true);
        setOut(prev => prev || outcome.wicket);
        const finalScore = score + (outcome.wicket ? 0 : outcome.runs);
        if (onBestScore && finalScore > bestScore) onBestScore(finalScore);
      } else {
        setBall(prev => prev + 1);
      }
      setIsHitting(false);
    }, 600);
  };

  const reset = () => {
    setBall(0);
    setScore(0);
    setOut(false);
    setBallResults([]);
    setMessage('Pick your shot!');
    setGameOver(false);
    setIsHitting(false);
  };

  return (
    <div className="game-container super-over-game animate-in">
      <div className="game-header super-over-header">
        <h3 className="game-header-title">
          <span className="material-icons-round game-header-icon" aria-hidden="true">sports_cricket</span>
          Super Over
        </h3>
        <div className="game-stats super-over-stats">
          <div className="stat-box">
            <span className="label">Runs</span>
            <span className="value super-over-score">{score}</span>
          </div>
          <div className="stat-box">
            <span className="label">Best</span>
            <span className="value">{bestScore}</span>
          </div>
        </div>
      </div>

      <div className="super-over-pitch">
        <div className="super-over-balls">
          {Array.from({ length: totalBalls }, (_, i) => (
            <span key={i} className={`ball-dot ${i < ballResults.length ? 'played' : ''} ${ballResults[i] === 'W' ? 'wicket' : ''}`}>
              {ballResults[i] || (i + 1)}
            </span>
          ))}
        </div>
        <div className={`super-over-message ${message.includes('!') ? 'highlight' : ''}`}>{message}</div>
      </div>

      {gameOver ? (
        <div className="super-over-result">
          <p className="super-over-final">You scored <strong>{score}</strong> runs{out ? ' (1 wicket)' : ''}.</p>
          {score >= bestScore && score > 0 && <p className="super-over-best">New best!</p>}
          <button type="button" className="game-btn super-over-play-again" onClick={reset}>
            <span className="material-icons-round">replay</span> Play Again
          </button>
        </div>
      ) : (
        <div className="super-over-controls">
          {SUPER_OVER_SHOTS.map(s => (
            <button
              key={s.id}
              type="button"
              className={`game-btn super-over-shot ${s.id}`}
              onClick={() => playShot(s.id)}
              disabled={!canPlay}
            >
              <span className="material-icons-round" aria-hidden="true">{s.icon}</span>
              <span className="shot-label">{s.label}</span>
              <span className="shot-desc">{s.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { SuperOverGame, SUPER_OVER_SHOTS, getSuperOverOutcome };
export default SuperOverGame;
