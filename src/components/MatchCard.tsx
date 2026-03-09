// @ts-nocheck
import React from 'react';

const MatchCard = ({ match, favorites, toggleFavorite, onOpen, showFavorite = true }) => {
  const isHomeFav = favorites.includes(match.home);
  const isAwayFav = favorites.includes(match.away);

  // Determine if we show score
  const showScore = match.isLive || match.isCompleted;

  return (
    <div className="match-card animate-in" onClick={() => onOpen(match)}>
      {match.isLive && <div className="live-badge"><div className="dot"></div>LIVE {match.status}</div>}
      <span className="league-label">{match.league}</span>
      <div className="teams">
        <div className={`team ${match.winner === 'home' ? 'winner' : ''}`}>
          <div className="team-info">
            <img loading="lazy" decoding="async" src={match.homeLogo} className="team-logo" alt={match.home} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
            <span className="team-name">{match.home}</span>
            {showFavorite && (
              <span className={`material-icons-round fav-star ${isHomeFav ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(match.home); }}>
                {isHomeFav ? 'star' : 'star_border'}
              </span>
            )}
          </div>
          <span className="score">{showScore ? match.homeScore : '0'}</span>
        </div>
        <div className={`team ${match.winner === 'away' ? 'winner' : ''}`}>
          <div className="team-info">
            <img loading="lazy" decoding="async" src={match.awayLogo} className="team-logo" alt={match.away} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
            <span className="team-name">{match.away}</span>
            {showFavorite && (
              <span className={`material-icons-round fav-star ${isAwayFav ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(match.away); }}>
                {isAwayFav ? 'star' : 'star_border'}
              </span>
            )}
          </div>
          <span className="score">{showScore ? match.awayScore : '0'}</span>
        </div>
      </div>
      {!match.isLive && <div className="match-time"><span className="material-icons-round" style={{ fontSize: '14px' }}>schedule</span> {match.time}</div>}
      {match.isCompleted && (
        <div className="match-status-complete" style={match.status?.includes('Pen') || match.statusDetail?.includes('Pen') ? { fontSize: '10px', padding: '2px 6px' } : {}}>
          {(match.status?.includes('Pen') || match.statusDetail?.includes('Pen') || match.status?.includes('AET'))
            ? (match.statusDetail?.replace(/Final/i, 'FT') || match.status)
            : 'FT'}
        </div>
      )}
    </div>
  );
};

export { MatchCard };
export default MatchCard;
