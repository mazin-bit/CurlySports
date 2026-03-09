// @ts-nocheck

// --- API Roots ---
export const SPORTS_API_SITE_ROOT = 'https://site.api.espn.com/apis/site/v2/sports';
export const SPORTS_API_V2_ROOT = 'https://site.api.espn.com/apis/v2/sports';

/** Fallback icon when a cricket league has no dedicated logo URL */
export const CRICKET_LEAGUE_ICON = 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-cricket.png';

export const SPORTS_CONFIG = {
  soccer: {
    label: 'Soccer',
    icon: 'sports_soccer',
    dataSource: 'ESPN Football Data',
    path: 'soccer',
    sources: [
      { name: 'ESPN FC', url: 'https://www.espn.com/soccer/' },
      { name: 'FotMob', url: 'https://www.fotmob.com/' },
      { name: 'SofaScore', url: 'https://www.sofascore.com/' }
    ],
    leagues: {
      ucl: 'uefa.champions',
      pl: 'eng.1',
      laliga: 'esp.1',
      bundesliga: 'ger.1',
      seriea: 'ita.1',
      ligue1: 'fra.1',
      eredivisie: 'ned.1'
    },
    leagueNames: {
      ucl: 'Champions League',
      pl: 'Premier League',
      laliga: 'La Liga',
      bundesliga: 'Bundesliga',
      seriea: 'Serie A',
      ligue1: 'Ligue 1',
      eredivisie: 'Eredivisie'
    },
    leagueLogos: {
      ucl: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
      pl: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
      laliga: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
      bundesliga: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
      seriea: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
      ligue1: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
      eredivisie: 'https://a.espncdn.com/i/leaguelogos/soccer/500/11.png'
    }
  },
  basketball: {
    label: 'Basketball',
    icon: 'sports_basketball',
    dataSource: 'ESPN Basketball (NBA, NCAA, WNBA)',
    path: 'basketball',
    sources: [
      { name: 'ESPN NBA', url: 'https://www.espn.com/nba/' },
      { name: 'ESPN College Basketball', url: 'https://www.espn.com/mens-college-basketball/' },
      { name: 'ESPN WNBA', url: 'https://www.espn.com/wnba/' }
    ],
    leagues: {
      nba: 'nba',
      ncaab: 'mens-college-basketball',
      wnba: 'wnba',
    },
    leagueNames: {
      nba: 'NBA',
      ncaab: "Men's College Basketball",
      wnba: 'WNBA',
    },
    leagueLogos: {
      nba: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
      ncaab: 'https://a.espncdn.com/i/teamlogos/leagues/500/ncaa.png',
      wnba: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
    }
  },
  football: {
    label: 'American Football',
    icon: 'sports_football',
    dataSource: 'ESPN NFL & College Football',
    path: 'football',
    sources: [
      { name: 'ESPN NFL', url: 'https://www.espn.com/nfl/' },
      { name: 'ESPN College Football', url: 'https://www.espn.com/college-football/' }
    ],
    leagues: { nfl: 'nfl', college: 'college-football' },
    leagueNames: { nfl: 'NFL', college: 'College Football' },
    leagueLogos: {
      nfl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
      college: 'https://a.espncdn.com/i/teamlogos/leagues/500/ncaa.png'
    }
  },
  baseball: {
    label: 'Baseball',
    icon: 'sports_baseball',
    dataSource: 'ESPN MLB',
    path: 'baseball',
    sources: [
      { name: 'MLB.com', url: 'https://www.mlb.com/' },
      { name: 'ESPN MLB', url: 'https://www.espn.com/mlb/' }
    ],
    leagues: { mlb: 'mlb' },
    leagueNames: { mlb: 'MLB' },
    leagueLogos: { mlb: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' }
  },
  hockey: {
    label: 'Hockey',
    icon: 'sports_hockey',
    dataSource: 'ESPN NHL',
    path: 'hockey',
    sources: [
      { name: 'NHL.com', url: 'https://www.nhl.com/' },
      { name: 'ESPN NHL', url: 'https://www.espn.com/nhl/' }
    ],
    leagues: { nhl: 'nhl' },
    leagueNames: { nhl: 'NHL' },
    leagueLogos: { nhl: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' }
  },
  cricket: {
    label: 'Cricket',
    icon: 'sports_cricket',
    dataSource: 'ESPNcricinfo (via ESPN)',
    path: 'cricket',
    sources: [
      { name: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/' },
      { name: 'Cricbuzz', url: 'https://www.cricbuzz.com/' }
    ],
    leagues: {
      ipl: '8048',
      bbl: '8044',
      psl: '12472',
      ilt20: '20921',
      sa20: '21275',
      t20wc: '8604',
      ranji: '8050',
      sheffield: '8043',
      county: '8049',
      icc_test: '12791',
      cpl: '12248',
      mlc: '21618',
      lpl: '12903'
    },
    /** League id for standings when different from leagues (PSL table uses series 8679) */
    standingsLeagueIds: { psl: '8679' },
    leagueNames: {
      ipl: 'Indian Premier League',
      bbl: 'Big Bash League',
      psl: 'Pakistan Super League',
      ilt20: 'International League T20',
      sa20: 'SA20',
      t20wc: 'ICC T20 World Cup',
      ranji: 'Ranji Trophy',
      sheffield: 'Sheffield Shield',
      county: 'County Championship',
      icc_test: 'ICC World Test Championship',
      cpl: 'Caribbean Premier League',
      mlc: 'Major League Cricket',
      lpl: 'Lanka Premier League'
    },
    /** Short names for sidebar nav to avoid truncation */
    leagueShortNames: {
      ipl: 'IPL',
      bbl: 'BBL',
      psl: 'PSL',
      ilt20: 'ILT20',
      sa20: 'SA20',
      t20wc: 'T20 World Cup',
      ranji: 'Ranji Trophy',
      sheffield: 'Sheffield Shield',
      county: 'County Champ.',
      icc_test: 'WTC',
      cpl: 'CPL',
      mlc: 'MLC',
      lpl: 'LPL'
    },
    leagueLogos: {
      ipl: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
      bbl: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
      psl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Psl-icon.png/128px-Psl-icon.png',
      ilt20: 'https://r2.thesportsdb.com/images/media/league/badge/omdaqg1721481629.png',
      sa20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/SA20-logo.svg/128px-SA20-logo.svg.png',
      t20wc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/T20_WC_Logo.png/128px-T20_WC_Logo.png',
      ranji: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Ranji_Trophy_logo.png/128px-Ranji_Trophy_logo.png',
      sheffield: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
      county: 'https://r2.thesportsdb.com/images/media/league/badge/d4q9uf1630694697.png',
      icc_test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/ICC_logo.png/128px-ICC_logo.png',
      cpl: 'https://a.espncdn.com/i/leaguelogos/cricket/500/12248.png',
      mlc: 'https://a.espncdn.com/i/leaguelogos/cricket/500/21618.png',
      lpl: 'https://a.espncdn.com/i/leaguelogos/cricket/500/12903.png'
    }
  },
  f1: {
    label: 'Formula 1',
    icon: 'sports_motorsports',
    dataSource: 'Formula 1 Championship Feed (via ESPN)',
    path: 'racing',
    sources: [
      { name: 'Formula1.com', url: 'https://www.formula1.com/' },
      { name: 'Motorsport.com', url: 'https://www.motorsport.com/' }
    ],
    leagues: { f1: 'f1' },
    leagueNames: { f1: 'F1 World Championship' },
    leagueLogos: { f1: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png' }
  }
};

/** Realistic sport decor: main = ball/equipment + stadium; extra = trophy, medal, flag, venue, scoreboard. */
export const SPORT_DECOR_ICONS = {
  soccer: { main: ['sports_soccer', 'stadium'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] },
  basketball: { main: ['sports_basketball', 'stadium'], extra: ['emoji_events', 'military_tech', 'schedule', 'place', 'fitness_center'] },
  football: { main: ['sports_football', 'stadium'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] },
  baseball: { main: ['sports_baseball', 'stadium'], extra: ['emoji_events', 'military_tech', 'place', 'schedule', 'sports'] },
  hockey: { main: ['sports_hockey', 'stadium'], extra: ['emoji_events', 'military_tech', 'ac_unit', 'place', 'schedule'] },
  cricket: { main: ['sports_cricket', 'stadium'], extra: ['emoji_events', 'military_tech', 'place', 'schedule', 'sports'] },
  f1: { main: ['sports_motorsports', 'speed'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] }
};

export const SPORTS_TABS = Object.keys(SPORTS_CONFIG);

/** Label/icon for a sport key; use when sport may have been added in Super Admin but not yet in SPORTS_CONFIG. */
export function getSportConfig(sportKey) {
  const c = SPORTS_CONFIG[sportKey];
  if (c) return c;
  const label = (sportKey || '').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { label: label || sportKey, icon: 'sports', path: sportKey };
}

/** Cricket leagues that have a knockout/playoff phase (show League Table | Knockout toggle) */
export const CRICKET_KNOCKOUT_LEAGUES = ['ipl', 'bbl', 'ilt20', 'sa20', 't20wc', 'psl', 'ranji'];

export const PLAYER_STATS_BY_SPORT = {
  soccer: { primary: 'G', secondary: 'A' },
  basketball: { primary: 'PTS', secondary: 'AST' },
  football: { primary: 'YDS', secondary: 'TD' },
  baseball: { primary: 'HR', secondary: 'RBI' },
  hockey: { primary: 'G', secondary: 'A' },
  cricket: { primary: 'Runs', secondary: 'Wkts' },
  f1: { primary: 'Wins', secondary: 'Podiums' }
};

// Sport-specific match detail configuration
export const MATCH_DETAIL_CONFIG = {
  soccer: {
    periodLabel: 'Half',
    periodNames: ['1st Half', '2nd Half', 'Extra Time'],
    fallbackStats: ['Possession', 'Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls', 'Offsides'],
    eventIcons: { goal: 'sports_soccer', card: 'warning', substitution: 'cached', penalty: 'sports_soccer', foul: 'warning' },
    scoreTerm: 'Goals',
    showLineups: true
  },
  basketball: {
    periodLabel: 'Quarter',
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
    fallbackStats: ['Field Goal %', 'Three Point %', 'Free Throw %', 'Rebounds', 'Assists', 'Turnovers', 'Steals', 'Blocks'],
    eventIcons: { goal: 'sports_basketball', foul: 'warning', timeout: 'timer', substitution: 'cached' },
    scoreTerm: 'Points',
    showLineups: false,
    showLeaders: true,
    leaderCategories: ['points', 'rebounds', 'assists']
  },
  football: {
    periodLabel: 'Quarter',
    periodNames: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
    fallbackStats: ['Total Yards', 'Passing Yards', 'Rushing Yards', 'First Downs', 'Turnovers', 'Time of Possession', 'Penalties'],
    eventIcons: { goal: 'sports_football', penalty: 'flag', timeout: 'timer', substitution: 'cached' },
    scoreTerm: 'Points',
    showLineups: false,
    showLeaders: true,
    leaderCategories: ['passingYards', 'rushingYards', 'receivingYards']
  },
  baseball: {
    periodLabel: 'Inning',
    periodNames: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Extra'],
    fallbackStats: ['Hits', 'Errors', 'Left on Base', 'Strikeouts', 'Walks', 'Home Runs'],
    eventIcons: { goal: 'sports_baseball', strikeout: 'close', homerun: 'rocket_launch', walk: 'directions_walk' },
    scoreTerm: 'Runs',
    showLineups: false,
    showLeaders: true,
    leaderCategories: ['battingAverage', 'homeRuns', 'rbi']
  },
  hockey: {
    periodLabel: 'Period',
    periodNames: ['1st Period', '2nd Period', '3rd Period', 'OT', 'SO'],
    fallbackStats: ['Shots', 'Hits', 'Blocked Shots', 'Power Plays', 'Penalty Minutes', 'Faceoff Wins', 'Giveaways', 'Takeaways'],
    eventIcons: { goal: 'sports_hockey', penalty: 'warning', save: 'security', powerplay: 'bolt' },
    scoreTerm: 'Goals',
    showLineups: false,
    showLeaders: true,
    leaderCategories: ['points', 'goals', 'assists']
  },
  cricket: {
    periodLabel: 'Innings',
    periodNames: ['1st Innings', '2nd Innings'],
    fallbackStats: ['Runs', 'Wickets', 'Overs', 'Run Rate', 'Extras', 'Boundaries'],
    eventIcons: { goal: 'sports_cricket', wicket: 'warning', boundary: 'sports_cricket', six: 'rocket_launch' },
    scoreTerm: 'Runs',
    showLineups: false,
    showLeaders: true,
    leaderCategories: ['batting', 'bowling']
  },
  f1: {
    periodLabel: 'Session',
    periodNames: ['Practice 1', 'Practice 2', 'Practice 3', 'Qualifying', 'Race'],
    fallbackStats: ['Laps Completed', 'Pit Stops', 'Fastest Lap', 'Top Speed'],
    eventIcons: { goal: 'sports_motorsports', pitstop: 'build', flag: 'flag', dnf: 'dangerous' },
    scoreTerm: 'Position',
    showLineups: false,
    showLeaders: false
  }
};

export const FALLBACK_TEAM_LOGO = 'https://via.placeholder.com/48?text=Team';
/** Data URI so league logos always show something when CDN fails (no network needed) */
export const FALLBACK_LEAGUE_LOGO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="%2364748b" stroke-width="2" fill="%23f1f5f9"/><path d="M24 14v20M14 24h20" stroke="%2394a3b8" stroke-width="1.5"/><circle cx="24" cy="24" r="6" fill="%2364748b"/></svg>');
export const FALLBACK_PLAYER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#334155"><rect width="200" height="200"/><circle cx="100" cy="72" r="28" fill="#64748b"/><ellipse cx="100" cy="165" rx="45" ry="38" fill="#64748b"/></svg>');
export const FALLBACK_NEWS_IMAGE = 'https://via.placeholder.com/400x200?text=News';
