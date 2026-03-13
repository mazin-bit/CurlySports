// @ts-nocheck
/**
 * Mini games for Basketball and F1: small, interactive, addictive.
 * - Basketball: Buzzer Beater (shot clock), Free Throw Streak (timing meter)
 * - F1: Start Lights (reaction), Pit Stop (tap order speed)
 */
import React from 'react';
import '../styles/MiniGames.css';

// ----- Basketball: Buzzer Beater -----
export function BuzzerBeater() {
  const [phase, setPhase] = React.useState('idle'); // idle | countdown | result
  const [shotTime, setShotTime] = React.useState(null);
  const [displayClock, setDisplayClock] = React.useState(5);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [lastPoints, setLastPoints] = React.useState(0);
  const countdownRef = React.useRef(null);
  const startRef = React.useRef(null);

  const start = () => {
    setPhase('countdown');
    setShotTime(null);
    setDisplayClock(5);
    startRef.current = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, 5 - elapsed);
      setDisplayClock(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setPhase('result');
        setShotTime(5);
        setStreak(0);
      }
    }, 50);
  };

  const shoot = () => {
    if (phase !== 'countdown') return;
    clearInterval(countdownRef.current);
    const elapsed = (Date.now() - startRef.current) / 1000;
    const remaining = Math.max(0, 5 - elapsed);
    setShotTime(remaining);
    setPhase('result');
    const diff = Math.abs(remaining - 0.7);
    const points = diff <= 0.5 ? Math.max(0, Math.round(100 - diff * 150)) : 0;
    const made = points >= 50;
    if (made) {
      setLastPoints(points);
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      setBest((b) => Math.max(b, score + points));
    } else {
      setStreak(0);
      setLastPoints(0);
    }
  };

  React.useEffect(() => () => clearInterval(countdownRef.current), []);

  return (
    <div className="minigame-card minigame-buzzer">
      <h4 className="minigame-title">
        <span className="material-icons-round">timer</span> Buzzer Beater
      </h4>
      <p className="minigame-desc">Tap SHOOT when the shot clock is in the green zone (last ~1s).</p>
      {phase === 'idle' && (
        <button type="button" className="minigame-btn minigame-btn-primary" onClick={start}>
          Start countdown
        </button>
      )}
      {phase === 'countdown' && (
        <div className="minigame-buzzer-zone" onClick={shoot} role="button" tabIndex={0} onKeyDown={(e) => e.key === ' ' && shoot()}>
          <div className="minigame-buzzer-bar-wrap">
            <div className="minigame-buzzer-bar" style={{ width: `${Math.max(0, (displayClock / 5) * 100)}%` }} />
            <div className="minigame-buzzer-green" style={{ left: '0%', width: '20%' }} />
          </div>
          <div className="minigame-buzzer-timer">{Math.max(0, Math.ceil(displayClock * 10) / 10).toFixed(1)}s</div>
          <button type="button" className="minigame-btn minigame-btn-shoot">SHOOT</button>
        </div>
      )}
      {phase === 'result' && (
        <div className="minigame-result">
          <p className="minigame-result-text">
            {shotTime <= 1.2 && shotTime >= 0.2 ? `🎯 Bucket! +${lastPoints} pts` : 'Airball! Try again.'}
          </p>
          <p className="minigame-stats">Score: {score} · Streak: {streak} · Best: {best}</p>
          <button type="button" className="minigame-btn" onClick={() => setPhase('idle')}>Again</button>
        </div>
      )}
    </div>
  );
}

// ----- Basketball: Free Throw Streak -----
export function FreeThrowStreak() {
  const [phase, setPhase] = React.useState('idle');
  const [streak, setStreak] = React.useState(0);
  const [needle, setNeedle] = React.useState(50);
  const [dir, setDir] = React.useState(1);
  const [best, setBest] = React.useState(0);
  const tickRef = React.useRef(null);

  React.useEffect(() => {
    if (phase !== 'play') return;
    tickRef.current = setInterval(() => {
      setNeedle((n) => {
        let next = n + dir * 4;
        if (next >= 100) { setDir(-1); next = 100; }
        if (next <= 0) { setDir(1); next = 0; }
        return next;
      });
    }, 40);
    return () => clearInterval(tickRef.current);
  }, [phase, dir]);

  const shoot = () => {
    if (phase !== 'play') return;
    const inZone = needle >= 45 && needle <= 55;
    if (inZone) {
      setStreak((s) => s + 1);
      setBest((b) => Math.max(b, streak + 1));
    } else {
      setStreak(0);
      setPhase('miss');
      return;
    }
  };

  return (
    <div className="minigame-card minigame-freethrow">
      <h4 className="minigame-title">
        <span className="material-icons-round">sports_basketball</span> Free Throw Streak
      </h4>
      <p className="minigame-desc">Tap when the needle is in the green zone. Build a streak!</p>
      {phase === 'idle' && (
        <button type="button" className="minigame-btn minigame-btn-primary" onClick={() => setPhase('play')}>
          Start
        </button>
      )}
      {phase === 'play' && (
        <div className="minigame-freethrow-wrap">
          <div className="minigame-freethrow-meter">
            <div className="minigame-freethrow-green" />
            <div className="minigame-freethrow-needle" style={{ left: `${needle}%` }} />
          </div>
          <p className="minigame-stats">Streak: {streak} · Best: {best}</p>
          <button type="button" className="minigame-btn minigame-btn-shoot" onClick={shoot}>Release</button>
        </div>
      )}
      {phase === 'miss' && (
        <div className="minigame-result">
          <p className="minigame-result-text">Miss! Best streak: {best}</p>
          <button type="button" className="minigame-btn" onClick={() => { setPhase('idle'); setStreak(0); }}>Again</button>
        </div>
      )}
    </div>
  );
}

