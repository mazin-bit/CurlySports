// @ts-nocheck
import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="live-clock">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

const SecondsAgo = ({ lastUpdate }) => {
  const [ago, setAgo] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    setAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    return () => clearInterval(t);
  }, [lastUpdate]);
  return (
    <span className="last-update-text">
      {ago < 2 ? 'Just now' : `${ago}s ago`}
    </span>
  );
};

const TopBar = ({ title, search, setSearch, lastUpdate, sourceLabel, sources, titleLogo, rightSlot }) => {
  return (
    <header className="top-bar">
      <div className="top-bar-header">
        {titleLogo && (
          <img loading="lazy" decoding="async" src={titleLogo} alt="" className="top-bar-title-logo" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <h2 id="page-title">{title}</h2>
        <div className="live-status-pill">
          <span className="pulse-dot"></span>
          LIVE
        </div>
      </div>
      <div className="top-bar-meta">
        <LiveClock />
        {lastUpdate && <SecondsAgo lastUpdate={lastUpdate} />}
        {sources && sources.length > 0 && (
          <div className="source-badges">
            <span className="source-label">Sources:</span>
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-badge">
                {s.name}
                <span className="material-icons-round" style={{ fontSize: 12 }}>open_in_new</span>
              </a>
            ))}
          </div>
        )}
        {rightSlot && <div className="top-bar-right-slot">{rightSlot}</div>}
      </div>
      <div className="search-bar">
        <span className="material-icons-round">search</span>
        <input
          type="text"
          placeholder="Search teams, players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </header>
  );
};

export { LiveClock, SecondsAgo, TopBar };
export default TopBar;
