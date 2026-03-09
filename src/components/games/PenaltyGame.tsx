// @ts-nocheck
import React, { useState } from 'react';

const PenaltyGame = ({ triggerCelebration, bestScore = 0, onBestScore }) => {
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Choose where to shoot!');
  const [isShooting, setIsShooting] = useState(false);

  const shoot = (zone) => {
    if (isShooting) return;
    setIsShooting(true);
    setMessage('Shooting...');

    setTimeout(() => {
      const choices = ['left', 'center', 'right'];
      const keeperChoice = choices[Math.floor(Math.random() * 3)];

      if (zone === keeperChoice) {
        setMessage('SAVED! \u{1F9E4} The keeper caught it.');
        setScore(0);
      } else {
        setMessage('GOAL! Great finish!');
        const newScore = score + 1;
        setScore(newScore);
        if (onBestScore && newScore > bestScore) {
          onBestScore(newScore);
        }
        triggerCelebration('GOAL!', 'PENALTY KING');
      }
      setIsShooting(false);
    }, 1000);
  };

  return (
    <div className="game-container animate-in">
      <div className="game-header">
        <h3 className="game-header-title">
          <span className="material-icons-round game-header-icon" aria-hidden="true">sports_soccer</span>
          Penalty Shootout
        </h3>
        <div className="game-stats">
          <div className="stat-box"><span className="label">Score</span><span className="value">{score}</span></div>
          <div className="stat-box"><span className="label">Best</span><span className="value">{bestScore}</span></div>
        </div>
      </div>
      <div className="simple-game-area">
        <div className="goal-simple">
          {['left', 'center', 'right'].map(z => (
            <div key={z} className="goal-section" onClick={() => shoot(z)}>
              <div className="zone-label" style={{ fontSize: '12px', fontWeight: 800 }}>{z.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="game-message" style={{ fontWeight: 700 }}>{message}</div>
      </div>
      <div className="game-controls">
        <button type="button" className="game-btn game-btn-shoot" onClick={() => shoot('left')}>
          <span className="material-icons-round" aria-hidden="true">arrow_back</span>
          <span>Left</span>
        </button>
        <button type="button" className="game-btn game-btn-shoot main" onClick={() => shoot('center')}>
          <span className="material-icons-round" aria-hidden="true">arrow_upward</span>
          <span>Center</span>
        </button>
        <button type="button" className="game-btn game-btn-shoot" onClick={() => shoot('right')}>
          <span className="material-icons-round" aria-hidden="true">arrow_forward</span>
          <span>Right</span>
        </button>
      </div>
    </div>
  );
};

export { PenaltyGame };
export default PenaltyGame;