// ----- F1: Start Lights (reaction) -----
export function F1StartLights() {
  const [phase, setPhase] = React.useState('idle'); // idle | lights | go
  const [reactionMs, setReactionMs] = React.useState(null);
  const [best, setBest] = React.useState(null);
  const goAtRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  const start = () => {
    setPhase('lights');
    setReactionMs(null);
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setPhase('go');
      goAtRef.current = Date.now();
    }, delay);
  };

  const react = () => {
    if (phase !== 'go') return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const ms = Math.round(Date.now() - goAtRef.current);
    setReactionMs(ms);
    setBest((b) => (b == null ? ms : Math.min(b, ms)));
    setPhase('result');
  };

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="minigame-card minigame-startlights">
      <h4 className="minigame-title">
        <span className="material-icons-round">traffic</span> Start Lights
      </h4>
      <p className="minigame-desc">When all 5 lights go out, tap GO as fast as you can.</p>
      {phase === 'idle' && (
        <button type="button" className="minigame-btn minigame-btn-primary" onClick={start}>Lights on</button>
      )}
      {(phase === 'lights' || phase === 'go') && (
        <div
          className={`minigame-lights ${phase === 'go' ? 'go' : ''}`}
          onClick={react}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === ' ' && react()}
        >
          <div className="minigame-light" /><div className="minigame-light" /><div className="minigame-light" /><div className="minigame-light" /><div className="minigame-light" />
          <button type="button" className="minigame-btn minigame-btn-go">GO!</button>
        </div>
      )}
      {phase === 'result' && (
        <div className="minigame-result">
          <p className="minigame-result-text">{reactionMs} ms</p>
          <p className="minigame-stats">Best: {best} ms</p>
          <button type="button" className="minigame-btn" onClick={() => setPhase('idle')}>Again</button>
        </div>
      )}
    </div>
  );
}

// ----- F1: Pit Stop (tap order speed) -----
export function F1PitStop() {
  const [phase, setPhase] = React.useState('idle');
  const [order, setOrder] = React.useState([]);
  const [next, setNext] = React.useState(0);
  const [timeMs, setTimeMs] = React.useState(null);
  const [best, setBest] = React.useState(null);
  const startRef = React.useRef(null);

  const start = () => {
    const arr = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    setOrder(arr);
    setNext(0);
    setTimeMs(null);
    startRef.current = Date.now();
    setPhase('play');
  };

  const tap = (i) => {
    if (phase !== 'play' || order[next] !== i) return;
    if (next === 3) {
      setTimeMs(Date.now() - startRef.current);
      setBest((b) => (b == null ? Date.now() - startRef.current : Math.min(b, Date.now() - startRef.current)));
      setPhase('result');
    } else {
      setNext((n) => n + 1);
    }
  };

  const labels = ['FL', 'FR', 'RL', 'RR'];

  return (
    <div className="minigame-card minigame-pitstop">
      <h4 className="minigame-title">
        <span className="material-icons-round">settings</span> Pit Stop
      </h4>
      <p className="minigame-desc">Tap the tyres in the order they light up. Fast as the crew!</p>
      {phase === 'idle' && (
        <button type="button" className="minigame-btn minigame-btn-primary" onClick={start}>Start</button>
      )}
      {phase === 'play' && (
        <div className="minigame-pitstop-tyres">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              className={`minigame-tyre ${order[next] === i ? 'active' : ''}`}
              onClick={() => tap(i)}
            >
              {labels[i]}
            </button>
          ))}
        </div>
      )}
      {phase === 'result' && (
        <div className="minigame-result">
          <p className="minigame-result-text">{timeMs} ms</p>
          <p className="minigame-stats">Best: {best} ms</p>
          <button type="button" className="minigame-btn" onClick={() => setPhase('idle')}>Again</button>
        </div>
      )}
    </div>
  );
}

// ----- Wrappers for sport-specific views (one game per sport) -----
export function BasketballMiniGames() {
  return (
    <div className="minigames-section">
      <h3 className="minigames-section-title">Basketball mini game</h3>
      <div className="minigames-grid">
        <BuzzerBeater />
      </div>
    </div>
  );
}

export function F1MiniGames() {
  return (
    <div className="minigames-section">
      <h3 className="minigames-section-title">F1 mini game</h3>
      <div className="minigames-grid">
        <F1StartLights />
      </div>
    </div>
  );
}
