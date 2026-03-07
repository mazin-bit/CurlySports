import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './public-pages.css';
import './theme-experiences.css';
import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setUserData,
  addLoginLog,
  subscribeUserData,
  subscribeAppConfig,
  getAppConfigFromServer,
  setAppConfig as updateAppConfig,
  buildSuperAdminEmailsMap
} from './firebase';
import { addNotification } from './NotificationsBell';
import SurveyInterests from './SurveyInterests';
import Dashboard from './Dashboard';
import NotificationsBell from './NotificationsBell';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { getCricketStandingsFallback, isCricketTableEmpty, getCricketSeasonYears } from './data/cricketStandingsFallback';
import { getCricketKnockoutFallback } from './data/cricketKnockoutFallback';

const SUPER_ADMIN_EMAIL = 'mazcis2011@gmail.com';
const ADMIN_EMAIL = 'nasarpk20@gmail.com';
const isSuperAdminEmail = (email) => (email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL;
const isAdminEmail = (email) => (email || '').toLowerCase().trim() === ADMIN_EMAIL;

/** Build feature-flags object from config array. Defaults all true. */
function featureFlagsFromConfig(configArray) {
  const obj = { news: true, live_scores: true, streaks: true, favorites: true, leaderboard: true };
  (Array.isArray(configArray) ? configArray : []).forEach((f) => { obj[f.key] = f.enabled !== false; });
  return obj;
}

/** Returns 'super_admin' | 'admin' | null if the email is in the Super Admin-managed admin list. */
function getSaRoleForEmail(email, saAdmins) {
  const e = (email || '').toLowerCase().trim();
  if (!e || !Array.isArray(saAdmins)) return null;
  const entry = saAdmins.find((a) => (a.email || '').toLowerCase().trim() === e);
  return entry && (entry.role === 'super_admin' || entry.role === 'admin') ? entry.role : null;
}

// --- Constants & Config ---
const SPORTS_API_SITE_ROOT = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORTS_API_V2_ROOT = 'https://site.api.espn.com/apis/v2/sports';
/** Fallback icon when a cricket league has no dedicated logo URL */
const CRICKET_LEAGUE_ICON = 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-cricket.png';

const SPORTS_CONFIG = {
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
const SPORT_DECOR_ICONS = {
  soccer: { main: ['sports_soccer', 'stadium'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] },
  basketball: { main: ['sports_basketball', 'stadium'], extra: ['emoji_events', 'military_tech', 'schedule', 'place', 'fitness_center'] },
  football: { main: ['sports_football', 'stadium'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] },
  baseball: { main: ['sports_baseball', 'stadium'], extra: ['emoji_events', 'military_tech', 'place', 'schedule', 'sports'] },
  hockey: { main: ['sports_hockey', 'stadium'], extra: ['emoji_events', 'military_tech', 'ac_unit', 'place', 'schedule'] },
  cricket: { main: ['sports_cricket', 'stadium'], extra: ['emoji_events', 'military_tech', 'place', 'schedule', 'sports'] },
  f1: { main: ['sports_motorsports', 'speed'], extra: ['emoji_events', 'military_tech', 'flag', 'place', 'schedule'] }
};

const SPORTS_TABS = Object.keys(SPORTS_CONFIG);
/** Label/icon for a sport key; use when sport may have been added in Super Admin but not yet in SPORTS_CONFIG. */
function getSportConfig(sportKey) {
  const c = SPORTS_CONFIG[sportKey];
  if (c) return c;
  const label = (sportKey || '').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { label: label || sportKey, icon: 'sports', path: sportKey };
}
/** Cricket leagues that have a knockout/playoff phase (show League Table | Knockout toggle) */
const CRICKET_KNOCKOUT_LEAGUES = ['ipl', 'bbl', 'ilt20', 'sa20', 't20wc', 'psl', 'ranji'];

/** Fix mojibake when API returns UTF-8 (e.g. Hindi/Urdu) interpreted as Latin-1 */
function fixTextEncoding(str) {
  if (str == null || typeof str !== 'string') return str;
  if (!str) return str;
  const likelyMojibake = /à¤|à¥|à¤®|à¤¬|à¤²|à¤à¥|à¤°|à¤¸|à¤®à¥|à¤«|à¤¨à¤²|à¤¦à¥|à¤¡|ἀ|ά|κ|για/i.test(str);
  if (!likelyMojibake) return str;
  try {
    const bytes = new Uint8Array([...str].map(c => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch (_) {
    return str;
  }
}

const FALLBACK_TEAM_LOGO = 'https://via.placeholder.com/48?text=Team';
/** Data URI so league logos always show something when CDN fails (no network needed) */
const FALLBACK_LEAGUE_LOGO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="%2364748b" stroke-width="2" fill="%23f1f5f9"/><path d="M24 14v20M14 24h20" stroke="%2394a3b8" stroke-width="1.5"/><circle cx="24" cy="24" r="6" fill="%2364748b"/></svg>');
const FALLBACK_PLAYER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="#334155"><rect width="200" height="200"/><circle cx="100" cy="72" r="28" fill="#64748b"/><ellipse cx="100" cy="165" rx="45" ry="38" fill="#64748b"/></svg>');
const FALLBACK_NEWS_IMAGE = 'https://via.placeholder.com/400x200?text=News';

const PLAYER_STATS_BY_SPORT = {
  soccer: { primary: 'G', secondary: 'A' },
  basketball: { primary: 'PTS', secondary: 'AST' },
  football: { primary: 'YDS', secondary: 'TD' },
  baseball: { primary: 'HR', secondary: 'RBI' },
  hockey: { primary: 'G', secondary: 'A' },
  cricket: { primary: 'Runs', secondary: 'Wkts' },
  f1: { primary: 'Wins', secondary: 'Podiums' }
};

// Sport-specific match detail configuration
const MATCH_DETAIL_CONFIG = {
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

// Map internal player IDs to verified ESPN soccer player IDs for headshots
// ONLY includes IDs verified via ESPN.com searches and squad pages
const SOCCER_ESPN_IDS = {
  // TOP STARS (all verified)
  45843: 45843,     // Messi
  22712: 22774,     // Cristiano Ronaldo
  129596: 132948,   // Neymar Jr
  210513: 253989,   // Erling Haaland
  238861: 252107,   // Vinícius Júnior
  270438: 291281,   // Jude Bellingham
  491564: 362150,   // Lamine Yamal
  126131: 125824,   // Robert Lewandowski
  159665: 173896,   // Mohamed Salah
  158500: 142200,   // Harry Kane
  423549: 250465,   // Pedri
  139867: 134947,   // Kevin De Bruyne
  231908: 231828,   // Rodri
  227181: 203669,   // Martin Ødegaard
  140019: 140416,   // Antoine Griezmann
  391585: 219713,   // Lautaro Martínez
  391857: 228296,   // Victor Osimhen
  444222: 303748,   // Florian Wirtz
  410313: 303821,   // Jamal Musiala
  139871: 157892,   // Virgil van Dijk
  253919: 238262,   // Declan Rice
  424911: 296395,   // Cole Palmer
  403164: 280555,   // Bukayo Saka
  238864: 250787,   // Phil Foden
  186001: 190161,   // Joshua Kimmich
  104230: 84774,    // Manuel Neuer
  139870: 134283,   // Thibaut Courtois
  175654: 196876,   // Alisson
  191695: 199833,   // Bernardo Silva
  233775: 234878,   // Rúben Dias
  211019: 176948,   // Ederson
  // From Real Madrid squad page
  394391: 228402,   // Éder Militão
  161986: 169438,   // Antonio Rüdiger
  254246: 235818,   // Federico Valverde
  238873: 265919,   // Aurélien Tchouaméni
  // From Arsenal squad page
  423546: 277385,   // William Saliba
  238865: 217289,   // Gabriel Jesus
  238927: 231182,   // Kai Havertz
  // Other verified
  225954: 217092,   // Gianluigi Donnarumma
  394393: 236721,   // Alphonso Davies
  181820: 140740,   // Marc-André ter Stegen
  238863: 235662,   // Alexander Isak
  394392: 258917,   // Rafael Leão
  233777: 204441,   // Nicolò Barella
  225964: 225607,   // Christian Pulisic
  133201: 159248,   // Nathan Aké
  403138: 271788,   // Darwin Núñez
  254245: 208133,   // Diogo Jota
  391158: 257390,   // Luis Díaz
  247291: 285450,   // Enzo Fernández
  403250: 274745,   // Khvicha Kvaratskhelia
  173513: 159047,   // Marquinhos
  126132: 88965,    // Olivier Giroud
  104223: 76762,    // Luka Modrić
  104258: 123465,   // Thomas Müller
  194321: 227765,   // Dani Olmo
};
const getHeadshot = (id) => {
  const espnId = SOCCER_ESPN_IDS[id] || id;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${espnId}.png&w=350&h=254`;
};
const getNBAHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=350&h=254`;
const getNFLHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${id}.png&w=350&h=254`;
const getMLBHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/${id}.png&w=350&h=254`;
const getNHLHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/${id}.png&w=350&h=254`;
const getCricketHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/cricket/players/full/${id}.png&w=350&h=254`;
const getF1Headshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/${id}.png&w=350&h=254`;

const SPORT_HEADSHOT_FN = {
  soccer: getHeadshot,
  basketball: getNBAHeadshot,
  football: getNFLHeadshot,
  baseball: getMLBHeadshot,
  hockey: getNHLHeadshot,
  cricket: getCricketHeadshot,
  f1: getF1Headshot
};

// --- 100+ REAL STAR PLAYERS ---
const PLAYERS_DATA = [
  // --- THE REAL STARS (NO DUPLICATES) ---
  { id: 45843, name: 'Lionel Messi', club: 'Inter Miami', position: 'forwards', rating: 94, goals: 840, image: getHeadshot(45843), age: 37, height: '1.70m', weight: '72kg', trophies: ['8x Ballon d\'Or', '1x World Cup', '10x La Liga', '4x UCL'], career: ['Barcelona', 'PSG', 'Inter Miami'], achievements: ['Top scorer in La Liga history', 'Most goals in a calendar year (91)'] },
  { id: 22712, name: 'Cristiano Ronaldo', club: 'Al Nassr', position: 'forwards', rating: 94, goals: 900, image: getHeadshot(22712), age: 39, height: '1.87m', weight: '83kg', trophies: ['5x Ballon d\'Or', '1x Euro', '5x UCL', '3x PL'], career: ['Sporting CP', 'Man Utd', 'Real Madrid', 'Juventus', 'Al Nassr'], achievements: ['All-time top scorer in football history', 'Top scorer in UCL history'] },
  { id: 129596, name: 'Neymar Jr', club: 'Al Hilal', position: 'forwards', rating: 91, goals: 430, image: getHeadshot(129596), age: 32, height: '1.75m', weight: '68kg', trophies: ['1x UCL', '1x Copa Libertadores', '2x La Liga'], career: ['Santos', 'Barcelona', 'PSG', 'Al Hilal'], achievements: ['Brazil all-time top scorer'] },
  { id: 210513, name: 'Erling Haaland', club: 'Man City', position: 'forwards', rating: 91, goals: 250, image: getHeadshot(210513), age: 24, height: '1.94m', weight: '88kg', trophies: ['1x UCL', '2x PL', '1x Bundesliga'], career: ['Molde', 'RB Salzburg', 'Dortmund', 'Man City'], achievements: ['Most goals in a single PL season (36)'] },
  { id: 231388, name: 'Kylian Mbappé', club: 'Real Madrid', position: 'forwards', rating: 92, goals: 300, image: getHeadshot(231388), age: 25, height: '1.78m', weight: '73kg', trophies: ['1x World Cup', '7x Ligue 1'], career: ['Monaco', 'PSG', 'Real Madrid'], achievements: ['PSG all-time top scorer'] },
  { id: 238861, name: 'Vinícius Júnior', club: 'Real Madrid', position: 'forwards', rating: 91, goals: 24, image: getHeadshot(238861), age: 24, height: '1.76m', weight: '73kg', trophies: ['2x UCL', '3x La Liga'], career: ['Flamengo', 'Real Madrid'], achievements: ['UCL Final Goal Scorer'] },
  { id: 270438, name: 'Jude Bellingham', club: 'Real Madrid', position: 'midfielders', rating: 90, goals: 23, image: getHeadshot(270438), age: 21, height: '1.86m', weight: '75kg', trophies: ['1x UCL', '1x La Liga'], career: ['Birmingham', 'Dortmund', 'Real Madrid'], achievements: ['Golden Boy 2023'] },
  { id: 491564, name: 'Lamine Yamal', club: 'FC Barcelona', position: 'forwards', rating: 85, goals: 10, image: getHeadshot(491564), age: 17, height: '1.78m', weight: '66kg', trophies: ['1x Euro', '1x La Liga'], career: ['Barcelona'], achievements: ['Youngest scorer in Euro history'] },
  { id: 126131, name: 'Robert Lewandowski', club: 'FC Barcelona', position: 'forwards', rating: 89, goals: 28, image: getHeadshot(126131), age: 36, height: '1.85m', weight: '81kg', trophies: ['1x UCL', '10x Bundesliga', '1x La Liga'], career: ['Lech Poznan', 'Dortmund', 'Bayern', 'Barcelona'], achievements: ['Most goals in a Bundesliga season (41)'] },
  { id: 159665, name: 'Mohamed Salah', club: 'Liverpool', position: 'forwards', rating: 90, goals: 25, image: getHeadshot(159665), age: 32, height: '1.75m', weight: '71kg', trophies: ['1x UCL', '1x PL'], career: ['Basel', 'Chelsea', 'Roma', 'Liverpool'], achievements: ['Liverpool all-time PL top scorer'] },
  { id: 158500, name: 'Harry Kane', club: 'Bayern Munich', position: 'forwards', rating: 91, goals: 45, image: getHeadshot(158500), age: 31, height: '1.88m', weight: '86kg', trophies: ['3x PL Golden Boot'], career: ['Tottenham', 'Bayern Munich'], achievements: ['England all-time top scorer'] },
  { id: 423549, name: 'Pedri', club: 'FC Barcelona', position: 'midfielders', rating: 88, goals: 20, image: getHeadshot(423549), age: 21, height: '1.74m', weight: '60kg', trophies: ['1x La Liga', '1x Euro'], career: ['Las Palmas', 'Barcelona'], achievements: ['Golden Boy Award 2021'] },
  { id: 139867, name: 'Kevin De Bruyne', club: 'Man City', position: 'midfielders', rating: 90, goals: 6, image: getHeadshot(139867), age: 33, height: '1.81m', weight: '70kg', trophies: ['1x UCL', '6x PL'], career: ['Genk', 'Chelsea', 'Wolfsburg', 'Man City'], achievements: ['Most assists in a PL season (20)'] },
  { id: 231908, name: 'Rodri', club: 'Man City', position: 'midfielders', rating: 91, goals: 9, image: getHeadshot(231908), age: 28, height: '1.91m', weight: '82kg', trophies: ['1x Ballon d\'Or', '1x UCL', '4x PL', '1x Euro'], career: ['Villarreal', 'Atletico', 'Man City'], achievements: ['UCL Final MOTM'] },
  { id: 227181, name: 'Martin Odegaard', club: 'Arsenal', position: 'midfielders', rating: 88, goals: 10, image: getHeadshot(227181), age: 25, height: '1.78m', weight: '68kg', trophies: ['Arsenal Player of the Season'], career: ['Stromsgodset', 'Real Madrid', 'Sociedad', 'Arsenal'], achievements: ['Youngest Norway debutant'] },
  { id: 140019, name: 'Antoine Griezmann', club: 'Atletico', position: 'forwards', rating: 88, goals: 19, image: getHeadshot(140019), age: 33, height: '1.76m', weight: '73kg', trophies: ['1x World Cup', '1x Europa League'], career: ['Sociedad', 'Atletico', 'Barcelona', 'Atletico'], achievements: ['Atletico all-time top scorer'] },
  { id: 391585, name: 'Lautaro Martínez', club: 'Inter', position: 'forwards', rating: 89, goals: 26, image: getHeadshot(391585), age: 27, height: '1.74m', weight: '72kg', trophies: ['1x World Cup', '2x Serie A', '2x Copa America'], career: ['Racing Club', 'Inter Milan'], achievements: ['Serie A MVP 2024'] },
  { id: 391857, name: 'Victor Osimhen', club: 'Galatasaray', position: 'forwards', rating: 88, goals: 22, image: getHeadshot(391857), age: 25, height: '1.85m', weight: '78kg', trophies: ['1x Serie A'], career: ['Wolfsburg', 'Lille', 'Napoli', 'Galatasaray'], achievements: ['African Footballer of the Year'] },
  { id: 444222, name: 'Florian Wirtz', club: 'Leverkusen', position: 'midfielders', rating: 89, goals: 18, image: getHeadshot(444222), age: 21, height: '1.76m', weight: '70kg', trophies: ['1x Bundesliga'], career: ['Koln', 'Leverkusen'], achievements: ['Bundesliga Player of the Season 2024'] },
  { id: 410313, name: 'Jamal Musiala', club: 'Bayern Munich', position: 'midfielders', rating: 88, goals: 15, image: getHeadshot(410313), age: 21, height: '1.84m', weight: '72kg', trophies: ['4x Bundesliga', '1x UCL'], career: ['Chelsea Academy', 'Bayern Munich'], achievements: ['Germany youngest Euro player'] },
  { id: 139871, name: 'Virgil van Dijk', club: 'Liverpool', position: 'defenders', rating: 89, goals: 4, image: getHeadshot(139871), age: 33, height: '1.93m', weight: '92kg', trophies: ['1x UCL', '1x PL'], career: ['Groningen', 'Celtic', 'Southampton', 'Liverpool'], achievements: ['UEFA Men\'s Player of the Year'] },
  { id: 253919, name: 'Declan Rice', club: 'Arsenal', position: 'midfielders', rating: 87, goals: 7, image: getHeadshot(253919), age: 25, height: '1.88m', weight: '80kg', trophies: ['1x Conference League'], career: ['West Ham', 'Arsenal'], achievements: ['Hammer of the Year 3x'] },
  { id: 424911, name: 'Cole Palmer', club: 'Chelsea', position: 'midfielders', rating: 87, goals: 24, image: getHeadshot(424911), age: 22, height: '1.89m', weight: '74kg', trophies: ['1x UCL', '1x PL'], career: ['Man City', 'Chelsea'], achievements: ['PL Young Player of the Season'] },
  { id: 210411, name: 'Leroy Sané', club: 'Bayern', position: 'forwards', rating: 86, goals: 12, image: getHeadshot(210411), age: 28, height: '1.83m', weight: '80kg', trophies: ['2x PL', '3x Bundesliga'], career: ['Schalke', 'Man City', 'Bayern'], achievements: ['PFA Young Player of the Year'] },
  { id: 394392, name: 'Rafael Leão', club: 'AC Milan', position: 'forwards', rating: 86, goals: 15, image: getHeadshot(394392), age: 25, height: '1.88m', weight: '81kg', trophies: ['1x Serie A'], career: ['Sporting CP', 'Lille', 'AC Milan'], achievements: ['Serie A Footballer of the Year'] },
  { id: 391157, name: 'Dusan Vlahovic', club: 'Juventus', position: 'forwards', rating: 84, goals: 18, image: getHeadshot(391157), age: 24, height: '1.90m', weight: '75kg', trophies: ['1x Coppa Italia'], career: ['Partizan', 'Fiorentina', 'Juventus'], achievements: ['Serie A Best Young Player'] },
  { id: 233777, name: 'Nicolo Barella', club: 'Inter', position: 'midfielders', rating: 87, goals: 3, image: getHeadshot(233777), age: 27, height: '1.72m', weight: '68kg', trophies: ['1x Euro', '2x Serie A'], career: ['Cagliari', 'Inter Milan'], achievements: ['Serie A Best Midfielder 3x'] },
  { id: 139870, name: 'Thibaut Courtois', club: 'Real Madrid', position: 'goalkeepers', rating: 90, goals: 0, image: getHeadshot(139870), age: 32, height: '2.00m', weight: '96kg', trophies: ['2x UCL', '3x La Liga', '2x PL'], career: ['Genk', 'Atletico', 'Chelsea', 'Real Madrid'], achievements: ['Yashin Trophy 2022'] },
  { id: 175654, name: 'Alisson', club: 'Liverpool', position: 'goalkeepers', rating: 89, goals: 0, image: getHeadshot(175654), age: 32, height: '1.93m', weight: '91kg', trophies: ['1x UCL', '1x PL', '1x Copa America'], career: ['Internacional', 'Roma', 'Liverpool'], achievements: ['The Best FIFA Goalkeeper'] },
  { id: 191695, name: 'Bernardo Silva', club: 'Man City', position: 'midfielders', rating: 88, goals: 11, image: getHeadshot(191695), age: 29, trophies: ['1x UCL', '6x PL'], career: ['Benfica', 'Monaco', 'Man City'], achievements: ['Elite playmaker'] },
  { id: 233775, name: 'Rúben Dias', club: 'Man City', position: 'defenders', rating: 89, goals: 4, image: getHeadshot(233775), age: 27, trophies: ['1x UCL', '4x PL'], career: ['Benfica', 'Man City'], achievements: ['PL Player of the Season'] },
  { id: 211019, name: 'Ederson', club: 'Man City', position: 'goalkeepers', rating: 88, goals: 0, image: getHeadshot(211019), age: 30, trophies: ['1x UCL', '6x PL'], career: ['Benfica', 'Man City'], achievements: ['Golden Glove winner'] },
  { id: 238864, name: 'Phil Foden', club: 'Man City', position: 'midfielders', rating: 90, goals: 28, image: getHeadshot(238864), age: 24, trophies: ['1x UCL', '6x PL'], career: ['Man City'], achievements: ['PL Player of the Season 2024'] },
  { id: 186001, name: 'Joshua Kimmich', club: 'Bayern Munich', position: 'midfielders', rating: 88, goals: 42, image: getHeadshot(186001), age: 29, trophies: ['1x UCL', '8x Bundesliga'], career: ['Leipzig', 'Bayern'], achievements: ['Modern versatility master'] },
  { id: 104230, name: 'Manuel Neuer', club: 'Bayern Munich', position: 'goalkeepers', rating: 87, goals: 0, image: getHeadshot(104230), age: 38, trophies: ['2x UCL', '11x Bundesliga', '1x World Cup'], career: ['Schalke', 'Bayern'], achievements: ['Sweeper-keeper pioneer'] },
  { id: 231909, name: 'Theo Hernández', club: 'AC Milan', position: 'defenders', rating: 87, goals: 30, image: getHeadshot(231909), age: 26, trophies: ['1x Serie A', '1x UCL'], career: ['Atletico', 'Real Madrid', 'AC Milan'], achievements: ['Best LB in Serie A'] },
  { id: 178228, name: 'Mike Maignan', club: 'AC Milan', position: 'goalkeepers', rating: 87, goals: 0, image: getHeadshot(178228), age: 29, trophies: ['1x Serie A', '1x Ligue 1'], career: ['PSG', 'Lille', 'AC Milan'], achievements: ['Serie A Best GK'] },
  { id: 393952, name: 'Alessandro Bastoni', club: 'Inter Milan', position: 'defenders', rating: 87, goals: 5, image: getHeadshot(393952), age: 25, trophies: ['2x Serie A', '1x Euro'], career: ['Atalanta', 'Inter'], achievements: ['Elite ball-playing CB'] },
  { id: 403164, name: 'Bukayo Saka', club: 'Arsenal', position: 'forwards', rating: 88, goals: 60, image: getHeadshot(403164), age: 22, trophies: ['1x FA Cup'], career: ['Arsenal'], achievements: ['Arsenal POTY 2x'] },
  { id: 423546, name: 'William Saliba', club: 'Arsenal', position: 'defenders', rating: 87, goals: 5, image: getHeadshot(423546), age: 23, trophies: ['1x Nations League'], career: ['Saint-Etienne', 'Nice', 'Marseille', 'Arsenal'], achievements: ['PL Team of the Year'] },
  { id: 254246, name: 'Federico Valverde', club: 'Real Madrid', position: 'midfielders', rating: 89, goals: 25, image: getHeadshot(254246), age: 26, trophies: ['2x UCL', '3x La Liga'], career: ['Penarol', 'Real Madrid'], achievements: ['Uruguay Captain potential'] },
  { id: 161986, name: 'Antonio Rüdiger', club: 'Real Madrid', position: 'defenders', rating: 87, goals: 20, image: getHeadshot(161986), age: 31, trophies: ['2x UCL', '1x La Liga'], career: ['Stuttgart', 'Roma', 'Chelsea', 'Real Madrid'], achievements: ['Defensive leadership'] },
  { id: 210521, name: 'Frenkie de Jong', club: 'FC Barcelona', position: 'midfielders', rating: 87, goals: 25, image: getHeadshot(210521), age: 27, trophies: ['1x La Liga', '1x Eredivisie'], career: ['Willem II', 'Ajax', 'Barcelona'], achievements: ['Elite ball progression'] },
  { id: 181820, name: 'Marc-André ter Stegen', club: 'FC Barcelona', position: 'goalkeepers', rating: 88, goals: 0, image: getHeadshot(181820), age: 32, trophies: ['1x UCL', '5x La Liga'], career: ['Gladbach', 'Barcelona'], achievements: ['Barca Captain'] },
  { id: 403254, name: 'Bruno Guimarães', club: 'Newcastle', position: 'midfielders', rating: 86, goals: 18, image: getHeadshot(403254), age: 26, trophies: ['Olympic Gold'], career: ['Paranaense', 'Lyon', 'Newcastle'], achievements: ['Newcastle heart'] },
  { id: 238863, name: 'Alexander Isak', club: 'Newcastle', position: 'forwards', rating: 86, goals: 105, image: getHeadshot(238863), age: 24, trophies: ['Copa del Rey'], career: ['AIK', 'Dortmund', 'Sociedad', 'Newcastle'], achievements: ['Swedish flair'] },
  { id: 247291, name: 'Enzo Fernández', club: 'Chelsea', position: 'midfielders', rating: 84, goals: 15, image: getHeadshot(247291), age: 23, trophies: ['World Cup 2022'], career: ['River Plate', 'Benfica', 'Chelsea'], achievements: ['WC Young Player of Tournament'] },
  { id: 391856, name: 'Christopher Nkunku', club: 'Chelsea', position: 'forwards', rating: 85, goals: 90, image: getHeadshot(391856), age: 26, trophies: ['Bundesliga Cup'], career: ['PSG', 'Leipzig', 'Chelsea'], achievements: ['Clinical finisher'] },
  { id: 233774, name: 'Federico Chiesa', club: 'Liverpool', position: 'forwards', rating: 83, goals: 65, image: getHeadshot(233774), age: 26, trophies: ['Euro 2020'], career: ['Fiorentina', 'Juventus', 'Liverpool'], achievements: ['Dribbling specialist'] },
  { id: 254245, name: 'Diogo Jota', club: 'Liverpool', position: 'forwards', rating: 85, goals: 115, image: getHeadshot(254245), age: 27, trophies: ['Nations League'], career: ['Pacos Ferreira', 'Atletico', 'Wolves', 'Liverpool'], achievements: ['Goal poached extraordinaire'] },
  { id: 394393, name: 'Alphonso Davies', club: 'Bayern Munich', position: 'defenders', rating: 85, goals: 15, image: getHeadshot(394393), age: 23, trophies: ['1x UCL', '5x Bundesliga'], career: ['Vancouver', 'Bayern'], achievements: ['Road runner pace'] },
  { id: 194321, name: 'Dani Olmo', club: 'FC Barcelona', position: 'midfielders', rating: 86, goals: 55, image: getHeadshot(194321), age: 26, trophies: ['1x Euro', '1x Nations League'], career: ['Dinamo Zagreb', 'Leipzig', 'Barcelona'], achievements: ['Euro 2024 Top Scorer'] },
  { id: 457806, name: 'Raphinha', club: 'FC Barcelona', position: 'forwards', rating: 86, goals: 95, image: getHeadshot(457806), age: 27, trophies: ['1x La Liga'], career: ['Vitoria', 'Sporting', 'Rennes', 'Leeds', 'Barcelona'], achievements: ['Barca creative engine'] },
  { id: 391854, name: 'Cristian Romero', club: 'Tottenham', position: 'defenders', rating: 86, goals: 8, image: getHeadshot(391854), age: 26, trophies: ['1x World Cup', '2x Copa America'], career: ['Genoa', 'Atalanta', 'Tottenham'], achievements: ['World elite CB'] },

  // --- THE LEGENDS (RETAINED) ---
  { id: 25430, name: 'Ronaldinho', club: 'Legend', position: 'midfielders', rating: 94, goals: 280, image: getHeadshot(25430), age: 44, trophies: ['1x World Cup', '1x Ballon d\'Or', '1x UCL'], career: ['Gremio', 'PSG', 'Barcelona', 'Milan'], achievements: ['Only player to win World Cup, UCL, Libertadores'] },
  { id: 184941, name: 'Zinedine Zidane', club: 'Legend', position: 'midfielders', rating: 96, goals: 156, image: getHeadshot(184941), age: 52, trophies: ['1x World Cup', '1x Ballon d\'Or', '1x UCL'], career: ['Cannes', 'Bordeaux', 'Juventus', 'Real Madrid'], achievements: ['Player of the Tournament 1998 WC'] },
  { id: 1458, name: 'Pelé', club: 'Legend', position: 'forwards', rating: 99, goals: 1281, image: 'https://b.fssta.com/adoneabun/main/soccer/players/1458.png', age: 82, trophies: ['3x World Cup'], career: ['Santos', 'NY Cosmos'], achievements: ['Only player to win 3 World Cups'] },
  { id: 1043, name: 'Diego Maradona', club: 'Legend', position: 'midfielders', rating: 99, goals: 345, image: 'https://b.fssta.com/adoneabun/main/soccer/players/1043.png', age: 60, trophies: ['1x World Cup', '2x Serie A'], career: ['Boca Juniors', 'Barcelona', 'Napoli'], achievements: ['Goal of the Century (1986)'] },
  { id: 133201, name: 'Nathan Aké', club: 'Man City', position: 'defenders', rating: 84, goals: 5, image: getHeadshot(133201), age: 29, trophies: ['1x UCL', '3x PL'], career: ['Feyenoord', 'Chelsea', 'Bournemouth', 'Man City'], achievements: ['Versatile defender'] },
  { id: 238873, name: 'Aurélien Tchouaméni', club: 'Real Madrid', position: 'midfielders', rating: 86, goals: 8, image: getHeadshot(238873), age: 24, trophies: ['1x UCL', '1x La Liga'], career: ['Bordeaux', 'Monaco', 'Real Madrid'], achievements: ['Defensive midfield anchor'] },
  { id: 159958, name: 'Richarlison', club: 'Tottenham', position: 'forwards', rating: 83, goals: 75, image: getHeadshot(159958), age: 27, trophies: ['Copa America'], career: ['Fluminense', 'Watford', 'Everton', 'Tottenham'], achievements: ['Puskas nominee 2022'] },
  { id: 104258, name: 'Thomas Müller', club: 'Bayern', position: 'forwards', rating: 84, goals: 250, image: getHeadshot(104258), age: 35, height: '1.85m', weight: '76kg', trophies: ['2x UCL', '12x Bundesliga', '1x World Cup'], career: ['Bayern Munich'], achievements: ['Most appearances for Bayern'] },
  { id: 104223, name: 'Luka Modrić', club: 'Real Madrid', position: 'midfielders', rating: 87, goals: 45, image: getHeadshot(104223), age: 39, height: '1.72m', weight: '66kg', trophies: ['6x UCL', '1x Ballon d\'Or', '4x La Liga'], career: ['Dinamo Zagreb', 'Tottenham', 'Real Madrid'], achievements: ['Croatia all-time appearances'] },
  { id: 126132, name: 'Olivier Giroud', club: 'Legend', position: 'forwards', rating: 82, goals: 300, image: getHeadshot(126132), age: 38, height: '1.93m', weight: '91kg', trophies: ['1x World Cup', '1x UCL', '1x Serie A'], career: ['Montpellier', 'Arsenal', 'Chelsea', 'Milan', 'LAFC'], achievements: ['France all-time top scorer'] },
  { id: 392395, name: 'Federico Dimarco', club: 'Inter Milan', position: 'defenders', rating: 86, goals: 12, image: getHeadshot(392395), age: 26, trophies: ['1x Serie A'], career: ['Inter'], achievements: ['Lethal crossing ability'] },
  { id: 174321, name: 'Hakan Çalhanoğlu', club: 'Inter Milan', position: 'midfielders', rating: 87, goals: 85, image: getHeadshot(174321), age: 30, trophies: ['1x Serie A'], career: ['Hamburg', 'Leverkusen', 'Milan', 'Inter'], achievements: ['Free-kick specialist'] },
  { id: 225964, name: 'Christian Pulisic', club: 'AC Milan', position: 'forwards', rating: 85, goals: 60, image: getHeadshot(225964), age: 25, trophies: ['1x UCL'], career: ['Dortmund', 'Chelsea', 'AC Milan'], achievements: ['Captain America'] },
  { id: 238869, name: 'Jules Koundé', club: 'FC Barcelona', position: 'defenders', rating: 85, goals: 10, image: getHeadshot(238869), age: 25, trophies: ['1x La Liga', '1x Europa League'], career: ['Bordeaux', 'Sevilla', 'Barcelona'], achievements: ['Elite versatility'] },
  { id: 391855, name: 'Ronald Araujo', club: 'FC Barcelona', position: 'defenders', rating: 86, goals: 8, image: getHeadshot(391855), age: 25, trophies: ['1x La Liga'], career: ['River Plate', 'Barcelona'], achievements: ['Defensive wall'] },
  { id: 139868, name: 'İlkay Gündoğan', club: 'Man City', position: 'midfielders', rating: 87, goals: 110, image: getHeadshot(139868), age: 33, trophies: ['1x UCL', '5x PL'], career: ['Dortmund', 'Man City', 'Barcelona', 'Man City'], achievements: ['Treble captain'] },
  { id: 403138, name: 'Darwin Núñez', club: 'Liverpool', position: 'forwards', rating: 82, goals: 80, image: getHeadshot(403138), age: 25, trophies: ['1x EFL Cup'], career: ['Penarol', 'Almeria', 'Benfica', 'Liverpool'], achievements: ['Chaos factor expert'] },
  { id: 391158, name: 'Luis Díaz', club: 'Liverpool', position: 'forwards', rating: 85, goals: 75, image: getHeadshot(391158), age: 27, trophies: ['1x EFL Cup'], career: ['Junior', 'Porto', 'Liverpool'], achievements: ['Copa America Joint Top Scorer'] },
  { id: 159649, name: 'Granit Xhaka', club: 'Leverkusen', position: 'midfielders', rating: 86, goals: 45, image: getHeadshot(159649), age: 31, trophies: ['1x Bundesliga', '2x FA Cup'], career: ['Basel', 'Gladbach', 'Arsenal', 'Leverkusen'], achievements: ['Invincible Bundesliga campaign'] },
  { id: 193005, name: 'Alejandro Grimaldo', club: 'Leverkusen', position: 'defenders', rating: 86, goals: 40, image: getHeadshot(193005), age: 28, trophies: ['1x Bundesliga', '4x Portuguese League'], career: ['Barcelona B', 'Benfica', 'Leverkusen'], achievements: ['Top scoring defender 2024'] },
  { id: 403250, name: 'Khvicha Kvaratskhelia', club: 'Napoli', position: 'forwards', rating: 86, goals: 40, image: getHeadshot(403250), age: 23, trophies: ['1x Serie A'], career: ['Dinamo Batumi', 'Napoli'], achievements: ['Serie A MVP 2023'] },
  { id: 238871, name: 'Achraf Hakimi', club: 'PSG', position: 'defenders', rating: 85, goals: 45, image: getHeadshot(238871), age: 25, trophies: ['1x UCL', '1x Serie A', '3x Ligue 1'], career: ['Real Madrid', 'Dortmund', 'Inter', 'PSG'], achievements: ['World elite RB'] },
  { id: 173513, name: 'Marquinhos', club: 'PSG', position: 'defenders', rating: 87, goals: 38, image: getHeadshot(173513), age: 30, trophies: ['9x Ligue 1', '1x Copa America'], career: ['Corinthians', 'Roma', 'PSG'], achievements: ['Long-time PSG captain'] },
  { id: 225954, name: 'Gianluigi Donnarumma', club: 'PSG', position: 'goalkeepers', rating: 88, goals: 0, image: getHeadshot(225954), age: 25, trophies: ['1x Euro', '3x Ligue 1'], career: ['AC Milan', 'PSG'], achievements: ['Euro 2020 Player of Tournament'] },
  { id: 491325, name: 'Warren Zaïre-Emery', club: 'PSG', position: 'midfielders', rating: 82, goals: 5, image: getHeadshot(491325), age: 18, trophies: ['2x Ligue 1'], career: ['PSG'], achievements: ['Youngest France goalscorer'] },
  { id: 238873, name: 'Aurélien Tchouaméni', club: 'Real Madrid', position: 'midfielders', rating: 86, goals: 8, image: getHeadshot(238873), age: 24, trophies: ['1x UCL', '1x La Liga'], career: ['Bordeaux', 'Monaco', 'Real Madrid'], achievements: ['Defensive midfield anchor'] },
  { id: 159958, name: 'Richarlison', club: 'Tottenham', position: 'forwards', rating: 83, goals: 75, image: getHeadshot(159958), age: 27, trophies: ['Copa America'], career: ['Fluminense', 'Watford', 'Everton', 'Tottenham'], achievements: ['Puskas nominee 2022'] },

  // ADDING 50+ MORE REAL STARS
  { id: 238865, name: 'Gabriel Jesus', club: 'Arsenal', position: 'forwards', rating: 84, goals: 110, image: getHeadshot(238865), age: 27, trophies: ['4x PL', '1x Copa America'], career: ['Palmeiras', 'Man City', 'Arsenal'], achievements: ['Aggressive presser'] },
  { id: 403164, name: 'Bukayo Saka', club: 'Arsenal', position: 'forwards', rating: 88, goals: 60, image: getHeadshot(403164), age: 22, trophies: ['1x FA Cup'], career: ['Arsenal'], achievements: ['Arsenal POTY 2x'] },
  { id: 423546, name: 'William Saliba', club: 'Arsenal', position: 'defenders', rating: 87, goals: 5, image: getHeadshot(423546), age: 23, trophies: ['1x Nations League'], career: ['Saint-Etienne', 'Nice', 'Marseille', 'Arsenal'], achievements: ['PL Team of the Year'] },
  { id: 238927, name: 'Kai Havertz', club: 'Arsenal', position: 'forwards', rating: 84, goals: 70, image: getHeadshot(238927), age: 25, trophies: ['1x UCL'], career: ['Leverkusen', 'Chelsea', 'Arsenal'], achievements: ['UCL Final winning goal'] },
  { id: 254246, name: 'Federico Valverde', club: 'Real Madrid', position: 'midfielders', rating: 89, goals: 25, image: getHeadshot(254246), age: 26, trophies: ['2x UCL', '3x La Liga'], career: ['Penarol', 'Real Madrid'], achievements: ['Uruguay Captain potential'] },
  { id: 394391, name: 'Éder Militão', club: 'Real Madrid', position: 'defenders', rating: 86, goals: 12, image: getHeadshot(394391), age: 26, trophies: ['2x UCL', '3x La Liga'], career: ['Sao Paulo', 'Porto', 'Real Madrid'], achievements: ['Aggressive CB'] },
  { id: 161986, name: 'Antonio Rüdiger', club: 'Real Madrid', position: 'defenders', rating: 87, goals: 20, image: getHeadshot(161986), age: 31, trophies: ['2x UCL', '1x La Liga'], career: ['Stuttgart', 'Roma', 'Chelsea', 'Real Madrid'], achievements: ['Defensive leadership'] },
  { id: 457805, name: 'Gavi', club: 'FC Barcelona', position: 'midfielders', rating: 83, goals: 10, image: getHeadshot(457805), age: 20, trophies: ['1x La Liga'], career: ['Barcelona'], achievements: ['Golden Boy 2022'] },
  { id: 210521, name: 'Frenkie de Jong', club: 'FC Barcelona', position: 'midfielders', rating: 87, goals: 25, image: getHeadshot(210521), age: 27, trophies: ['1x La Liga', '1x Eredivisie'], career: ['Willem II', 'Ajax', 'Barcelona'], achievements: ['Elite ball progression'] },
  { id: 181820, name: 'Marc-André ter Stegen', club: 'FC Barcelona', position: 'goalkeepers', rating: 88, goals: 0, image: getHeadshot(181820), age: 32, trophies: ['1x UCL', '5x La Liga'], career: ['Gladbach', 'Barcelona'], achievements: ['Barca Captain'] },
  { id: 466846, name: 'Pau Cubarsí', club: 'FC Barcelona', position: 'defenders', rating: 78, goals: 0, image: getHeadshot(466846), age: 17, trophies: ['1x Gold Medal Olympic'], career: ['Barcelona'], achievements: ['La Masia prodigy'] },
  { id: 227122, name: 'Bruno Guimarães', club: 'Newcastle', position: 'midfielders', rating: 86, goals: 18, image: getHeadshot(403254), age: 26, trophies: ['Olympic Gold'], career: ['Paranaense', 'Lyon', 'Newcastle'], achievements: ['Newcastle heart'] },
  { id: 254248, name: 'Alexander Isak', club: 'Newcastle', position: 'forwards', rating: 86, goals: 105, image: getHeadshot(238863), age: 24, trophies: ['Copa del Rey'], career: ['AIK', 'Dortmund', 'Sociedad', 'Newcastle'], achievements: ['Swedish flair'] },
  { id: 247291, name: 'Enzo Fernández', club: 'Chelsea', position: 'midfielders', rating: 84, goals: 15, image: getHeadshot(247291), age: 23, trophies: ['World Cup 2022'], career: ['River Plate', 'Benfica', 'Chelsea'], achievements: ['WC Young Player of Tournament'] },
  { id: 391856, name: 'Christopher Nkunku', club: 'Chelsea', position: 'forwards', rating: 85, goals: 90, image: getHeadshot(391856), age: 26, trophies: ['Bundesliga Cup'], career: ['PSG', 'Leipzig', 'Chelsea'], achievements: ['Clinical finisher'] },
  { id: 394371, name: 'Nicolas Jackson', club: 'Chelsea', position: 'forwards', rating: 81, goals: 35, image: getHeadshot(394371), age: 23, trophies: ['Senegal talent'], career: ['Villarreal', 'Chelsea'], achievements: ['Electric pace'] },
  { id: 391157, name: 'Dušan Vlahović', club: 'Juventus', position: 'forwards', rating: 85, goals: 120, image: getHeadshot(391157), age: 24, trophies: ['Coppa Italia'], career: ['Partizan', 'Fiorentina', 'Juventus'], achievements: ['Pure Striker'] },
  { id: 233774, name: 'Federico Chiesa', club: 'Liverpool', position: 'forwards', rating: 83, goals: 65, image: getHeadshot(233774), age: 26, trophies: ['Euro 2020'], career: ['Fiorentina', 'Juventus', 'Liverpool'], achievements: ['Dribbling specialist'] },
  { id: 186000, name: 'Andrew Robertson', club: 'Liverpool', position: 'defenders', rating: 85, goals: 15, image: getHeadshot(186000), age: 30, trophies: ['1x UCL', '1x PL'], career: ['Hull City', 'Liverpool'], achievements: ['Intensity master'] },
  { id: 391159, name: 'Ibrahima Konaté', club: 'Liverpool', position: 'defenders', rating: 84, goals: 8, image: getHeadshot(391159), age: 25, trophies: ['2x League Cup'], career: ['Sochaux', 'Leipzig', 'Liverpool'], achievements: ['Defensive giant'] },
  { id: 254245, name: 'Diogo Jota', club: 'Liverpool', position: 'forwards', rating: 85, goals: 115, image: getHeadshot(254245), age: 27, trophies: ['Nations League'], career: ['Pacos Ferreira', 'Atletico', 'Wolves', 'Liverpool'], achievements: ['Goal poached extraordinaire'] },
  { id: 233776, name: 'Marcus Thuram', club: 'Inter Milan', position: 'forwards', rating: 85, goals: 85, image: getHeadshot(233776), age: 27, trophies: ['1x Serie A'], career: ['Guingamp', 'Gladbach', 'Inter'], achievements: ['Scudetto winner'] },
  { id: 161821, name: 'Denzel Dumfries', club: 'Inter Milan', position: 'defenders', rating: 83, goals: 30, image: getHeadshot(161821), age: 28, trophies: ['1x Serie A'], career: ['Sparta', 'PSV', 'Inter'], achievements: ['Power wingback'] },
  { id: 211018, name: 'Benjamin Pavard', club: 'Inter Milan', position: 'defenders', rating: 84, goals: 20, image: getHeadshot(211018), age: 28, trophies: ['1x World Cup', '1x UCL', '4x Bundesliga'], career: ['Lille', 'Stuttgart', 'Bayern', 'Inter'], achievements: ['Goal of the WC 2018'] },
  { id: 184135, name: 'Yann Sommer', club: 'Inter Milan', position: 'goalkeepers', rating: 86, goals: 0, image: getHeadshot(184135), age: 35, trophies: ['1x Serie A'], career: ['Basel', 'Gladbach', 'Bayern', 'Inter'], achievements: ['Clean sheet expert'] },
  { id: 104231, name: 'Kingsley Coman', club: 'Bayern Munich', position: 'forwards', rating: 86, goals: 85, image: getHeadshot(104231), age: 28, trophies: ['1x UCL', '8x Bundesliga', '2x Ligue 1', '2x Serie A'], career: ['PSG', 'Juventus', 'Bayern'], achievements: ['Won league every career year'] },
  { id: 410312, name: 'Mathys Tel', club: 'Bayern Munich', position: 'forwards', rating: 80, goals: 15, image: getHeadshot(410312), age: 19, trophies: ['1x Bundesliga'], career: ['Rennes', 'Bayern'], achievements: ['Elite youngster'] },
  { id: 238862, name: 'Dayot Upamecano', club: 'Bayern Munich', position: 'defenders', rating: 84, goals: 5, image: getHeadshot(238862), age: 25, trophies: ['3x Bundesliga'], career: ['Salzburg', 'Leipzig', 'Bayern'], achievements: ['Physical CB'] },
  { id: 394393, name: 'Alphonso Davies', club: 'Bayern Munich', position: 'defenders', rating: 85, goals: 15, image: getHeadshot(394393), age: 23, trophies: ['1x UCL', '5x Bundesliga'], career: ['Vancouver', 'Bayern'], achievements: ['Road runner pace'] },
  { id: 194321, name: 'Dani Olmo', club: 'FC Barcelona', position: 'midfielders', rating: 86, goals: 55, image: getHeadshot(194321), age: 26, trophies: ['1x Euro', '1x Nations League'], career: ['Dinamo Zagreb', 'Leipzig', 'Barcelona'], achievements: ['Euro 2024 Top Scorer'] },
  { id: 457806, name: 'Raphinha', club: 'FC Barcelona', position: 'forwards', rating: 86, goals: 95, image: getHeadshot(457806), age: 27, trophies: ['1x La Liga'], career: ['Vitoria', 'Sporting', 'Rennes', 'Leeds', 'Barcelona'], achievements: ['Barca creative engine'] },
  { id: 403252, name: 'Alejandro Balde', club: 'FC Barcelona', position: 'defenders', rating: 82, goals: 5, image: getHeadshot(403252), age: 20, trophies: ['1x La Liga'], career: ['Barcelona'], achievements: ['Modern fullback'] },
  { id: 159957, name: 'Son Heung-min', club: 'Tottenham', position: 'forwards', rating: 87, goals: 17, image: getHeadshot(159957), age: 32, height: '1.83m', weight: '77kg', trophies: ['1x PL Golden Boot'], career: ['Hamburg', 'Leverkusen', 'Tottenham'], achievements: ['Highest scoring Asian player in PL'] },
  { id: 185012, name: 'James Maddison', club: 'Tottenham', position: 'midfielders', rating: 85, goals: 80, image: getHeadshot(185012), age: 27, trophies: ['1x FA Cup'], career: ['Coventry', 'Norwich', 'Leicester', 'Tottenham'], achievements: ['Creative playmaker'] },
  { id: 391854, name: 'Cristian Romero', club: 'Tottenham', position: 'defenders', rating: 86, goals: 8, image: getHeadshot(391854), age: 26, trophies: ['1x World Cup', '2x Copa America'], career: ['Genoa', 'Atalanta', 'Tottenham'], achievements: ['World elite CB'] },
  { id: 254303, name: 'Micky van de Ven', club: 'Tottenham', position: 'defenders', rating: 84, goals: 4, image: getHeadshot(254303), age: 23, trophies: ['Pace record'], career: ['Volendam', 'Wolfsburg', 'Tottenham'], achievements: ['Tall and lightning fast'] }
];

const TACTICS_DATA = [
  { id: 1, name: 'FC Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', tagline: 'Més que un club', formation: '4-3-3 Tiki-Taka', description: 'Philosophy based on high possession and positional play.' },
  { id: 2, name: 'Real Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png', tagline: 'Kings of Europe', formation: '4-3-1-2 Diamond', description: 'Individual brilliance and lethal transitions.' }
];

// Static F1 constructor data (teams endpoint returns empty from ESPN API)
const F1_CONSTRUCTORS = [
  { id: 106842, name: 'Ferrari', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106842.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Scuderia Ferrari', formation: 'Maranello, Italy', style: 'Constructor', description: 'The most successful team in F1 history with 16 constructors\' championships.', trophies: ['16x Constructors\' Championship'], lineup: [], history: 'Ferrari is the oldest surviving and most successful F1 team.', legends: ['Michael Schumacher', 'Niki Lauda'] },
  { id: 106921, name: 'Red Bull Racing', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106921.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Oracle Red Bull Racing', formation: 'Milton Keynes, UK', style: 'Constructor', description: 'Dominant force in recent F1 with Max Verstappen at the helm.', trophies: ['6x Constructors\' Championship'], lineup: [], history: 'Red Bull has won multiple world championships since 2010.', legends: ['Sebastian Vettel', 'Max Verstappen'] },
  { id: 106892, name: 'McLaren', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106892.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'McLaren F1 Team', formation: 'Woking, UK', style: 'Constructor', description: 'Historic F1 team with 8 constructors\' championships.', trophies: ['8x Constructors\' Championship'], lineup: [], history: 'Founded by Bruce McLaren in 1963.', legends: ['Ayrton Senna', 'Alain Prost'] },
  { id: 106893, name: 'Mercedes', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106893.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Mercedes-AMG Petronas', formation: 'Brackley, UK', style: 'Constructor', description: 'Won 8 consecutive constructors\' championships from 2014 to 2021.', trophies: ['8x Constructors\' Championship'], lineup: [], history: 'Mercedes returned to F1 as a works team in 2010.', legends: ['Lewis Hamilton', 'Nico Rosberg'] },
  { id: 123986, name: 'Aston Martin', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/123986.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Aston Martin Aramco', formation: 'Silverstone, UK', style: 'Constructor', description: 'British luxury car manufacturer competing in F1.', trophies: ['Podium Contender'], lineup: [], history: 'Rebranded from Racing Point in 2021.', legends: ['Fernando Alonso', 'Lance Stroll'] },
  { id: 106922, name: 'Alpine', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106922.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'BWT Alpine F1', formation: 'Enstone, UK', style: 'Constructor', description: 'French manufacturer team, formerly Renault F1.', trophies: ['2x Constructors\' Championship (as Renault)'], lineup: [], history: 'Rebranded from Renault in 2021.', legends: ['Fernando Alonso'] },
  { id: 111427, name: 'Haas', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/111427.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'MoneyGram Haas F1', formation: 'Kannapolis, USA', style: 'Constructor', description: 'The first American F1 team since 1986.', trophies: ['Midfield Contender'], lineup: [], history: 'Founded by Gene Haas, debuted in 2016.', legends: [] },
  { id: 106967, name: 'Williams', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/106967.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Williams Racing', formation: 'Grove, UK', style: 'Constructor', description: 'Historic British F1 team with 9 constructors\' titles.', trophies: ['9x Constructors\' Championship'], lineup: [], history: 'Founded by Sir Frank Williams in 1977.', legends: ['Nigel Mansell', 'Damon Hill'] },
  { id: 123988, name: 'Racing Bulls', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/123988.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Visa Cash App Racing Bulls', formation: 'Faenza, Italy', style: 'Constructor', description: 'Red Bull\'s sister team, formerly AlphaTauri/Toro Rosso.', trophies: ['Midfield Contender'], lineup: [], history: 'Known for developing young talent for Red Bull Racing.', legends: ['Sebastian Vettel', 'Max Verstappen'] },
  { id: 132211, name: 'Cadillac', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/132211.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Cadillac F1 Team', formation: 'USA', style: 'Constructor', description: 'New American constructor entering F1 in 2026.', trophies: ['New Entry'], lineup: [], history: 'GM/Cadillac\'s first factory F1 entry.', legends: [] },
  { id: 132212, name: 'Audi', logo: 'https://a.espncdn.com/i/teamlogos/f1/500/132212.png', league: 'F1 World Championship', leagueCode: 'f1', tagline: 'Audi F1 Team', formation: 'Hinwil, Switzerland', style: 'Constructor', description: 'German manufacturer entering F1 in 2026, taking over Sauber.', trophies: ['New Entry'], lineup: [], history: 'Audi\'s first venture into F1 as a full works team.', legends: [] }
];

/** Fetch clubs/teams for a sport by key (for survey per-sport accordion). Returns empty array on error. */
async function fetchClubsForSport(sportKey) {
  const config = SPORTS_CONFIG[sportKey];
  if (!config?.leagues) return [];
  const apiBase = `${SPORTS_API_SITE_ROOT}/${config.path}`;
  const leagues = config.leagues;
  const leagueNames = config.leagueNames || {};
  try {
    if (sportKey === 'f1') return F1_CONSTRUCTORS;
    if (sportKey === 'cricket') {
      const teamPromises = Object.entries(leagues).map(async ([key, code]) => {
        try {
          const res = await fetch(`${apiBase}/${code}/scoreboard`);
          const data = await res.json();
          const teams = data.teams || [];
          return teams.map(t => ({
            id: t.id,
            name: t.displayName || t.name,
            logo: t.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/cricket/500/${t.id}.png`,
            league: leagueNames[key] || 'Cricket',
            leagueCode: code,
            tagline: t.abbreviation || t.shortDisplayName || '',
            formation: t.location || 'Cricket',
            style: 'Cricket',
            description: `${t.displayName || t.name} competes in ${leagueNames[key]}.`,
            trophies: [],
            lineup: [],
            history: `${t.displayName || t.name} is tracked live from ESPNcricinfo data feeds.`,
            legends: []
          }));
        } catch (_err) {
          return [];
        }
      });
      const results = await Promise.all(teamPromises);
      return results.flat();
    }
    const uniqueClubLeagues = {};
    Object.entries(leagues).forEach(([key, code]) => {
      if (!uniqueClubLeagues[code]) uniqueClubLeagues[code] = key;
    });
    const teamPromises = Object.entries(uniqueClubLeagues).map(async ([code, key]) => {
      const res = await fetch(`${apiBase}/${code}/teams`);
      const data = await res.json();
      const leagueData = data.sports?.[0]?.leagues?.[0];
      const teams = leagueData?.teams || [];
      const groups = leagueData?.groups || [];
      const label = config.label || 'League';
      return teams.map(t => {
        let conference = '';
        if (sportKey === 'basketball' && groups.length > 0) {
          for (const g of groups) {
            if (g.teams?.some(gt => gt.id === t.team.id || gt.$ref?.includes(t.team.id))) {
              conference = g.name || g.abbreviation || '';
              break;
            }
          }
        }
        return {
          id: t.team.id,
          name: t.team.displayName,
          logo: t.team.logos?.[0]?.href,
          league: leagueNames[key] || label,
          leagueCode: code,
          tagline: t.team.shortDisplayName,
          conference: conference || (t.team.groups?.name || ''),
          formation: sportKey === 'soccer' ? '4-3-3' : (t.team.location || label),
          style: sportKey === 'soccer' ? 'Modern' : 'Elite',
          description: t.team.description || `${t.team.displayName} is a top ${label.toLowerCase()} team.`,
          trophies: sportKey === 'soccer' ? ['League Winner', 'Cup Winner', 'Continental Trophy'] : ['League Winner', 'Playoff Contender', 'Historic Team'],
          lineup: [],
          history: `${t.team.displayName} competes in ${leagueNames[key] || 'its league'} and is tracked live from ESPN data feeds.`,
          legends: ['Icon 1', 'Icon 2']
        };
      });
    });
    const results = await Promise.all(teamPromises);
    return results.flat();
  } catch (e) {
    console.error('fetchClubsForSport error:', sportKey, e);
    return [];
  }
}

const EXTRA_SPORT_PLAYERS = {
  basketball: [
    // === EASTERN CONFERENCE STARS ===
    { id: 4065648, name: 'Jayson Tatum', club: 'Boston Celtics', conference: 'East', position: 'SF', rating: 96, goals: 13500, assists: 2900, image: getNBAHeadshot(4065648), age: 26, height: '6\'8"', weight: '210 lbs', career: ['Celtics (2017-present)'], trophies: ['1x NBA Champion (2024)', '1x Finals MVP', '5x All-Star'], achievements: ['Led Celtics to 2024 title', 'Olympic Gold 2024', 'All-NBA First Team'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4065654, name: 'Jaylen Brown', club: 'Boston Celtics', conference: 'East', position: 'SG', rating: 92, goals: 10500, assists: 1800, image: getNBAHeadshot(4065654), age: 28, height: '6\'6"', weight: '223 lbs', career: ['Celtics (2016-present)'], trophies: ['1x NBA Champion (2024)', '1x Finals MVP', '3x All-Star'], achievements: ['Finals MVP 2024', 'All-NBA Third Team', 'Elite two-way wing'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3032977, name: 'Giannis Antetokounmpo', club: 'Milwaukee Bucks', conference: 'East', position: 'PF', rating: 97, goals: 19000, assists: 4300, image: getNBAHeadshot(3032977), age: 30, height: '6\'11"', weight: '243 lbs', career: ['Bucks (2013-present)'], trophies: ['1x NBA Champion (2021)', '2x MVP (2019, 2020)', '1x Finals MVP', '1x DPOY', '8x All-Star'], achievements: ['50-pt Finals closeout game', 'Back-to-back MVPs', 'Most dominant player in paint'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3059318, name: 'Joel Embiid', club: 'Philadelphia 76ers', conference: 'East', position: 'C', rating: 95, goals: 12500, assists: 2000, image: getNBAHeadshot(3059318), age: 30, height: '7\'0"', weight: '280 lbs', career: ['76ers (2014-present)'], trophies: ['1x MVP (2023)', '7x All-Star', '4x All-NBA'], achievements: ['Scoring Champion 2023', 'Olympic Gold 2024', 'Elite scoring center'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3908845, name: 'Donovan Mitchell', club: 'Cleveland Cavaliers', conference: 'East', position: 'SG', rating: 92, goals: 11500, assists: 2700, image: getNBAHeadshot(3908845), age: 28, height: '6\'1"', weight: '215 lbs', career: ['Jazz (2017-2022)', 'Cavaliers (2022-present)'], trophies: ['4x All-Star', '71-pt game'], achievements: ['71 points vs Bulls (franchise record)', 'Cavaliers transformation leader'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3102530, name: 'Bam Adebayo', club: 'Miami Heat', conference: 'East', position: 'C', rating: 90, goals: 8200, assists: 2300, image: getNBAHeadshot(3102530), age: 27, height: '6\'9"', weight: '255 lbs', career: ['Heat (2017-present)'], trophies: ['3x All-Star', '1x All-Defensive'], achievements: ['Olympic Gold 2024', 'Finals appearances 2020, 2023', 'Elite defender & playmaker'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4066336, name: 'Tyrese Haliburton', club: 'Indiana Pacers', conference: 'East', position: 'PG', rating: 91, goals: 5800, assists: 3200, image: getNBAHeadshot(4432166), age: 24, height: '6\'5"', weight: '185 lbs', career: ['Kings (2020-2022)', 'Pacers (2022-present)'], trophies: ['2x All-Star', 'All-NBA'], achievements: ['League assist leader 2024', 'Led Pacers to ECF 2024'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4431678, name: 'Scottie Barnes', club: 'Toronto Raptors', conference: 'East', position: 'SF', rating: 88, goals: 5500, assists: 2100, image: getNBAHeadshot(4431678), age: 23, height: '6\'7"', weight: '225 lbs', career: ['Raptors (2021-present)'], trophies: ['ROY 2022', '1x All-Star'], achievements: ['Rookie of the Year 2022', 'Franchise cornerstone'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3907387, name: 'Paolo Banchero', club: 'Orlando Magic', conference: 'East', position: 'PF', rating: 90, goals: 4800, assists: 1300, image: getNBAHeadshot(4706212), age: 22, height: '6\'10"', weight: '250 lbs', career: ['Magic (2022-present)'], trophies: ['ROY 2023', '1x All-Star'], achievements: ['#1 Overall Pick 2022', 'Magic franchise rebuild leader'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 6580, name: 'Jimmy Butler', club: 'Miami Heat', conference: 'East', position: 'SF', rating: 90, goals: 14200, assists: 3100, image: getNBAHeadshot(6580), age: 35, height: '6\'7"', weight: '230 lbs', career: ['Bulls (2011-2017)', 'Wolves (2017-2018)', '76ers (2018-2019)', 'Heat (2019-present)'], trophies: ['6x All-Star', '4x All-Defensive', '2x Finals appearance'], achievements: ['40-pt triple-double in Finals', 'Legendary playoff performer', '"Jimmy Buckets"'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3064514, name: 'Trae Young', club: 'Atlanta Hawks', conference: 'East', position: 'PG', rating: 89, goals: 10800, assists: 4600, image: getNBAHeadshot(4277905), age: 26, height: '6\'1"', weight: '164 lbs', career: ['Hawks (2018-present)'], trophies: ['3x All-Star', 'All-NBA'], achievements: ['Led Hawks to ECF 2021', 'Elite deep-range shooter', 'Averaged 28+ PPG'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4277811, name: 'LaMelo Ball', club: 'Charlotte Hornets', conference: 'East', position: 'PG', rating: 87, goals: 5000, assists: 2600, image: getNBAHeadshot(4432573), age: 23, height: '6\'7"', weight: '180 lbs', career: ['Hornets (2020-present)'], trophies: ['ROY 2021', '1x All-Star'], achievements: ['Youngest to record triple-double', 'Flashy passer & scorer'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4396993, name: 'Cade Cunningham', club: 'Detroit Pistons', conference: 'East', position: 'PG', rating: 88, goals: 5200, assists: 2400, image: getNBAHeadshot(4396993), age: 23, height: '6\'6"', weight: '220 lbs', career: ['Pistons (2021-present)'], trophies: ['All-Star 2025'], achievements: ['#1 Overall Pick 2021', 'Franchise player'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3102531, name: 'OG Anunoby', club: 'New York Knicks', conference: 'East', position: 'SF', rating: 87, goals: 5800, assists: 900, image: getNBAHeadshot(3102531), age: 27, height: '6\'7"', weight: '232 lbs', career: ['Raptors (2017-2024)', 'Knicks (2024-present)'], trophies: ['NBA Champion (2019)'], achievements: ['Elite 3-and-D wing', 'Key Knicks acquisition'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4278104, name: 'Jalen Brunson', club: 'New York Knicks', conference: 'East', position: 'PG', rating: 92, goals: 7600, assists: 3200, image: getNBAHeadshot(4278104), age: 28, height: '6\'2"', weight: '190 lbs', career: ['Mavericks (2018-2022)', 'Knicks (2022-present)'], trophies: ['3x All-Star'], achievements: ['Led Knicks playoff resurgence', 'Clutch scorer', '40-pt playoff games'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    // === WESTERN CONFERENCE STARS ===
    { id: 1966, name: 'LeBron James', club: 'Los Angeles Lakers', conference: 'West', position: 'SF', rating: 97, goals: 40874, assists: 11186, image: getNBAHeadshot(1966), age: 40, height: '6\'9"', weight: '250 lbs', career: ['Cavaliers (2003-2010)', 'Heat (2010-2014)', 'Cavaliers (2014-2018)', 'Lakers (2018-present)'], trophies: ['4x NBA Champion', '4x MVP', '4x Finals MVP', '20x All-Star', '1x Scoring Champion'], achievements: ['All-time NBA scoring leader (40,474 pts)', 'All-time minutes leader', 'Only player with 10,000+ AST & 40,000+ PTS'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3975, name: 'Stephen Curry', club: 'Golden State Warriors', conference: 'West', position: 'PG', rating: 96, goals: 24000, assists: 6500, image: getNBAHeadshot(3975), age: 36, height: '6\'2"', weight: '185 lbs', career: ['Warriors (2009-present)'], trophies: ['4x NBA Champion (2015, 2017, 2018, 2022)', '2x MVP (2015, 2016)', '1x Finals MVP (2022)', '10x All-Star', '2x Scoring Champion'], achievements: ['All-time 3-pt leader (3,700+)', 'Unanimous MVP (2016)', 'Revolutionized the 3-point era', 'Olympic Gold 2024'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3112335, name: 'Nikola Jokic', club: 'Denver Nuggets', conference: 'West', position: 'C', rating: 98, goals: 14500, assists: 4800, image: getNBAHeadshot(3112335), age: 30, height: '6\'11"', weight: '284 lbs', career: ['Nuggets (2015-present)'], trophies: ['1x NBA Champion (2023)', '3x MVP (2021, 2022, 2024)', '1x Finals MVP', '6x All-Star'], achievements: ['First player to average triple-double in playoffs', 'Most triple-doubles among centers', 'Elite passing big man'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 6583, name: 'Kevin Durant', club: 'Phoenix Suns', conference: 'West', position: 'SF', rating: 95, goals: 28000, assists: 5800, image: getNBAHeadshot(6583), age: 36, height: '6\'10"', weight: '240 lbs', career: ['Thunder (2007-2016)', 'Warriors (2016-2019)', 'Nets (2019-2023)', 'Suns (2023-present)'], trophies: ['2x NBA Champion (2017, 2018)', '2x Finals MVP', '1x MVP (2014)', '14x All-Star', '4x Scoring Champion'], achievements: ['All-time great scorer', 'Olympic Gold 3x', 'One of most versatile scorers ever'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3945274, name: 'Luka Doncic', club: 'Dallas Mavericks', conference: 'West', position: 'PG', rating: 96, goals: 10200, assists: 3500, image: getNBAHeadshot(3945274), age: 26, height: '6\'7"', weight: '230 lbs', career: ['Real Madrid (2015-2018)', 'Mavericks (2018-present)'], trophies: ['ROY 2019', '5x All-Star', '4x All-NBA First Team'], achievements: ['73 pts in single game (2024)', 'Led Mavs to Finals 2024', 'Euroleague MVP at age 19', 'Historic triple-double pace'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4279888, name: 'Ja Morant', club: 'Memphis Grizzlies', conference: 'West', position: 'PG', rating: 91, goals: 6500, assists: 2200, image: getNBAHeadshot(4279888), age: 25, height: '6\'3"', weight: '174 lbs', career: ['Grizzlies (2019-present)'], trophies: ['ROY 2020', 'MIP 2022', '2x All-Star'], achievements: ['Most athletic player in NBA', 'Insane highlight dunks', 'Led Grizzlies to #2 seed'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4594268, name: 'Anthony Edwards', club: 'Minnesota Timberwolves', conference: 'West', position: 'SG', rating: 94, goals: 8800, assists: 1900, image: getNBAHeadshot(4594268), age: 23, height: '6\'4"', weight: '225 lbs', career: ['Timberwolves (2020-present)'], trophies: ['2x All-Star', 'All-NBA', 'Olympic Gold 2024'], achievements: ['Led Wolves to WCF 2024', 'Face of new NBA generation', '"Ant-Man" — most explosive scorer'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3136776, name: 'Shai Gilgeous-Alexander', club: 'Oklahoma City Thunder', conference: 'West', position: 'SG', rating: 96, goals: 9200, assists: 2800, image: getNBAHeadshot(4278073), age: 26, height: '6\'6"', weight: '195 lbs', career: ['Clippers (2018-2019)', 'Thunder (2019-present)'], trophies: ['3x All-Star', '2x All-NBA First Team'], achievements: ['Led Thunder from rebuild to contender', 'Top 3 MVP candidate', 'Elite midrange scorer'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4437244, name: 'Victor Wembanyama', club: 'San Antonio Spurs', conference: 'West', position: 'C', rating: 93, goals: 3200, assists: 700, image: getNBAHeadshot(4867718), age: 21, height: '7\'4"', weight: '210 lbs', career: ['Spurs (2023-present)'], trophies: ['ROY 2024', '1x All-Star'], achievements: ['#1 Overall Pick 2023', 'Most hyped prospect since LeBron', 'Unicorn: 7\'4 with guard skills', 'Multiple 5x5 games'], primaryStatLabel: 'PTS', secondaryStatLabel: 'BLK' },
    { id: 4066261, name: 'Devin Booker', club: 'Phoenix Suns', conference: 'West', position: 'SG', rating: 92, goals: 12500, assists: 2800, image: getNBAHeadshot(3917376), age: 28, height: '6\'5"', weight: '206 lbs', career: ['Suns (2015-present)'], trophies: ['4x All-Star', 'Olympic Gold 2024', 'Finals 2021'], achievements: ['70-pt game (youngest ever)', 'Led Suns to 2021 Finals', 'Elite shooting & scoring'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 4431680, name: 'Chet Holmgren', club: 'Oklahoma City Thunder', conference: 'West', position: 'PF', rating: 88, goals: 2500, assists: 500, image: getNBAHeadshot(4431680), age: 22, height: '7\'0"', weight: '195 lbs', career: ['Thunder (2023-present)'], trophies: ['All-Rookie'], achievements: ['#2 Overall Pick 2022', 'Defensive anchor for Thunder', 'Rim protection + floor spacing'], primaryStatLabel: 'PTS', secondaryStatLabel: 'BLK' },
    { id: 3155526, name: 'Kawhi Leonard', club: 'LA Clippers', conference: 'West', position: 'SF', rating: 91, goals: 13200, assists: 2100, image: getNBAHeadshot(6450), age: 33, height: '6\'7"', weight: '225 lbs', career: ['Spurs (2011-2018)', 'Raptors (2018-2019)', 'Clippers (2019-present)'], trophies: ['2x NBA Champion (2014, 2019)', '2x Finals MVP', '2x DPOY', '5x All-Star'], achievements: ['Led Raptors to first title', 'The Claw — elite two-way player', 'Top 5 playoff performer all-time'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3064482, name: 'De\'Aaron Fox', club: 'Sacramento Kings', conference: 'West', position: 'PG', rating: 90, goals: 9500, assists: 3400, image: getNBAHeadshot(4066299), age: 26, height: '6\'3"', weight: '185 lbs', career: ['Kings (2017-present)'], trophies: ['2x All-Star'], achievements: ['Fastest player in NBA', 'Led Kings back to playoffs (2023)', 'Franchise cornerstone'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
    { id: 3908809, name: 'Jaren Jackson Jr.', club: 'Memphis Grizzlies', conference: 'West', position: 'PF', rating: 88, goals: 5800, assists: 600, image: getNBAHeadshot(4277843), age: 25, height: '6\'11"', weight: '242 lbs', career: ['Grizzlies (2018-present)'], trophies: ['DPOY 2023', '1x All-Star'], achievements: ['Defensive Player of the Year 2023', 'Elite shot-blocker', 'Modern stretch big'], primaryStatLabel: 'PTS', secondaryStatLabel: 'BLK' },
    { id: 3064290, name: 'Zion Williamson', club: 'New Orleans Pelicans', conference: 'West', position: 'PF', rating: 89, goals: 5200, assists: 1200, image: getNBAHeadshot(4395628), age: 24, height: '6\'6"', weight: '284 lbs', career: ['Pelicans (2019-present)'], trophies: ['1x All-Star'], achievements: ['#1 Overall Pick 2019', 'Most explosive athlete in NBA', '27 PPG on 60% FG'], primaryStatLabel: 'PTS', secondaryStatLabel: 'AST' },
  ],
  football: [
    { id: 3139477, name: 'Patrick Mahomes', club: 'Kansas City Chiefs', position: 'QB', rating: 98, goals: 28500, assists: 219, image: getNFLHeadshot(3139477), age: 29, height: '1.88m', weight: '102kg', career: ['Chiefs'], trophies: ['3x Super Bowl Champion', '2x MVP'], achievements: ['Super Bowl MVP multiple times'], primaryStatLabel: 'Pass YDS', secondaryStatLabel: 'TD' },
    { id: 3918298, name: 'Josh Allen', club: 'Buffalo Bills', position: 'QB', rating: 94, goals: 26000, assists: 205, image: getNFLHeadshot(3918298), age: 28, height: '1.96m', weight: '108kg', career: ['Bills'], trophies: ['Pro Bowl'], achievements: ['Elite dual-threat QB'], primaryStatLabel: 'Pass YDS', secondaryStatLabel: 'TD' },
    { id: 3916387, name: 'Lamar Jackson', club: 'Baltimore Ravens', position: 'QB', rating: 95, goals: 17000, assists: 150, image: getNFLHeadshot(3916387), age: 28, height: '1.88m', weight: '96kg', career: ['Ravens'], trophies: ['2x NFL MVP'], achievements: ['Most dangerous rushing QB'], primaryStatLabel: 'Pass YDS', secondaryStatLabel: 'TD' },
    { id: 4262921, name: 'Justin Jefferson', club: 'Minnesota Vikings', position: 'WR', rating: 95, goals: 7400, assists: 52, image: getNFLHeadshot(4262921), age: 25, height: '1.85m', weight: '88kg', career: ['Vikings'], trophies: ['All-Pro'], achievements: ['Historic early-career receiving pace'], primaryStatLabel: 'Rec YDS', secondaryStatLabel: 'Rec TD' },
    { id: 4040715, name: 'Jalen Hurts', club: 'Philadelphia Eagles', position: 'QB', rating: 93, goals: 12000, assists: 110, image: getNFLHeadshot(4040715), age: 26, height: '1.85m', weight: '103kg', career: ['Eagles'], trophies: ['Pro Bowl', 'NFC Champion'], achievements: ['Elite dual-threat QB'], primaryStatLabel: 'Pass YDS', secondaryStatLabel: 'TD' },
    { id: 3116406, name: 'Travis Kelce', club: 'Kansas City Chiefs', position: 'TE', rating: 96, goals: 11600, assists: 76, image: getNFLHeadshot(3116406), age: 35, height: '1.96m', weight: '113kg', career: ['Chiefs'], trophies: ['3x Super Bowl Champion'], achievements: ['Greatest TE in NFL history'], primaryStatLabel: 'Rec YDS', secondaryStatLabel: 'Rec TD' },
    { id: 3054850, name: 'Tyreek Hill', club: 'Miami Dolphins', position: 'WR', rating: 95, goals: 10400, assists: 72, image: getNFLHeadshot(3054850), age: 30, height: '1.78m', weight: '84kg', career: ['Chiefs', 'Dolphins'], trophies: ['Super Bowl Champion'], achievements: ['Fastest player in NFL'], primaryStatLabel: 'Rec YDS', secondaryStatLabel: 'Rec TD' },
    { id: 4241479, name: 'CeeDee Lamb', club: 'Dallas Cowboys', position: 'WR', rating: 94, goals: 5600, assists: 38, image: getNFLHeadshot(4241479), age: 25, height: '1.88m', weight: '88kg', career: ['Cowboys'], trophies: ['All-Pro'], achievements: ['Elite route runner'], primaryStatLabel: 'Rec YDS', secondaryStatLabel: 'Rec TD' }
  ],
  baseball: [
    { id: 39832, name: 'Shohei Ohtani', club: 'Los Angeles Dodgers', position: 'DH/P', rating: 99, goals: 225, assists: 860, image: getMLBHeadshot(39832), age: 30, height: '1.93m', weight: '95kg', career: ['Nippon-Ham Fighters', 'Angels', 'Dodgers'], trophies: ['3x AL MVP'], achievements: ['Best two-way player of the era'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' },
    { id: 33192, name: 'Aaron Judge', club: 'New York Yankees', position: 'OF', rating: 96, goals: 315, assists: 720, image: getMLBHeadshot(33192), age: 32, height: '2.01m', weight: '128kg', career: ['Yankees'], trophies: ['2x AL MVP'], achievements: ['AL single-season HR record (62)'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' },
    { id: 33039, name: 'Mookie Betts', club: 'Los Angeles Dodgers', position: 'OF/SS', rating: 94, goals: 270, assists: 830, image: getMLBHeadshot(33039), age: 32, height: '1.75m', weight: '82kg', career: ['Red Sox', 'Dodgers'], trophies: ['2x World Series Champion'], achievements: ['Gold Glove and MVP elite'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' },
    { id: 36185, name: 'Mike Trout', club: 'Los Angeles Angels', position: 'OF', rating: 95, goals: 380, assists: 920, image: getMLBHeadshot(36185), age: 33, height: '1.88m', weight: '107kg', career: ['Angels'], trophies: ['3x AL MVP'], achievements: ['Generational all-around talent'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' },
    { id: 41261, name: 'Ronald Acuna Jr.', club: 'Atlanta Braves', position: 'OF', rating: 95, goals: 180, assists: 520, image: getMLBHeadshot(41261), age: 27, height: '1.83m', weight: '93kg', career: ['Braves'], trophies: ['NL MVP', 'World Series Champion'], achievements: ['40-70 club member'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' },
    { id: 39878, name: 'Juan Soto', club: 'New York Mets', position: 'OF', rating: 94, goals: 200, assists: 600, image: getMLBHeadshot(39878), age: 26, height: '1.88m', weight: '100kg', career: ['Nationals', 'Padres', 'Yankees', 'Mets'], trophies: ['World Series Champion', 'Silver Slugger'], achievements: ['Elite on-base percentage'], primaryStatLabel: 'HR', secondaryStatLabel: 'RBI' }
  ],
  hockey: [
    { id: 3895074, name: 'Connor McDavid', club: 'Edmonton Oilers', position: 'Center', rating: 98, goals: 350, assists: 650, image: getNHLHeadshot(3895074), age: 28, height: '1.85m', weight: '88kg', career: ['Oilers'], trophies: ['Hart Trophy', 'Art Ross Trophy'], achievements: ['Fastest skater of his generation'], primaryStatLabel: 'G', secondaryStatLabel: 'A' },
    { id: 3041969, name: 'Nathan MacKinnon', club: 'Colorado Avalanche', position: 'Center', rating: 96, goals: 340, assists: 550, image: getNHLHeadshot(3041969), age: 29, height: '1.83m', weight: '91kg', career: ['Avalanche'], trophies: ['Stanley Cup Champion', 'Hart Trophy'], achievements: ['Playoff elite performer'], primaryStatLabel: 'G', secondaryStatLabel: 'A' },
    { id: 4024123, name: 'Auston Matthews', club: 'Toronto Maple Leafs', position: 'Center', rating: 96, goals: 380, assists: 290, image: getNHLHeadshot(4024123), age: 27, height: '1.91m', weight: '98kg', career: ['Maple Leafs'], trophies: ['Rocket Richard Trophy', 'Hart Trophy'], achievements: ['Top modern NHL goal scorer'], primaryStatLabel: 'G', secondaryStatLabel: 'A' },
    { id: 3114748, name: 'Nikita Kucherov', club: 'Tampa Bay Lightning', position: 'Right Wing', rating: 95, goals: 310, assists: 510, image: getNHLHeadshot(3114748), age: 31, height: '1.78m', weight: '81kg', career: ['Lightning'], trophies: ['2x Stanley Cup Champion'], achievements: ['Art Ross and Conn Smythe winner'], primaryStatLabel: 'G', secondaryStatLabel: 'A' },
    { id: 5104, name: 'Leon Draisaitl', club: 'Edmonton Oilers', position: 'Center', rating: 95, goals: 330, assists: 470, image: getNHLHeadshot(3904173), age: 29, height: '1.88m', weight: '93kg', career: ['Oilers'], trophies: ['Hart Trophy', 'Art Ross'], achievements: ['Elite goal-scoring center'], primaryStatLabel: 'G', secondaryStatLabel: 'A' },
    { id: 3042010, name: 'David Pastrnak', club: 'Boston Bruins', position: 'Right Wing', rating: 94, goals: 320, assists: 310, image: getNHLHeadshot(3042010), age: 28, height: '1.83m', weight: '88kg', career: ['Bruins'], trophies: ['Rocket Richard Trophy'], achievements: ['Czech superstar sniper'], primaryStatLabel: 'G', secondaryStatLabel: 'A' }
  ],
  cricket: [
    // === INDIA ===
    { id: 253802, name: 'Virat Kohli', club: 'India / RCB', position: 'Batter', rating: 97, goals: 26733, assists: 80, image: getCricketHeadshot(253802), age: 36, height: '1.75m', weight: '69kg', career: ['India', 'Royal Challengers Bangalore'], trophies: ['ICC Champions Trophy 2013', 'ICC Test Team of Decade'], achievements: ['50+ ODI centuries', 'One of the all-time ODI greats'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 34102, name: 'Rohit Sharma', club: 'India / MI', position: 'Batter', rating: 95, goals: 18437, assists: 49, image: getCricketHeadshot(34102), age: 37, height: '1.74m', weight: '72kg', career: ['India', 'Mumbai Indians'], trophies: ['5x IPL Champion', 'Asia Cup'], achievements: ['Highest ODI score (264)', 'Double-century record holder'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 625383, name: 'Jasprit Bumrah', club: 'India / MI', position: 'Bowler', rating: 96, goals: 427, assists: 9, image: getCricketHeadshot(625383), age: 31, height: '1.78m', weight: '68kg', career: ['India', 'Mumbai Indians'], trophies: ['ICC #1 Test Bowler', 'IPL Champion'], achievements: ['Elite yorker specialist', 'All-format spearhead'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 10617, name: 'MS Dhoni', club: 'India / CSK', position: 'Wicketkeeper', rating: 96, goals: 17266, assists: 0, image: getCricketHeadshot(10617), age: 43, height: '1.75m', weight: '72kg', career: ['India', 'Chennai Super Kings'], trophies: ['2x World Cup', '5x IPL', 'Champions Trophy'], achievements: ['Legendary finisher & captain', 'Most IPL titles as captain'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 422108, name: 'KL Rahul', club: 'India / LSG', position: 'Batter', rating: 90, goals: 9500, assists: 0, image: getCricketHeadshot(422108), age: 32, height: '1.80m', weight: '72kg', career: ['India', 'Lucknow Super Giants'], trophies: ['Asia Cup'], achievements: ['Elite opener across formats', 'IPL Orange Cap'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 931581, name: 'Rishabh Pant', club: 'India / DC', position: 'Wicketkeeper', rating: 91, goals: 4500, assists: 0, image: getCricketHeadshot(931581), age: 27, height: '1.70m', weight: '65kg', career: ['India', 'Delhi Capitals'], trophies: ['Border-Gavaskar hero'], achievements: ['Match-winning keeper-batter', 'Gabba 2021'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 234675, name: 'Ravindra Jadeja', club: 'India / CSK', position: 'All-rounder', rating: 93, goals: 6500, assists: 575, image: getCricketHeadshot(234675), age: 36, height: '1.75m', weight: '70kg', career: ['India', 'Chennai Super Kings'], trophies: ['5x IPL', '2x Champions Trophy'], achievements: ['Elite all-rounder', 'Best fielder in world'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 481235, name: 'Mohammed Shami', club: 'India / GT', position: 'Bowler', rating: 92, goals: 449, assists: 3, image: getCricketHeadshot(481235), age: 34, height: '1.78m', weight: '72kg', career: ['India', 'Gujarat Titans'], trophies: ['WTC Final 2023'], achievements: ['World Cup 2023 leading wicket-taker', 'Swing master'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 419873, name: 'Mohammed Siraj', club: 'India / RCB', position: 'Bowler', rating: 89, goals: 180, assists: 2, image: getCricketHeadshot(419873), age: 30, height: '1.78m', weight: '71kg', career: ['India', 'Royal Challengers Bangalore'], trophies: ['Asia Cup 2023'], achievements: ['Rapid rise in Tests & ODIs', 'Lords 5-for'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 1070173, name: 'Shubman Gill', club: 'India / GT', position: 'Batter', rating: 90, goals: 4500, assists: 0, image: getCricketHeadshot(1070173), age: 25, height: '1.78m', weight: '68kg', career: ['India', 'Gujarat Titans'], trophies: ['IPL 2023 runner-up'], achievements: ['Double century in ODIs', 'Next-gen star'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 625371, name: 'Hardik Pandya', club: 'India / MI', position: 'All-rounder', rating: 90, goals: 3500, assists: 120, image: getCricketHeadshot(625371), age: 31, height: '1.83m', weight: '75kg', career: ['India', 'Mumbai Indians'], trophies: ['5x IPL', 'Champions Trophy'], achievements: ['Power-hitter & seamer', 'T20 World Cup key'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 341016, name: 'Ravichandran Ashwin', club: 'India / RR', position: 'Bowler', rating: 92, goals: 516, assists: 3, image: getCricketHeadshot(341016), age: 38, height: '1.86m', weight: '80kg', career: ['India', 'Rajasthan Royals'], trophies: ['2x IPL', 'WTC'], achievements: ['500+ Test wickets', 'Elite off-spinner'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 447261, name: 'Kuldeep Yadav', club: 'India / DC', position: 'Bowler', rating: 88, goals: 285, assists: 2, image: getCricketHeadshot(447261), age: 29, height: '1.68m', weight: '65kg', career: ['India', 'Delhi Capitals'], trophies: ['Asia Cup'], achievements: ['Left-arm wrist-spin', 'World Cup 2023 star'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 374207, name: 'Shreyas Iyer', club: 'India / KKR', position: 'Batter', rating: 88, goals: 4500, assists: 0, image: getCricketHeadshot(374207), age: 30, height: '1.78m', weight: '72kg', career: ['India', 'Kolkata Knight Riders'], trophies: ['IPL 2024'], achievements: ['Middle-order mainstay', 'ICC tournament runs'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    // === AUSTRALIA ===
    { id: 28081, name: 'Pat Cummins', club: 'Australia / SRH', position: 'Bowler', rating: 95, goals: 398, assists: 8, image: getCricketHeadshot(28081), age: 31, height: '1.92m', weight: '82kg', career: ['Australia', 'Sunrisers Hyderabad'], trophies: ['World Cup 2023', 'WTC', 'T20 World Cup 2021'], achievements: ['Australian captain', 'All-format leader'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 267192, name: 'Steve Smith', club: 'Australia / DC', position: 'Batter', rating: 94, goals: 15500, assists: 44, image: getCricketHeadshot(267192), age: 35, height: '1.76m', weight: '72kg', career: ['Australia', 'Delhi Capitals'], trophies: ['2x World Cup', '5x Ashes'], achievements: ['Elite Test batsman', 'ICC Cricketer of Decade'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 311592, name: 'Mitchell Starc', club: 'Australia / KKR', position: 'Bowler', rating: 93, goals: 656, assists: 12, image: getCricketHeadshot(311592), age: 34, height: '1.96m', weight: '88kg', career: ['Australia', 'Kolkata Knight Riders'], trophies: ['2x World Cup', 'Ashes'], achievements: ['Left-arm pace king', 'World Cup 2015 & 2023 star'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 288284, name: 'Josh Hazlewood', club: 'Australia / RCB', position: 'Bowler', rating: 91, goals: 292, assists: 5, image: getCricketHeadshot(288284), age: 33, height: '1.96m', weight: '92kg', career: ['Australia', 'Royal Challengers Bangalore'], trophies: ['World Cup 2023', 'WTC'], achievements: ['Metronomic accuracy', 'Test & white-ball spearhead'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 46248, name: 'David Warner', club: 'Australia / DC', position: 'Batter', rating: 91, goals: 18600, assists: 8, image: getCricketHeadshot(46248), age: 38, height: '1.70m', weight: '72kg', career: ['Australia', 'Delhi Capitals'], trophies: ['T20 World Cup', 'IPL Orange Cap 3x'], achievements: ['Triple-century in Tests', 'Aggressive opener'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 390579, name: 'Glenn Maxwell', club: 'Australia / RCB', position: 'All-rounder', rating: 92, goals: 5500, assists: 95, image: getCricketHeadshot(390579), age: 36, height: '1.82m', weight: '78kg', career: ['Australia', 'Royal Challengers Bangalore'], trophies: ['T20 World Cup 2021', 'World Cup 2023'], achievements: ['201* in World Cup', 'Big Show'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 325026, name: 'Travis Head', club: 'Australia / SRH', position: 'Batter', rating: 90, goals: 5500, assists: 0, image: getCricketHeadshot(325026), age: 30, height: '1.78m', weight: '72kg', career: ['Australia', 'Sunrisers Hyderabad'], trophies: ['World Cup 2023', 'WTC'], achievements: ['World Cup 2023 Final centurion', 'Attacking opener'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 366439, name: 'Mitchell Marsh', club: 'Australia / DC', position: 'All-rounder', rating: 89, goals: 4500, assists: 85, image: getCricketHeadshot(366439), age: 33, height: '1.93m', weight: '95kg', career: ['Australia', 'Delhi Capitals'], trophies: ['T20 World Cup 2021', 'World Cup 2023'], achievements: ['T20 WC 2021 Final MOTM', 'Power all-rounder'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 592961, name: 'Cameron Green', club: 'Australia / RCB', position: 'All-rounder', rating: 88, goals: 2500, assists: 45, image: getCricketHeadshot(592961), age: 25, height: '1.98m', weight: '90kg', career: ['Australia', 'Royal Challengers Bangalore'], trophies: ['World Cup 2023'], achievements: ['Elite pace all-rounder', 'Century on Test debut'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 326015, name: 'Nathan Lyon', club: 'Australia', position: 'Bowler', rating: 91, goals: 530, assists: 22, image: getCricketHeadshot(326015), age: 37, height: '1.84m', weight: '84kg', career: ['Australia', 'New South Wales'], trophies: ['Ashes', 'WTC'], achievements: ['500+ Test wickets', 'GOAT off-spinner'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 326014, name: 'Alex Carey', club: 'Australia', position: 'Wicketkeeper', rating: 87, goals: 2500, assists: 0, image: getCricketHeadshot(326014), age: 33, height: '1.80m', weight: '78kg', career: ['Australia'], trophies: ['World Cup 2023', 'WTC'], achievements: ['Test keeper-batter', 'Stumping specialist'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 533292, name: 'Adam Zampa', club: 'Australia / RR', position: 'Bowler', rating: 88, goals: 215, assists: 2, image: getCricketHeadshot(533292), age: 32, height: '1.78m', weight: '72kg', career: ['Australia', 'Rajasthan Royals'], trophies: ['World Cup 2023'], achievements: ['Leading white-ball leg-spinner'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    // === ENGLAND ===
    { id: 232364, name: 'Joe Root', club: 'England / TKR', position: 'Batter', rating: 94, goals: 19000, assists: 62, image: getCricketHeadshot(232364), age: 34, height: '1.83m', weight: '80kg', career: ['England', 'Yorkshire'], trophies: ['T20 World Cup 2022', 'Ashes'], achievements: ['England all-time Test run-scorer', 'All-format class'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 230853, name: 'Ben Stokes', club: 'England / CSK', position: 'All-rounder', rating: 94, goals: 12500, assists: 235, image: getCricketHeadshot(230853), age: 33, height: '1.85m', weight: '85kg', career: ['England', 'Chennai Super Kings'], trophies: ['World Cup 2019', 'T20 World Cup 2022'], achievements: ['Headingley 2019', 'Captain in all formats'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 297433, name: 'Jonny Bairstow', club: 'England / PBKS', position: 'Wicketkeeper', rating: 90, goals: 8500, assists: 0, image: getCricketHeadshot(297433), age: 35, height: '1.78m', weight: '78kg', career: ['England', 'Punjab Kings'], trophies: ['T20 World Cup 2022'], achievements: ['Dual-hundred in Test', 'Aggressive keeper-batter'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 308967, name: 'Jos Buttler', club: 'England / RR', position: 'Wicketkeeper', rating: 93, goals: 9500, assists: 0, image: getCricketHeadshot(308967), age: 34, height: '1.80m', weight: '72kg', career: ['England', 'Rajasthan Royals'], trophies: ['T20 World Cup 2022', '50-over World Cup 2019'], achievements: ['England white-ball captain', 'T20 destroyer'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 512622, name: 'Harry Brook', club: 'England / DC', position: 'Batter', rating: 88, goals: 2500, assists: 0, image: getCricketHeadshot(512622), age: 25, height: '1.83m', weight: '75kg', career: ['England', 'Delhi Capitals'], trophies: ['T20 World Cup 2022'], achievements: ['Century in 80 balls in Tests', 'Next-gen star'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 467664, name: 'Mark Wood', club: 'England / LSG', position: 'Bowler', rating: 89, goals: 185, assists: 4, image: getCricketHeadshot(467664), age: 34, height: '1.88m', weight: '85kg', career: ['England', 'Lucknow Super Giants'], trophies: ['T20 World Cup 2022', 'Ashes'], achievements: ['100mph pace', 'X-factor bowler'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 365448, name: 'Jofra Archer', club: 'England / MI', position: 'Bowler', rating: 90, goals: 105, assists: 3, image: getCricketHeadshot(365448), age: 29, height: '1.83m', weight: '76kg', career: ['England', 'Mumbai Indians'], trophies: ['World Cup 2019', 'T20 World Cup 2022'], achievements: ['Super Over hero 2019', 'Express pace'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 931903, name: 'Liam Livingstone', club: 'England / RR', position: 'All-rounder', rating: 87, goals: 2500, assists: 45, image: getCricketHeadshot(931903), age: 31, height: '1.85m', weight: '82kg', career: ['England', 'Rajasthan Royals'], trophies: ['T20 World Cup 2022'], achievements: ['Power-hitter & part-time spin'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 249866, name: 'Dawid Malan', club: 'England', position: 'Batter', rating: 86, goals: 4500, assists: 0, image: getCricketHeadshot(249866), age: 37, height: '1.85m', weight: '82kg', career: ['England', 'Yorkshire'], trophies: ['T20 World Cup 2022'], achievements: ['T20I #1 batter', 'Consistent run-scorer'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    // === PAKISTAN ===
    { id: 348144, name: 'Babar Azam', club: 'Pakistan / PZ', position: 'Batter', rating: 93, goals: 13000, assists: 0, image: getCricketHeadshot(348144), age: 30, height: '1.80m', weight: '70kg', career: ['Pakistan', 'Peshawar Zalmi'], trophies: ['ICC #1 ODI batter', 'PSL'], achievements: ['Elegant all-format run-machine'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 896485, name: 'Mohammad Rizwan', club: 'Pakistan / MS', position: 'Wicketkeeper', rating: 91, goals: 6500, assists: 0, image: getCricketHeadshot(896485), age: 32, height: '1.75m', weight: '68kg', career: ['Pakistan', 'Multan Sultans'], trophies: ['PSL Champion'], achievements: ['T20 run-machine', 'Elite keeper-batter'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 1175352, name: 'Shaheen Afridi', club: 'Pakistan / LQ', position: 'Bowler', rating: 93, goals: 285, assists: 5, image: getCricketHeadshot(1175352), age: 24, height: '1.98m', weight: '82kg', career: ['Pakistan', 'Lahore Qalandars'], trophies: ['2x PSL', 'T20 World Cup 2022'], achievements: ['Left-arm swing king', 'New-ball destroyer'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 960491, name: 'Shadab Khan', club: 'Pakistan / IU', position: 'All-rounder', rating: 88, goals: 2500, assists: 185, image: getCricketHeadshot(960491), age: 26, height: '1.75m', weight: '68kg', career: ['Pakistan', 'Islamabad United'], trophies: ['PSL'], achievements: ['Leg-spin & lower-order hitting'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 940973, name: 'Haris Rauf', club: 'Pakistan / LQ', position: 'Bowler', rating: 88, goals: 125, assists: 2, image: getCricketHeadshot(940973), age: 31, height: '1.88m', weight: '78kg', career: ['Pakistan', 'Lahore Qalandars'], trophies: ['PSL'], achievements: ['Raw pace', 'T20 specialist'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 1243994, name: 'Naseem Shah', club: 'Pakistan / QG', position: 'Bowler', rating: 87, goals: 95, assists: 2, image: getCricketHeadshot(1243994), age: 22, height: '1.78m', weight: '72kg', career: ['Pakistan', 'Quetta Gladiators'], trophies: ['Asia Cup'], achievements: ['Young pace sensation', 'Hat-trick as teenager'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 419232, name: 'Imam-ul-Haq', club: 'Pakistan', position: 'Batter', rating: 85, goals: 4500, assists: 0, image: getCricketHeadshot(419232), age: 29, height: '1.80m', weight: '75kg', career: ['Pakistan'], trophies: ['PSL'], achievements: ['Consistent ODI opener'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 436757, name: 'Fakhar Zaman', club: 'Pakistan / LQ', position: 'Batter', rating: 87, goals: 4500, assists: 0, image: getCricketHeadshot(436757), age: 34, height: '1.83m', weight: '78kg', career: ['Pakistan', 'Lahore Qalandars'], trophies: ['Champions Trophy 2017'], achievements: ['CT 2017 Final 114', 'Attacking opener'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    // === NEW ZEALAND ===
    { id: 277916, name: 'Kane Williamson', club: 'New Zealand / GT', position: 'Batter', rating: 94, goals: 17500, assists: 45, image: getCricketHeadshot(277916), age: 34, height: '1.80m', weight: '82kg', career: ['New Zealand', 'Gujarat Titans'], trophies: ['WTC Champion', 'ICC Spirit of Cricket'], achievements: ['NZ leading run-scorer', 'Elite in all formats'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 277912, name: 'Trent Boult', club: 'New Zealand / RR', position: 'Bowler', rating: 92, goals: 358, assists: 11, image: getCricketHeadshot(277912), age: 35, height: '1.85m', weight: '88kg', career: ['New Zealand', 'Rajasthan Royals'], trophies: ['WTC', 'T20 World Cup 2021 finalist'], achievements: ['Left-arm swing', 'New-ball wizard'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 277913, name: 'Tim Southee', club: 'New Zealand', position: 'Bowler', rating: 90, goals: 376, assists: 16, image: getCricketHeadshot(277913), age: 36, height: '1.88m', weight: '90kg', career: ['New Zealand'], trophies: ['WTC', 'World Test Champion'], achievements: ['NZ Test captain', '400+ Test wickets'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 518100, name: 'Mitchell Santner', club: 'New Zealand / CSK', position: 'All-rounder', rating: 87, goals: 2500, assists: 195, image: getCricketHeadshot(518100), age: 32, height: '1.88m', weight: '82kg', career: ['New Zealand', 'Chennai Super Kings'], trophies: ['WTC'], achievements: ['Left-arm spin & lower-order runs'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 277918, name: 'Devon Conway', club: 'New Zealand / CSK', position: 'Batter', rating: 89, goals: 4500, assists: 0, image: getCricketHeadshot(277918), age: 33, height: '1.78m', weight: '75kg', career: ['New Zealand', 'Chennai Super Kings'], trophies: ['WTC'], achievements: ['Double century on Test debut', 'Elegant left-hander'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 518097, name: 'Daryl Mitchell', club: 'New Zealand / RR', position: 'All-rounder', rating: 88, goals: 3500, assists: 35, image: getCricketHeadshot(518097), age: 33, height: '1.88m', weight: '88kg', career: ['New Zealand', 'Rajasthan Royals'], trophies: ['WTC'], achievements: ['World Cup 2023 centuries', 'Clutch performer'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 518099, name: 'Glenn Phillips', club: 'New Zealand / SRH', position: 'Batter', rating: 86, goals: 2500, assists: 0, image: getCricketHeadshot(518099), age: 28, height: '1.78m', weight: '72kg', career: ['New Zealand', 'Sunrisers Hyderabad'], trophies: ['T20 World Cup 2021 finalist'], achievements: ['T20 power-hitter', 'Elite fielder'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 518098, name: 'Matt Henry', club: 'New Zealand', position: 'Bowler', rating: 87, goals: 258, assists: 8, image: getCricketHeadshot(518098), age: 32, height: '1.88m', weight: '88kg', career: ['New Zealand'], trophies: ['WTC'], achievements: ['Swing bowler', 'WTC Final 2021 star'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    // === SOUTH AFRICA ===
    { id: 379143, name: 'Quinton de Kock', club: 'South Africa / LSG', position: 'Wicketkeeper', rating: 92, goals: 14500, assists: 0, image: getCricketHeadshot(379143), age: 31, height: '1.78m', weight: '75kg', career: ['South Africa', 'Lucknow Super Giants'], trophies: ['SA20', 'IPL'], achievements: ['Elite left-handed opener', 'Retired from Tests'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 303669, name: 'Kagiso Rabada', club: 'South Africa / PBKS', position: 'Bowler', rating: 93, goals: 458, assists: 14, image: getCricketHeadshot(303669), age: 29, height: '1.85m', weight: '82kg', career: ['South Africa', 'Punjab Kings'], trophies: ['SA20'], achievements: ['Elite pace', '300+ Test wickets'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 481896, name: 'Aiden Markram', club: 'South Africa / SRH', position: 'Batter', rating: 89, goals: 5500, assists: 0, image: getCricketHeadshot(481896), age: 30, height: '1.85m', weight: '82kg', career: ['South Africa', 'Sunrisers Hyderabad'], trophies: ['SA20', 'U19 World Cup'], achievements: ['T20I captain', 'Century in WC 2023'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 481897, name: 'Heinrich Klaasen', club: 'South Africa / RCB', position: 'Wicketkeeper', rating: 90, goals: 3500, assists: 0, image: getCricketHeadshot(481897), age: 33, height: '1.78m', weight: '78kg', career: ['South Africa', 'Royal Challengers Bangalore'], trophies: ['SA20'], achievements: ['Power-hitter', 'Century vs England 2023'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 44936, name: 'David Miller', club: 'South Africa / GT', position: 'Batter', rating: 88, goals: 4500, assists: 0, image: getCricketHeadshot(44936), age: 35, height: '1.85m', weight: '85kg', career: ['South Africa', 'Gujarat Titans'], trophies: ['IPL 2022'], achievements: ['Killer Miller', 'Finisher'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 481900, name: 'Marco Jansen', club: 'South Africa / SRH', position: 'All-rounder', rating: 86, goals: 800, assists: 85, image: getCricketHeadshot(481900), age: 24, height: '2.06m', weight: '95kg', career: ['South Africa', 'Sunrisers Hyderabad'], trophies: ['SA20'], achievements: ['Left-arm pace & lower-order runs'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 44932, name: 'Keshav Maharaj', club: 'South Africa', position: 'Bowler', rating: 86, goals: 195, assists: 8, image: getCricketHeadshot(44932), age: 34, height: '1.78m', weight: '72kg', career: ['South Africa'], trophies: ['SA20'], achievements: ['Left-arm orthodox', 'Test match-winner'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 481234, name: 'Anrich Nortje', club: 'South Africa / DC', position: 'Bowler', rating: 88, goals: 125, assists: 2, image: getCricketHeadshot(481234), age: 31, height: '1.88m', weight: '85kg', career: ['South Africa', 'Delhi Capitals'], trophies: ['SA20'], achievements: ['Express pace', '155kph+'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    // === WEST INDIES ===
    { id: 529963, name: 'Shai Hope', club: 'West Indies', position: 'Wicketkeeper', rating: 88, goals: 6500, assists: 0, image: getCricketHeadshot(529963), age: 31, height: '1.78m', weight: '72kg', career: ['West Indies', 'Barbados'], trophies: ['ODI captain'], achievements: ['ODI double-century', 'Consistent run-scorer'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 529964, name: 'Nicholas Pooran', club: 'West Indies / LSG', position: 'Wicketkeeper', rating: 89, goals: 4500, assists: 0, image: getCricketHeadshot(529964), age: 29, height: '1.70m', weight: '68kg', career: ['West Indies', 'Lucknow Super Giants'], trophies: ['CPL'], achievements: ['T20 power-hitter', 'White-ball captain'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 529965, name: 'Shamar Joseph', club: 'West Indies', position: 'Bowler', rating: 87, goals: 25, assists: 2, image: getCricketHeadshot(529965), age: 25, height: '1.85m', weight: '78kg', career: ['West Indies', 'Guyana'], trophies: ['Brisbane hero 2024'], achievements: ['7-for to beat Australia at Gabba'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 529966, name: 'Jason Holder', club: 'West Indies / RR', position: 'All-rounder', rating: 90, goals: 4500, assists: 155, image: getCricketHeadshot(529966), age: 33, height: '2.01m', weight: '100kg', career: ['West Indies', 'Rajasthan Royals'], trophies: ['T20 World Cup 2016'], achievements: ['Test double-century', 'Elite all-rounder'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 276298, name: 'Andre Russell', club: 'West Indies / KKR', position: 'All-rounder', rating: 91, goals: 3500, assists: 285, image: getCricketHeadshot(276298), age: 36, height: '1.83m', weight: '95kg', career: ['West Indies', 'Kolkata Knight Riders'], trophies: ['2x T20 World Cup', 'IPL'], achievements: ['Power-hitter & pace', 'Dre Russ'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 529968, name: 'Rovman Powell', club: 'West Indies / RR', position: 'Batter', rating: 85, goals: 2500, assists: 0, image: getCricketHeadshot(529968), age: 31, height: '1.88m', weight: '88kg', career: ['West Indies', 'Rajasthan Royals'], trophies: ['CPL'], achievements: ['T20 captain', 'Big-hitter'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 529969, name: 'Alzarri Joseph', club: 'West Indies / RCB', position: 'Bowler', rating: 86, goals: 95, assists: 2, image: getCricketHeadshot(529969), age: 28, height: '1.93m', weight: '85kg', career: ['West Indies', 'Royal Challengers Bangalore'], trophies: ['CPL'], achievements: ['6-for on IPL debut', 'Pace'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    // === AFGHANISTAN ===
    { id: 326016, name: 'Rashid Khan', club: 'Afghanistan / GT', position: 'Bowler', rating: 95, goals: 455, assists: 14, image: getCricketHeadshot(326016), age: 26, height: '1.70m', weight: '62kg', career: ['Afghanistan', 'Gujarat Titans'], trophies: ['IPL Purple Cap contender', 'PSL'], achievements: ['Premier T20 leg-spinner', '100 T20I wickets'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 25913, name: 'Mohammad Nabi', club: 'Afghanistan / MI', position: 'All-rounder', rating: 88, goals: 4500, assists: 155, image: getCricketHeadshot(25913), age: 39, height: '1.82m', weight: '78kg', career: ['Afghanistan', 'Mumbai Indians'], trophies: ['PSL', 'BBL'], achievements: ['Pioneer of Afghan cricket', 'Off-spin & power-hitting'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 960489, name: 'Mujeeb Ur Rahman', club: 'Afghanistan / KKR', position: 'Bowler', rating: 87, goals: 125, assists: 2, image: getCricketHeadshot(960489), age: 23, height: '1.75m', weight: '68kg', career: ['Afghanistan', 'Kolkata Knight Riders'], trophies: ['BBL'], achievements: ['Mystery spinner', 'Young gun'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 1243995, name: 'Rahmanullah Gurbaz', club: 'Afghanistan / KKR', position: 'Wicketkeeper', rating: 85, goals: 2000, assists: 0, image: getCricketHeadshot(1243995), age: 23, height: '1.78m', weight: '72kg', career: ['Afghanistan', 'Kolkata Knight Riders'], trophies: ['PSL'], achievements: ['Aggressive opener', 'T20 star'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 1243996, name: 'Ibrahim Zadran', club: 'Afghanistan', position: 'Batter', rating: 86, goals: 2500, assists: 0, image: getCricketHeadshot(1243996), age: 22, height: '1.80m', weight: '72kg', career: ['Afghanistan'], trophies: ['World Cup 2023'], achievements: ['Century vs Australia in WC 2023'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 1243997, name: 'Fazalhaq Farooqi', club: 'Afghanistan / SRH', position: 'Bowler', rating: 84, goals: 85, assists: 2, image: getCricketHeadshot(1243997), age: 24, height: '1.88m', weight: '78kg', career: ['Afghanistan', 'Sunrisers Hyderabad'], trophies: ['PSL'], achievements: ['Left-arm swing', 'T20 World Cup 2024'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    // === SRI LANKA ===
    { id: 497121, name: 'Wanindu Hasaranga', club: 'Sri Lanka / SRH', position: 'All-rounder', rating: 90, goals: 2500, assists: 185, image: getCricketHeadshot(497121), age: 27, height: '1.75m', weight: '68kg', career: ['Sri Lanka', 'Sunrisers Hyderabad'], trophies: ['Asia Cup'], achievements: ['Leg-spin & lower-order runs', 'T20 star'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 497122, name: 'Maheesh Theekshana', club: 'Sri Lanka / CSK', position: 'Bowler', rating: 86, goals: 95, assists: 2, image: getCricketHeadshot(497122), age: 24, height: '1.78m', weight: '72kg', career: ['Sri Lanka', 'Chennai Super Kings'], trophies: ['Asia Cup'], achievements: ['Mystery spinner', 'IPL impact'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 497123, name: 'Pathum Nissanka', club: 'Sri Lanka', position: 'Batter', rating: 86, goals: 3500, assists: 0, image: getCricketHeadshot(497123), age: 26, height: '1.78m', weight: '72kg', career: ['Sri Lanka'], trophies: ['Asia Cup 2022'], achievements: ['First SL T20I double-century'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    { id: 497124, name: 'Dasun Shanaka', club: 'Sri Lanka', position: 'All-rounder', rating: 84, goals: 2500, assists: 75, image: getCricketHeadshot(497124), age: 33, height: '1.83m', weight: '82kg', career: ['Sri Lanka'], trophies: ['Asia Cup 2022'], achievements: ['White-ball captain', 'Finisher'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 497125, name: 'Charith Asalanka', club: 'Sri Lanka', position: 'Batter', rating: 85, goals: 2500, assists: 0, image: getCricketHeadshot(497125), age: 27, height: '1.78m', weight: '75kg', career: ['Sri Lanka'], trophies: ['Asia Cup'], achievements: ['Middle-order mainstay', 'T20 World Cup 2024'], primaryStatLabel: 'Runs', secondaryStatLabel: '100s' },
    // === BANGLADESH ===
    { id: 56143, name: 'Shakib Al Hasan', club: 'Bangladesh / KKR', position: 'All-rounder', rating: 92, goals: 7500, assists: 450, image: getCricketHeadshot(56143), age: 38, height: '1.75m', weight: '72kg', career: ['Bangladesh', 'Kolkata Knight Riders'], trophies: ['Multiple BPL'], achievements: ['#1 all-rounder in all formats', 'Legend'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Wkts' },
    { id: 56144, name: 'Litton Das', club: 'Bangladesh', position: 'Wicketkeeper', rating: 85, goals: 4500, assists: 0, image: getCricketHeadshot(56144), age: 30, height: '1.70m', weight: '65kg', career: ['Bangladesh'], trophies: ['BPL'], achievements: ['Test century at Lord\'s', 'Opener'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' },
    { id: 56145, name: 'Taskin Ahmed', club: 'Bangladesh', position: 'Bowler', rating: 85, goals: 125, assists: 3, image: getCricketHeadshot(56145), age: 29, height: '1.88m', weight: '82kg', career: ['Bangladesh'], trophies: ['BPL'], achievements: ['Pace spearhead', 'ODI star'], primaryStatLabel: 'Wickets', secondaryStatLabel: '5WI' },
    { id: 56146, name: 'Mustafizur Rahman', club: 'Bangladesh / CSK', position: 'Bowler', rating: 87, goals: 185, assists: 4, image: getCricketHeadshot(56146), age: 29, height: '1.78m', weight: '72kg', career: ['Bangladesh', 'Chennai Super Kings'], trophies: ['BPL', 'IPL'], achievements: ['The Fizz', 'Cutter specialist'], primaryStatLabel: 'Wickets', secondaryStatLabel: '4WI' },
    { id: 56147, name: 'Mushfiqur Rahim', club: 'Bangladesh', position: 'Wicketkeeper', rating: 86, goals: 8500, assists: 0, image: getCricketHeadshot(56147), age: 37, height: '1.65m', weight: '62kg', career: ['Bangladesh'], trophies: ['BPL'], achievements: ['Most runs for Bangladesh', 'Test double-century'], primaryStatLabel: 'Runs', secondaryStatLabel: 'Dismissals' }
  ],
  f1: [
    { id: 4665, name: 'Max Verstappen', club: 'Red Bull Racing', position: 'Driver', rating: 99, goals: 62, assists: 112, image: getF1Headshot(4665), age: 27, height: '1.81m', weight: '72kg', career: ['Toro Rosso', 'Red Bull Racing'], trophies: ['4x World Champion'], achievements: ['Dominant era-defining pace, most wins in a season'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' },
    { id: 4528, name: 'Lewis Hamilton', club: 'Ferrari', position: 'Driver', rating: 98, goals: 105, assists: 201, image: getF1Headshot(4528), age: 40, height: '1.74m', weight: '73kg', career: ['McLaren', 'Mercedes', 'Ferrari'], trophies: ['7x World Champion'], achievements: ['Most F1 wins and poles in history'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' },
    { id: 5765, name: 'Charles Leclerc', club: 'Ferrari', position: 'Driver', rating: 94, goals: 8, assists: 40, image: getF1Headshot(5765), age: 27, height: '1.80m', weight: '69kg', career: ['Sauber', 'Ferrari'], trophies: ['Grand Prix Winner'], achievements: ['Elite one-lap qualifying speed'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' },
    { id: 5583, name: 'Lando Norris', club: 'McLaren', position: 'Driver', rating: 93, goals: 3, assists: 28, image: getF1Headshot(5583), age: 25, height: '1.70m', weight: '69kg', career: ['McLaren'], trophies: ['Grand Prix Winner'], achievements: ['McLaren resurgence leader'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' },
    { id: 5658, name: 'Carlos Sainz', club: 'Williams', position: 'Driver', rating: 92, goals: 4, assists: 25, image: getF1Headshot(5658), age: 30, height: '1.78m', weight: '66kg', career: ['Toro Rosso', 'Renault', 'McLaren', 'Ferrari', 'Williams'], trophies: ['Grand Prix Winner'], achievements: ['Consistent podium contender'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' },
    { id: 5576, name: 'Oscar Piastri', club: 'McLaren', position: 'Driver', rating: 91, goals: 2, assists: 12, image: getF1Headshot(5576), age: 23, height: '1.78m', weight: '69kg', career: ['Alpine (reserve)', 'McLaren'], trophies: ['Grand Prix Winner'], achievements: ['F2 and F3 champion, rising star'], primaryStatLabel: 'Wins', secondaryStatLabel: 'Podiums' }
  ]
};

// --- Authentication Components ---

const BRAND_NAME = 'Curly Sports';

const PublicHeader = ({ isAuthenticated = false, homeTheme = 'light', setHomeTheme, minimal = false }) => (
  <header className={`public-header public-header--curly${minimal ? ' public-header--minimal' : ''}`}>
    <div className="public-header-inner public-header-inner--ref">
      <Link to="/" className="public-logo-link public-logo-link--ref" aria-label="Curly Sports home">
        {minimal ? (
          <img src={`${process.env.PUBLIC_URL || ''}/curlysports-logo.png`} alt="" className="public-logo-img public-logo-img--minimal" />
        ) : (
          <img src="/curlysports-logo.png" alt="Curly Sports" className="public-logo-img" />
        )}
      </Link>
      {minimal ? (
        <>
          <Link to="/" className="public-header-home-link" aria-label="Home">Home</Link>
          {setHomeTheme && (
          <button
            type="button"
            className="public-theme-toggle-single"
            onClick={() => setHomeTheme(homeTheme === 'light' ? 'dark' : 'light')}
            aria-pressed={homeTheme === 'dark'}
            aria-label={homeTheme === 'light' ? 'Switch to night mode' : 'Switch to light mode'}
            title={homeTheme === 'light' ? 'Night mode' : 'Light mode'}
          >
            <span className="material-icons-round" aria-hidden="true">
              {homeTheme === 'light' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        )}
        </>
      ) : (
        <>
          <nav className="public-nav public-nav--ref">
            <Link to="/" className="public-nav-link">Home</Link>
            <a href="#features" className="public-nav-link">Marketplace</a>
          </nav>
          <div className="public-header-right">
            {setHomeTheme && (
              <button
                type="button"
                className="public-theme-toggle-single"
                onClick={() => setHomeTheme(homeTheme === 'light' ? 'dark' : 'light')}
                aria-pressed={homeTheme === 'dark'}
                aria-label={homeTheme === 'light' ? 'Switch to night mode' : 'Switch to light mode'}
                title={homeTheme === 'light' ? 'Night mode' : 'Light mode'}
              >
                <span className="material-icons-round" aria-hidden="true">
                  {homeTheme === 'light' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}
            <span className="public-nav-icon material-icons-round" aria-hidden="true">search</span>
            {isAuthenticated ? (
              <Link to="/dashboard" className="public-nav-cta public-nav-cta--signin">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="public-nav-cta public-nav-cta--signin">Login</Link>
                <span className="public-nav-icon material-icons-round" aria-hidden="true">menu</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  </header>
);

const HOME_AVATARS = {
  soccer: `${process.env.PUBLIC_URL || ''}/avatars/soccer.png`,
  cricket: `${process.env.PUBLIC_URL || ''}/avatars/cricket.png`,
  f1: `${process.env.PUBLIC_URL || ''}/avatars/f1.png`,
  'american-football': `${process.env.PUBLIC_URL || ''}/avatars/american-football.png`,
  tennis: `${process.env.PUBLIC_URL || ''}/avatars/tennis.png`,
  baseball: `${process.env.PUBLIC_URL || ''}/avatars/baseball.png`,
  rugby: `${process.env.PUBLIC_URL || ''}/avatars/rugby.png`,
  cycling: `${process.env.PUBLIC_URL || ''}/avatars/cycling.png`,
  golf: `${process.env.PUBLIC_URL || ''}/avatars/golf.png`,
  boxing: `${process.env.PUBLIC_URL || ''}/avatars/boxing.png`,
  mma: `${process.env.PUBLIC_URL || ''}/avatars/mma.png`,
  volleyball: `${process.env.PUBLIC_URL || ''}/avatars/volleyball.png`,
  basketball: `${process.env.PUBLIC_URL || ''}/avatars/basketball.png`,
  swimming: `${process.env.PUBLIC_URL || ''}/avatars/swimming.png`,
  badminton: `${process.env.PUBLIC_URL || ''}/avatars/badminton.png`,
};

const HomePage = ({ isAuthenticated = false, homeTheme = 'light', setHomeTheme }) => {
  const sportKeys = ['soccer', 'cricket', 'f1', 'basketball', 'tennis', 'american-football', 'baseball', 'rugby', 'volleyball', 'badminton', 'mma', 'boxing', 'golf', 'swimming', 'cycling'];
  const homeSportLabels = {
    soccer: 'Football',
    cricket: 'Cricket',
    f1: 'F1 Racing',
    'american-football': 'American Football',
    tennis: 'Tennis',
    baseball: 'Baseball',
    rugby: 'Rugby',
    cycling: 'Cycling',
    golf: 'Golf',
    boxing: 'Boxing',
    mma: 'MMA',
    volleyball: 'Volleyball',
    basketball: 'Basketball',
    swimming: 'Swimming',
    badminton: 'Badminton',
  };
  const sportDescriptions = {
    f1: 'Track races, standings & driver stats. Follow the season with live timing and results.',
    soccer: 'Scores, tables & fixtures for top leagues. Your hub for football stats and news.',
    cricket: 'Scores, rankings & series. Tests, ODIs, T20s and IPL at a glance.',
    'american-football': 'NFL scores, standings & stats. Follow your team through the season.',
    tennis: 'Tournaments, rankings & live scores. Grand Slams and ATP/WTA at a glance.',
    baseball: 'Scores, standings & stats. MLB and leagues at a glance.',
    rugby: 'Fixtures, standings & results. Union and league coverage in one place.',
    cycling: 'Races, classifications & rider stats. Grand Tours and classics coverage.',
    golf: 'Leaderboards, tournaments & player stats. Majors and PGA Tour updates.',
    boxing: 'Fight schedules, rankings & results. Follow the biggest bouts.',
    mma: 'Fight cards, rankings & results. UFC and major promotions coverage.',
    volleyball: 'Scores, standings & tournaments. Indoor and beach coverage.',
    basketball: 'NBA & leagues: scores, standings & stats. Follow the game.',
    swimming: 'Events, times & rankings. Pools and open water at a glance.',
    badminton: 'Rankings, tournaments & results. BWF and major events coverage.',
  };
  const comingSoonKeys = new Set(['tennis', 'american-football', 'baseball', 'rugby', 'volleyball', 'badminton', 'mma', 'boxing', 'golf', 'swimming', 'cycling']);
  const sportsForCards = sportKeys.map((key) => ({
    key,
    label: homeSportLabels[key] || SPORTS_CONFIG[key]?.label || key,
    description: sportDescriptions[key] || '',
    avatar: HOME_AVATARS[key] || null,
    gradient: key,
    comingSoon: comingSoonKeys.has(key),
  }));

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);
  const cardsGridRef = useRef(null);
  const cardsSectionRef = useRef(null);
  const [scrollDirection, setScrollDirection] = useState(null); // 'left' | 'right' | null
  const cardsHoveredRef = useRef(false);

  /* Infinite slow auto-scroll to the right; pause when mouse is over the cards section */
  useEffect(() => {
    const el = cardsGridRef.current;
    if (!el) return;
    const speed = 1;
    let rafId = null;
    const tick = () => {
      if (cardsHoveredRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      let next = el.scrollLeft + speed;
      /* Seamless loop: content is duplicated, so when we pass the first half reset to 0 */
      if (next >= el.scrollWidth / 2) next = 0;
      el.scrollLeft = next;
      rafId = requestAnimationFrame(tick);
    };
    /* Start after layout so scrollWidth/clientWidth are correct */
    const start = () => {
      rafId = requestAnimationFrame(tick);
    };
    const t = setTimeout(start, 300);
    return () => {
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const sources = [
      { path: 'soccer', code: 'eng.1', label: 'Football', count: 2 },
      { path: 'cricket', code: '8048', label: 'Cricket', count: 2 },
      { path: 'racing', code: 'f1', label: 'F1', count: 2 },
    ];
    let cancelled = false;
    Promise.allSettled(
      sources.map(({ path, code, label, count }) =>
        fetch(`${SPORTS_API_SITE_ROOT}/${path}/${code}/news?limit=${count}`)
          .then((r) => r.json())
          .then((data) => ({ articles: (data.articles || []).slice(0, count), label }))
      )
    ).then((results) => {
      if (cancelled) return;
      const combined = [];
      results.forEach((outcome) => {
        if (outcome.status !== 'fulfilled' || !outcome.value) return;
        const { articles, label } = outcome.value;
        (articles || []).forEach((a) => {
          combined.push({
            tag: fixTextEncoding(a.categories?.[0]?.description) || label,
            title: fixTextEncoding(a.headline) || '',
            excerpt: fixTextEncoding(a.description) || '',
            image: a.images?.[0]?.url || FALLBACK_NEWS_IMAGE,
            link: a.links?.web?.href,
            source: label,
          });
        });
      });
      const seen = new Set();
      const deduped = combined.filter((a) => {
        const id = (a.link || a.title || '').trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setHomeNews(deduped.slice(0, 6));
      setHomeNewsLoading(false);
    }).catch(() => {
      if (!cancelled) setHomeNewsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!scrollDirection || !cardsGridRef.current) return;
    const el = cardsGridRef.current;
    const firstCard = el.querySelector('.home-scard');
    const computed = el && window.getComputedStyle(el);
    const gap = computed ? parseInt(computed.gap || '20', 10) : 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 300;
    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (scrollDirection === 'right') {
        const next = Math.min(el.scrollLeft + step, maxScroll);
        el.scrollTo({ left: next, behavior: 'smooth' });
        if (next >= maxScroll) setScrollDirection(null);
      } else {
        const next = Math.max(el.scrollLeft - step, 0);
        el.scrollTo({ left: next, behavior: 'smooth' });
        if (next <= 0) setScrollDirection(null);
      }
    }, 550);
    return () => clearInterval(interval);
  }, [scrollDirection]);

  const scrollRightActive = scrollDirection === 'right';
  const scrollLeftActive = scrollDirection === 'left';

  return (
    <div className={`public-home public-home--curly ${homeTheme === 'dark' ? 'public-home--dark' : ''}`}>
      {/* Background waves – single continuous SVG, no tile seam */}
      <div className="home-waves-bg" aria-hidden="true">
        <div className="home-waves-bg-track">
          <svg className="home-waves-bg-svg" viewBox="0 0 2400 800" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="home-wave-deep" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="home-wave-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="home-wave-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="home-wave-foam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Two full periods so 0–1200 and 1200–2400 match; no visible cut */}
            <path fill="url(#home-wave-deep)" className="home-wave-layer home-wave-layer--1" d="M0,400 Q300,350 600,400 T1200,400 T1800,400 T2400,400 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-deep)" className="home-wave-layer home-wave-layer--1b" d="M0,450 Q300,500 600,450 T1200,450 T1800,450 T2400,450 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-mid)" className="home-wave-layer home-wave-layer--2" d="M0,500 Q200,440 400,500 T800,500 T1200,500 T1600,500 T2000,500 T2400,500 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-mid)" className="home-wave-layer home-wave-layer--2b" d="M0,550 Q200,610 400,550 T800,550 T1200,550 T1600,550 T2000,550 T2400,550 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-light)" className="home-wave-layer home-wave-layer--3" d="M0,600 Q150,550 300,600 T600,600 T900,600 T1200,600 T1500,600 T1800,600 T2100,600 T2400,600 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-light)" className="home-wave-layer home-wave-layer--3b" d="M0,650 Q150,700 300,650 T600,650 T900,650 T1200,650 T1500,650 T1800,650 T2100,650 T2400,650 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-foam)" className="home-wave-layer home-wave-layer--4" d="M0,350 Q400,280 800,350 T1200,350 T2000,350 T2400,350 L2400,800 L0,800 Z" />
          </svg>
        </div>
      </div>

      <PublicHeader isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />
      <main>
        {/* Hero */}
        <section className="home-hero home-hero--curly">
          <div className="home-hero-content">
            <h1 className="home-hero-title--split">
              <span className="home-hero-title-curly">Curly</span>
              <span className="home-hero-title-sports">Sports</span>
            </h1>
            <p className="home-hero-tagline">real-time analytics tailored just for you.</p>
          </div>
        </section>

        {/* Sport cards – flip on hover */}
        <section
          className="home-sports-section"
          ref={cardsSectionRef}
          onMouseEnter={() => { cardsHoveredRef.current = true; }}
          onMouseLeave={() => { cardsHoveredRef.current = false; }}
        >
          <div className="home-sports-grid-wrap">
            {scrollRightActive && (
              <div className="home-sports-scroll-zone-hint home-sports-scroll-zone-hint--right" aria-hidden="true">
                <span className="home-sports-scroll-zone-arrow">→</span>
              </div>
            )}
            {scrollLeftActive && (
              <div className="home-sports-scroll-zone-hint home-sports-scroll-zone-hint--left" aria-hidden="true">
                <span className="home-sports-scroll-zone-arrow">←</span>
              </div>
            )}
            <div className="home-sports-grid--ref" ref={cardsGridRef}>
            {[...sportsForCards, ...sportsForCards].map((sport, i) => (
              <Link to="/signup" key={`${sport.key}-${i}`} className={`home-scard home-scard--ref home-scard--${sport.gradient}${sport.comingSoon ? ' home-scard--coming-soon' : ''}`}>
                <div className="home-scard-flip">
                  <div className="home-scard-face home-scard-front">
                    {sport.avatar && (
                      <div className="home-scard-figure-wrap">
                        <img src={sport.avatar} alt="" className="home-scard-figure" loading="lazy" />
                      </div>
                    )}
                    <span className="home-scard-label home-scard-label--pill">{sport.label}</span>
                    {sport.comingSoon && <span className="home-scard-coming-soon">Coming soon</span>}
                  </div>
                  <div className="home-scard-face home-scard-back">
                    <div className="home-scard-back-bg" aria-hidden="true" />
                    <p className="home-scard-back-desc">{sport.description}</p>
                    {sport.comingSoon ? (
                      <span className="home-scard-label home-scard-label--pill home-scard-coming-soon-pill">Coming soon</span>
                    ) : (
                      <span className="home-scard-label home-scard-label--pill">Learn more</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            </div>
          </div>
        </section>

        <section className="home-section home-section--features" id="features">
          <h2>Platform Features</h2>
          <div className="home-feature-grid home-feature-grid--curly">
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">dashboard</span>
              <h3>Personalized Sports Dashboard</h3>
              <p>Configure your feed around your sports, teams, and players with adaptive insights.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">analytics</span>
              <h3>Real-Time Match Analytics</h3>
              <p>Track live matches, momentum shifts, and key moments as they happen.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">bar_chart</span>
              <h3>Player Performance Insights</h3>
              <p>Compare player metrics, form trends, and role impact across competitions.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">new_releases</span>
              <h3>Transfer & News Intelligence</h3>
              <p>Get curated transfer updates, reports, and context in one unified stream.</p>
            </article>
          </div>
        </section>

        <section className="home-section home-founder">
          <h2>Meet the Founder</h2>
          <div className="home-founder-wrap">
            <div>
              <p>
                Mazin, Founder of Curly Sports, is a competitive football captain and tournament MVP, recognized with a Golden Boot.
                As a team leader, he understands the value of data and performance analytics. Curly Sports was built from firsthand
                experience - combining football passion with modern sports intelligence.
              </p>
              <div className="home-founder-tags">
                <span>Football captain</span><span>Golden Boot</span><span>Tournament MVP</span><span>Analytics passion</span><span>Founder-led vision</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-section--compare">
          <h2>Why Curly Sports</h2>
          <div className="home-table-wrap">
            <table className="home-compare-table">
              <thead><tr><th>Category</th><th>Other Apps</th><th>Curly Sports</th></tr></thead>
              <tbody>
                <tr><td>Personalization</td><td>Generic feeds</td><td>Survey-driven and role-based</td></tr>
                <tr><td>Analytics depth</td><td>Basic stats only</td><td>Performance, context, and trends</td></tr>
                <tr><td>Coverage</td><td>Single-purpose experience</td><td>Dashboard, analytics, news, and insights</td></tr>
                <tr><td>Product direction</td><td>Slow roadmap cycles</td><td>Founder-led and athlete-focused iteration</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="home-section home-section--preview">
          <h2>Platform Preview</h2>
          <div className="home-preview-grid">
            <div className="home-preview-placeholder">Dashboard & personalization</div>
            <div className="home-preview-placeholder">Live scores & analytics</div>
          </div>
        </section>

        <section className="home-section home-proof">
          <h2>Built with Authority</h2>
          <div className="home-proof-grid">
            <p>Built for competitive athletes</p>
            <p>Founder-led innovation</p>
            <p>Designed for performance decisions</p>
          </div>
        </section>

        <section className="home-section home-news-section" id="sports-news">
          <h2>Sports News</h2>
          <p className="home-news-intro">Two football, two cricket and two F1 headlines — powered by ESPN.</p>
          {homeNewsLoading ? (
            <div className="home-news-loading">
              <div className="loader" aria-hidden="true" />
              <span>Loading headlines…</span>
            </div>
          ) : homeNews.length > 0 ? (
            <div className="home-news-grid">
              {homeNews.map((article, idx) => (
                <a
                  key={idx}
                  className="home-news-card"
                  href={article.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="home-news-card-image-wrap">
                    <img src={article.image} alt="" className="home-news-card-image" loading="lazy" />
                    <span className="home-news-card-tag">{article.tag}</span>
                  </div>
                  <div className="home-news-card-body">
                    <h3 className="home-news-card-title">{article.title}</h3>
                    {article.excerpt && <p className="home-news-card-excerpt">{article.excerpt.slice(0, 120)}{article.excerpt.length > 120 ? '…' : ''}</p>}
                    <span className="home-news-card-source">{article.source}</span>
                    <span className="home-news-card-link">Read more →</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="home-news-empty">No headlines available right now. Check back soon.</p>
          )}
        </section>

        <section className="home-section home-final-cta">
          <h2>Join the Next Generation of Sports Intelligence</h2>
          <Link to="/signup" className="public-btn-primary">Create Your Account</Link>
        </section>
      </main>
      <footer className="public-footer public-footer--curly">
        <div className="public-footer-tagline">Real-time analytics tailored just for you.</div>
        <div className="public-footer-links">
          <a href="#features">About</a><a href="mailto:hello@curlysports.com">Contact</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a>
        </div>
        <div className="public-footer-socials">
          <a href="https://instagram.com/CurlySportsOfficial" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://x.com/CurlySportsOfficial" target="_blank" rel="noreferrer">X</a>
          <a href="https://youtube.com/@CurlySportsOfficial" target="_blank" rel="noreferrer">YouTube</a>
          <a href="https://linkedin.com/company/curlysports" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <p>Copyright © Curly Sports.</p>
      </footer>
    </div>
  );
};

const LoginPage = ({ mode = 'login', isAuthenticated = false, homeTheme = 'light', setHomeTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(mode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsRegistering(mode === 'signup');
    setError('');
  }, [mode]);

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Allow popups for this site or try Email sign-in below.");
      } else {
        setError(err.message || 'Sign-in failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegistering && !termsAccepted) {
      setError('Please agree to the Terms & Conditions to create an account.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const { updateProfile } = await import('firebase/auth');
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const name = (displayName || '').trim() || email.split('@')[0];
        if (name) updateProfile(user, { displayName: name }).catch(() => { });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setError("No account with this email. Click \"Join now\" below to create one.");
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError("Wrong password. Try again or reset it in Firebase Console.");
      } else if (code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (code === 'auth/too-many-requests') {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else if (code === 'auth/email-already-in-use' && !isRegistering) {
        setError("This email is already registered. Sign in above (don't use Join now).");
      } else {
        setError(err.message || "Sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`public-auth-shell public-auth-shell--curly ${homeTheme === 'dark' ? 'public-home--dark' : ''}`}>
      {/* Same background as homepage: waves + gradient */}
      <div className="home-waves-bg" aria-hidden="true">
        <div className="home-waves-bg-track">
          <svg className="home-waves-bg-svg" viewBox="0 0 2400 800" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="login-page-wave-deep" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="login-page-wave-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="login-page-wave-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="login-page-wave-foam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path fill="url(#login-page-wave-deep)" className="home-wave-layer home-wave-layer--1" d="M0,400 Q300,350 600,400 T1200,400 T1800,400 T2400,400 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-deep)" className="home-wave-layer home-wave-layer--1b" d="M0,450 Q300,500 600,450 T1200,450 T1800,450 T2400,450 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-mid)" className="home-wave-layer home-wave-layer--2" d="M0,500 Q200,440 400,500 T800,500 T1200,500 T1600,500 T2000,500 T2400,500 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-mid)" className="home-wave-layer home-wave-layer--2b" d="M0,550 Q200,610 400,550 T800,550 T1200,550 T1600,550 T2000,550 T2400,550 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-light)" className="home-wave-layer home-wave-layer--3" d="M0,600 Q150,550 300,600 T600,600 T900,600 T1200,600 T1500,600 T1800,600 T2100,600 T2400,600 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-light)" className="home-wave-layer home-wave-layer--3b" d="M0,650 Q150,700 300,650 T600,650 T900,650 T1200,650 T1500,650 T1800,650 T2100,650 T2400,650 L2400,800 L0,800 Z" />
            <path fill="url(#login-page-wave-foam)" className="home-wave-layer home-wave-layer--4" d="M0,350 Q400,280 800,350 T1200,350 T2000,350 T2400,350 L2400,800 L0,800 Z" />
          </svg>
        </div>
      </div>

      <PublicHeader isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} minimal />
      <div className="login-page login-page--curly" role="main" aria-label={isRegistering ? 'Create account' : 'Sign in'}>
        <div className="login-layout login-layout--curly">
          <div className="login-card-curly-wrap">
            <img src={`${process.env.PUBLIC_URL || ''}/login-avatar.png`} alt="" className="login-avatar-peek" aria-hidden="true" />
            <div className="login-card-curly">
              <h1 className="login-card-title login-card-title--split">
                <span className="login-card-title-curly">Curly</span>
                <span className="login-card-title-sports">Sports</span>
              </h1>
              <header className="login-form-header">
                <h2 className="login-form-title">{isRegistering ? 'Create an account' : 'Welcome Back!'}</h2>
              </header>

              {loading ? (
                <div className="login-loading" aria-live="polite" aria-busy="true">
                  <div className="loader" aria-hidden="true" />
                  <p>Authenticating...</p>
                </div>
              ) : (
                <div className="login-body">
                  {error && (
                    <div className="auth-error-msg" role="alert" aria-live="assertive">
                      <span className="material-icons-round" aria-hidden="true">error_outline</span>
                      {error}
                    </div>
                  )}

                  <div className="social-auth-grid">
                    <button type="button" className="google-auth-btn google-auth-btn--curly" onClick={() => handleSocialLogin(googleProvider)}>
                      <span className="social-icon-box">
                        <img loading="lazy" decoding="async" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
                      </span>
                      {isRegistering ? 'Sign up with Google' : 'Continue with Google'}
                    </button>
                  </div>

                  <div className="auth-divider">
                    <span>{isRegistering ? 'Or sign up with email' : 'Or continue with email'}</span>
                  </div>

                  <form onSubmit={handleEmailAuth} className="email-auth-form">
                    {isRegistering && (
                      <div className="login-field-wrap">
                        <label className="login-field-label" htmlFor="login-display-name">Display name</label>
                        <div className="input-group-pro input-group-pro--curly">
                          <span className="material-icons-round" aria-hidden="true">person</span>
                          <input
                            id="login-display-name"
                            type="text"
                            placeholder="Display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                            aria-label="Display name"
                          />
                        </div>
                      </div>
                    )}
                    <div className="login-field-wrap">
                      <label className="login-field-label" htmlFor="login-email">Email</label>
                      <div className="input-group-pro input-group-pro--curly">
                        <span className="material-icons-round" aria-hidden="true">email</span>
                        <input
                          id="login-email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          aria-label="Email"
                        />
                      </div>
                    </div>
                    <div className="login-field-wrap">
                      <label className="login-field-label" htmlFor="login-password">Password</label>
                      <div className="input-group-pro input-group-pro--curly">
                        <span className="material-icons-round" aria-hidden="true">lock</span>
                        <input
                          id="login-password"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={isRegistering ? 'new-password' : 'current-password'}
                          aria-label="Password"
                        />
                      </div>
                    </div>
                    {isRegistering && (
                      <label className="login-terms">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          aria-label="I agree to the Terms & Conditions"
                        />
                        <span>I agree to the Terms & Conditions</span>
                      </label>
                    )}
                    <button type="submit" className="login-main-btn login-main-btn--curly" disabled={isRegistering && !termsAccepted}>
                      {isRegistering ? 'Create account' : 'Sign in'}
                    </button>
                    <p className="login-form-switch">
                      {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}
                      {' '}
                      <Link to={isRegistering ? '/login' : '/signup'} className="login-form-switch-btn" onClick={() => setError('')}>
                        {isRegistering ? 'Sign in' : 'Sign up'}
                      </Link>
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Team Management ---

// --- Sub-components ---

const SportDropdown = ({ selectedSport, setSelectedSport, enabledSportKeys, setTab, className = '', collapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current || !isOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const padding = 12;
    const maxPanelHeight = 400;
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const openDown = spaceBelow >= 120;
    const maxHeight = Math.min(
      maxPanelHeight,
      openDown ? spaceBelow : spaceAbove
    );
    setPanelStyle({
      position: 'fixed',
      top: openDown ? rect.bottom + 4 : undefined,
      bottom: openDown ? undefined : window.innerHeight - rect.top + 4,
      left: collapsed ? 72 : rect.left,
      minWidth: collapsed ? 200 : rect.width,
      maxWidth: Math.max(collapsed ? 200 : rect.width, 200),
      maxHeight: Math.max(120, maxHeight),
    });
  }, [isOpen, collapsed]);

  useEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen, updatePanelPosition]);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) updatePanelPosition();
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('.sport-dropdown-panel')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (sportKey) => {
    setSelectedSport(sportKey);
    if (setTab) setTab('live');
    setIsOpen(false);
  };

  const current = getSportConfig(selectedSport);

  const sportOptions = Array.isArray(enabledSportKeys) ? enabledSportKeys : [];

  const panelContent = isOpen && (
    <div
      className={`sport-dropdown-panel sport-dropdown-panel-overlay ${className}`.trim()}
      role="listbox"
      style={{
        position: 'fixed',
        left: (panelStyle.left != null ? panelStyle.left : 20),
        top: (panelStyle.top != null ? panelStyle.top : 120),
        bottom: panelStyle.bottom,
        minWidth: panelStyle.minWidth != null ? panelStyle.minWidth : 200,
        maxWidth: panelStyle.maxWidth,
        maxHeight: panelStyle.maxHeight != null ? panelStyle.maxHeight : 400,
      }}
    >
      {sportOptions.map((sportKey) => {
        const cfg = getSportConfig(sportKey);
        return (
        <button
          key={sportKey}
          type="button"
          role="option"
          aria-selected={selectedSport === sportKey}
          className={`sport-dropdown-option ${selectedSport === sportKey ? 'active' : ''}`}
          onClick={() => handleSelect(sportKey)}
        >
          <span className="material-icons-round">{cfg.icon}</span>
          <span>{cfg.label}</span>
        </button>
        );
      })}
    </div>
  );

  return (
    <div className={`sport-dropdown ${className}`.trim()} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="sport-dropdown-trigger"
        onMouseDown={(e) => { e.stopPropagation(); setIsOpen((o) => !o); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Sport: ${current.label}. Click to change.`}
      >
        <span className="material-icons-round">{current.icon}</span>
        <span className="sport-dropdown-trigger-label">{current.label}</span>
        <span className="material-icons-round sport-dropdown-chevron">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>
      {panelContent && ReactDOM.createPortal(panelContent, document.body)}
    </div>
  );
};

const ProfileMenu = ({ user, onClose, onLogout, colorScheme, setColorScheme, themeMode, setThemeMode }) => {
  const [personalizeOpen, setPersonalizeOpen] = useState(true);
  return (
    <div className="profile-menu-overlay" onClick={onClose} role="dialog" aria-label="Profile menu">
      <div className="profile-menu-panel" onClick={e => e.stopPropagation()}>
        <div className="profile-menu-header">
          <h3 className="profile-menu-title">Profile</h3>
          <button type="button" className="profile-menu-close" onClick={onClose} aria-label="Close">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className="profile-menu-user">
          <div className="avatar">
            {user?.avatar && user.avatar.length > 2 ? (
              <img loading="lazy" decoding="async" src={user.avatar} alt="" className="avatar-img" />
            ) : (
              user?.avatar || 'M'
            )}
          </div>
          <div className="profile-menu-user-info">
            <span className="name">{user?.name || 'Member'}</span>
            <span className="status">Online</span>
            {user?.role && (
              <span className="user-role-badge">{user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Member'}</span>
            )}
            {typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
              <span className="profile-menu-streak" title="Login streak">
                <span className="material-icons-round streak-icon">local_fire_department</span>
                {user.currentStreak} day{user.currentStreak !== 1 ? 's' : ''} streak
                {typeof user?.longestStreak === 'number' && user.longestStreak > 0 && user.longestStreak !== user.currentStreak && (
                  <span className="profile-menu-streak-longest"> · Best: {user.longestStreak}d</span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="profile-menu-section">
          <button type="button" className="profile-menu-section-head" onClick={() => setPersonalizeOpen(!personalizeOpen)} aria-expanded={personalizeOpen}>
            <span className="material-icons-round">palette</span>
            Personalize
            <span className="material-icons-round profile-menu-chevron">{personalizeOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
          {personalizeOpen && (
            <div className="profile-menu-personalize">
              <div className="personalize-row">
                <span className="personalize-label">Appearance</span>
                <div className="personalize-toggle-wrap">
                  <button type="button" className={`personalize-toggle-option ${colorScheme === 'light' ? 'active' : ''}`} onClick={() => setColorScheme('light')}>
                    <span className="material-icons-round">light_mode</span>
                    Light
                  </button>
                  <button type="button" className={`personalize-toggle-option ${colorScheme === 'dark' ? 'active' : ''}`} onClick={() => setColorScheme('dark')}>
                    <span className="material-icons-round">dark_mode</span>
                    Dark
                  </button>
                </div>
              </div>
              <div className="personalize-row">
                <span className="personalize-label">Interface theme</span>
                <div className="theme-mode-grid">
                  <button type="button" className={`theme-mode-card ${themeMode === 'default' ? 'active' : ''}`} onClick={() => setThemeMode('default')}>
                    <span className="material-icons-round theme-mode-icon">palette</span>
                    <span className="theme-mode-name">Default</span>
                    <span className="theme-mode-desc">Neutral dark & light</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'sunshine' ? 'active' : ''}`} onClick={() => setThemeMode('sunshine')}>
                    <span className="material-icons-round theme-mode-icon">wb_sunny</span>
                    <span className="theme-mode-name">Sunshine</span>
                    <span className="theme-mode-desc">Warm & bright</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'sea' ? 'active' : ''}`} onClick={() => setThemeMode('sea')}>
                    <span className="material-icons-round theme-mode-icon">waves</span>
                    <span className="theme-mode-name">Sea</span>
                    <span className="theme-mode-desc">Ocean teal & cyan</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'fire' ? 'active' : ''}`} onClick={() => setThemeMode('fire')}>
                    <span className="material-icons-round theme-mode-icon">local_fire_department</span>
                    <span className="theme-mode-name">Fire</span>
                    <span className="theme-mode-desc">Bold red & orange</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'forest' ? 'active' : ''}`} onClick={() => setThemeMode('forest')}>
                    <span className="material-icons-round theme-mode-icon">park</span>
                    <span className="theme-mode-name">Forest</span>
                    <span className="theme-mode-desc">Deep green & nature</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'ice' ? 'active' : ''}`} onClick={() => setThemeMode('ice')}>
                    <span className="material-icons-round theme-mode-icon">ac_unit</span>
                    <span className="theme-mode-name">Ice</span>
                    <span className="theme-mode-desc">Cool blue & frost</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'flower' ? 'active' : ''}`} onClick={() => setThemeMode('flower')}>
                    <span className="material-icons-round theme-mode-icon">local_florist</span>
                    <span className="theme-mode-name">Flower</span>
                    <span className="theme-mode-desc">Pink & lavender</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'star' ? 'active' : ''}`} onClick={() => setThemeMode('star')}>
                    <span className="material-icons-round theme-mode-icon">star</span>
                    <span className="theme-mode-name">Star</span>
                    <span className="theme-mode-desc">Purple & gold</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-menu-footer">
          <button type="button" className="profile-menu-logout" onClick={() => { onClose(); onLogout(); }}>
            <span className="material-icons-round">logout</span>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({
  currentTab,
  setTab,
  user,
  onLogout,
  onOpenProfileMenu,
  selectedSport,
  setSelectedSport,
  enabledSportKeys,
  leagueNames,
  leagueLogos,
  leagueShortNames = {},
  leagues = {},
  featureFlags = {},
  collapsed = false,
  onToggleCollapsed,
}) => {
  const leagueLogoUrl = (key) => {
    if (selectedSport === 'cricket' && leagues[key])
      return leagueLogos[key] || `https://a.espncdn.com/i/leaguelogos/cricket/500/${leagues[key]}.png`;
    return leagueLogos[key] || FALLBACK_LEAGUE_LOGO;
  };
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar-sports-row">
        <div className="sidebar-top-row">
          <div className="logo-container-pro" onClick={() => setTab('dashboard')} title="Go to Dashboard" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTab('dashboard'); } }} aria-label="Go to Dashboard">
            <img
              src={`${process.env.PUBLIC_URL || ''}/curlysports-logo.png`}
              alt="Curly Sports"
              className="sidebar-logo-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_LEAGUE_LOGO;
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={(e) => { e.stopPropagation(); onToggleCollapsed?.(); }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-icons-round">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
        </button>
        <button type="button" className={`sidebar-dashboard-btn ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} aria-label="Dashboard" title="Dashboard">
          <span className="material-icons-round">dashboard</span>
          <span className="sidebar-btn-label">Dashboard</span>
        </button>
        <div className="sport-tabs-group">
          <SportDropdown selectedSport={selectedSport} setSelectedSport={setSelectedSport} enabledSportKeys={enabledSportKeys} setTab={setTab} className="sport-dropdown-sidebar" collapsed={collapsed} />
        </div>
      </div>

      <div className="sidebar-leagues-row">
        <nav className="nav-menu">
          {featureFlags.live_scores !== false && (
            <button className={`nav-item ${currentTab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')} title="Live Scores">
              <span className="material-icons-round">timer</span>
              <span className="nav-item-text">Live Scores</span>
            </button>
          )}
          {featureFlags.live_scores !== false && Object.keys(leagueNames).map(key => (
            <button key={key} className={`nav-item nav-item-league ${currentTab === key ? 'active' : ''}`} onClick={() => setTab(key)} title={leagueNames[key]}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <img loading="lazy" decoding="async" src={leagueLogoUrl(key)} className="nav-icon league-logo-img" alt="" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_LEAGUE_LOGO; }} />
              </span>
              <span className="nav-item-text">{leagueShortNames[key] || leagueNames[key]}</span>
            </button>
          ))}
          {featureFlags.favorites !== false && (
            <button className={`nav-item ${currentTab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')} title="My Favorites">
              <span className="material-icons-round">favorite</span>
              <span className="nav-item-text">My Favorites</span>
            </button>
          )}
          <button className={`nav-item ${currentTab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')} title={selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}>
            <span className="material-icons-round">{selectedSport === 'f1' ? 'emoji_events' : 'person'}</span>
            <span className="nav-item-text">{selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}</span>
          </button>
          <button className={`nav-item ${currentTab === 'tactics' ? 'active' : ''}`} onClick={() => setTab('tactics')} title="Teams">
            <span className="material-icons-round">groups</span>
            <span className="nav-item-text">Teams</span>
          </button>
          {featureFlags.news !== false && (
            <button className={`nav-item ${currentTab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')} title="News & Updates">
              <span className="material-icons-round">article</span>
              <span className="nav-item-text">News & Updates</span>
            </button>
          )}
          {selectedSport === 'soccer' && (
            <button className={`nav-item ${currentTab === 'game' ? 'active' : ''}`} onClick={() => setTab('game')} title="Penalty King">
              <span className="material-icons-round">sports_esports</span>
              <span className="nav-item-text">Penalty King</span>
            </button>
          )}
          {selectedSport === 'soccer' && (
            <button className={`nav-item ${currentTab === 'soccer_no_reason' ? 'active' : ''}`} onClick={() => setTab('soccer_no_reason')} title="For no reason">
              <span className="material-icons-round">mood</span>
              <span className="nav-item-text">For No Reason</span>
            </button>
          )}
          {selectedSport === 'cricket' && (
            <button className={`nav-item ${currentTab === 'game' ? 'active' : ''}`} onClick={() => setTab('game')} title="Super Over">
              <span className="material-icons-round">sports_cricket</span>
              <span className="nav-item-text">Super Over</span>
            </button>
          )}
          <button className={`nav-item ${currentTab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')} title="Tickets">
            <span className="material-icons-round">event</span>
            <span className="nav-item-text">Tickets</span>
          </button>
        </nav>
        <div className="user-profile" onClick={onOpenProfileMenu} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenProfileMenu(); } }} aria-label="Open profile menu" title={user?.name || 'Profile'}>
          <div className="avatar">
            {user?.avatar && user.avatar.length > 2 ? (
              <img
                loading="lazy"
                decoding="async"
                src={user.avatar}
                alt=""
                className="avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  const letter = (user?.name || user?.email || 'M').charAt(0).toUpperCase();
                  e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%230ea5e9"/><text x="22" y="28" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif" font-weight="bold">' + letter + '</text></svg>')}`;
                }}
              />
            ) : (
              (user?.avatar || (user?.name || user?.email || 'M').charAt(0).toUpperCase())
            )}
          </div>
          <div className="user-info">
            <span className="name">{user?.name || 'Member'}</span>
            <span className="status">Online</span>
            {user?.role && (
              <span className="user-role-badge" title="Your role">
                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            )}
            {featureFlags.streaks !== false && typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
              <span className="user-streak" title="Login streak">
                <span className="material-icons-round streak-icon">local_fire_department</span>
                {user.currentStreak} day{user.currentStreak !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button type="button" className="logout-btn-pro" onClick={e => { e.stopPropagation(); onLogout(); }} title="Logout" aria-label="Logout">
            <span className="material-icons-round">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

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

const Pagination = ({ current, total, onPageChange }) => {
  if (total <= 1) return null;

  const getPages = () => {
    const pages = [];
    const showMax = 5;

    if (total <= showMax + 2) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <div className="pagination-pro">
      <button
        className="pager-nav-btn"
        disabled={current === 1}
        onClick={() => { onPageChange(current - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <span className="material-icons-round">chevron_left</span>
      </button>

      <div className="pager-list">
        {getPages().map((p, idx) => (
          p === '...' ? (
            <span key={`sep-${idx}`} className="pager-separator">...</span>
          ) : (
            <button
              key={p}
              className={`pager-item ${current === p ? 'active' : ''}`}
              onClick={() => { onPageChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {p}
            </button>
          )
        ))}
      </div>

      <button
        className="pager-nav-btn"
        disabled={current === total}
        onClick={() => { onPageChange(current + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <span className="material-icons-round">chevron_right</span>
      </button>
    </div>
  );
};

// --- Main App ---

function App() {
  const location = useLocation();
  const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const isHomeRoute = normalizedPath === '/';
  const isLoginRoute = normalizedPath === '/login';
  const isSignupRoute = normalizedPath === '/signup';
  const isDashboardRoute = normalizedPath === '/dashboard';
  const getLocalISODate = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };
  const getYesterdayISODate = () => getLocalISODate(new Date(Date.now() - 864e5));

  const [selectedSport, setSelectedSport] = useState('soccer');
  const [currentTab, setTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState('');
  const [appConfig, setAppConfig] = useState({
    featureFlags: [],
    saAdmins: [],
    permissions: [],
    maintenance: false,
    health: {},
    auditLog: [],
    enabledSports: {},
  });
  const featureFlags = useMemo(() => featureFlagsFromConfig(appConfig.featureFlags), [appConfig.featureFlags]);

  /** Sport keys that are enabled (not turned off in config). Includes any key set to true in config so Super Admin–added sports show up. */
  const enabledSportKeys = useMemo(() => {
    const m = appConfig.enabledSports && typeof appConfig.enabledSports === 'object' ? appConfig.enabledSports : {};
    const fromTabs = SPORTS_TABS.filter((s) => m[s] !== false);
    const fromConfigTrue = Object.keys(m).filter((k) => m[k] === true && !SPORTS_TABS.includes(k));
    return [...new Set([...fromTabs, ...fromConfigTrue])];
  }, [appConfig.enabledSports]);

  const THEME_STORAGE_KEY = 'mazin_theme';
  const [colorScheme, setColorScheme] = useState(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.colorScheme === 'light' || p.colorScheme === 'dark') return p.colorScheme;
      }
    } catch (_) { }
    return 'dark';
  });
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        const valid = ['default', 'sunshine', 'sea', 'fire', 'forest', 'ice', 'flower', 'star'];
        if (valid.includes(p.themeMode)) return p.themeMode;
      }
    } catch (_) { }
    return 'default';
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const SIDEBAR_COLLAPSED_KEY = 'curly_sidebar_collapsed';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? 'true' : 'false');
    } catch (_) {}
  }, [sidebarCollapsed]);

  const HOME_THEME_KEY = 'curly_home_theme';
  const [homeTheme, setHomeTheme] = useState(() => {
    try {
      const t = localStorage.getItem(HOME_THEME_KEY);
      if (t === 'light' || t === 'dark') return t;
      // First visit / no preference: always default to light for the home page
    } catch (_) { }
    return 'light';
  });
  useEffect(() => {
    try { localStorage.setItem(HOME_THEME_KEY, homeTheme); } catch (_) { }
  }, [homeTheme]);

  useEffect(() => {
    if (isHomeRoute) document.title = 'Curly Sports | Sports Intelligence Platform';
    else if (isLoginRoute) document.title = 'Login | Curly Sports';
    else if (isSignupRoute) document.title = 'Signup | Curly Sports';
    else document.title = 'Dashboard | Curly Sports';
  }, [isDashboardRoute, isHomeRoute, isLoginRoute, isSignupRoute]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-scheme', colorScheme);
    root.setAttribute('data-theme', themeMode);
  }, [colorScheme, themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ colorScheme, themeMode }));
    } catch (_) { }
  }, [colorScheme, themeMode]);

  // Real-time app config (feature flags, admins, maintenance, enabled sports) from Firestore.
  // Fetch once from server on load so enabled sports / flags are correct (avoids stale cache).
  useEffect(() => {
    let cancelled = false;
    getAppConfigFromServer()
      .then((config) => {
        if (!cancelled) setAppConfig(config);
      })
      .catch((err) => console.warn('Initial app config fetch:', err?.message));
    const unsub = subscribeAppConfig(setAppConfig);
    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Ensure Super Admin's Firestore user doc has role: 'super_admin' so security rules allow config writes
  useEffect(() => {
    if (!user?.uid || !user?.email) return;
    const saRole = getSaRoleForEmail(user.email, appConfig.saAdmins);
    const isSuperAdmin = user.role === 'super_admin' || isSuperAdminEmail(user.email) || saRole === 'super_admin';
    if (!isSuperAdmin) return;
    setUserData(user.uid, {
      role: 'super_admin',
      displayName: user.name || user.email?.split('@')[0] || '',
      email: user.email || ''
    }).catch((e) => console.warn('Sync super_admin role:', e?.message));
  }, [user?.uid, user?.email, user?.name, user?.role, appConfig.saAdmins]);

  // One-time seed of super_admin_emails in config so rules allow access (for any effective super admin, not only when user doc has role)
  const seededSuperAdminEmailsRef = useRef(false);
  useEffect(() => {
    if (seededSuperAdminEmailsRef.current || !user?.email) return;
    const saRole = getSaRoleForEmail(user.email, appConfig.saAdmins);
    const isEffectiveSa = isSuperAdminEmail(user.email) || saRole === 'super_admin';
    if (!isEffectiveSa) return;
    const saAdmins = appConfig.saAdmins || [];
    const map = buildSuperAdminEmailsMap(saAdmins, user.email);
    if (Object.keys(map).length === 0) return;
    seededSuperAdminEmailsRef.current = true;
    updateAppConfig({ super_admin_emails: map }).catch((e) => {
      seededSuperAdminEmailsRef.current = false;
      console.warn('Seed super_admin_emails:', e?.message);
    });
  }, [user?.email, appConfig.saAdmins]);

  // Firebase Auth + real-time user data from Firestore
  useEffect(() => {
    const STREAK_CACHE_KEY = (uid) => `streak_${uid}`;
    const getCachedStreak = (uid) => {
      try {
        const raw = sessionStorage.getItem(STREAK_CACHE_KEY(uid));
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (typeof p.currentStreak === 'number' && typeof p.longestStreak === 'number') {
          return { currentStreak: p.currentStreak, longestStreak: p.longestStreak };
        }
      } catch (_) { }
      return null;
    };
    const setCachedStreak = (uid, currentStreak, longestStreak) => {
      try {
        sessionStorage.setItem(STREAK_CACHE_KEY(uid), JSON.stringify({ currentStreak, longestStreak }));
      } catch (_) { }
    };

    let unsubUser = () => { };
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthReady(true);
      if (firebaseUser) {
        const isBootstrapEmail = isSuperAdminEmail(firebaseUser.email);
        const cached = getCachedStreak(firebaseUser.uid);
        const initialStreak = cached ? { currentStreak: cached.currentStreak, longestStreak: cached.longestStreak } : { currentStreak: 1, longestStreak: 1 };
        const isBootstrapAdmin = isAdminEmail(firebaseUser.email);
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || firebaseUser.email?.charAt(0).toUpperCase(),
          uid: firebaseUser.uid,
          role: isBootstrapEmail ? 'super_admin' : isBootstrapAdmin ? 'admin' : undefined,
          ...initialStreak
        });
        setIsAuthenticated(true);

        // Immediately write core profile data (email, displayName, photoURL) so all users — including
        // Google sign-in users — always appear in admin User Management, even on first login.
        const isGoogleUser = firebaseUser.providerData?.some?.((p) => p.providerId === 'google.com');
        const profilePayload = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
          ...(isGoogleUser ? { provider: 'google' } : {}),
        };
        setUserData(firebaseUser.uid, profilePayload).catch(() => { });

        if (isBootstrapEmail) {
          setUserData(firebaseUser.uid, { role: 'super_admin', ...profilePayload }).catch(() => { });
          addLoginLog(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || firebaseUser.email?.split('@')[0], 'super_admin').catch(() => { });
        }

        let hasRunLoginLogic = false;
        unsubUser = subscribeUserData(firebaseUser.uid, (data) => {
          setUserDataLoaded(true);
          if (data) {
            setUserDataState((prev) => {
              const next = { ...data };
              const serverSports = next.surveyInterests?.sports;
              const serverHasSurveyData = serverSports !== undefined && typeof serverSports === 'object';
              const serverSportKeys = Object.keys(serverSports || {}).sort().join(',');
              const prevSportKeys = Object.keys(prev?.surveyInterests?.sports || {}).sort().join(',');
              const prevHasSurvey = prevSportKeys.length > 0;
              const serverSportCount = Object.keys(serverSports || {}).length;
              const prevSportCount = Object.keys(prev?.surveyInterests?.sports || {}).length;
              const recentlyWroteSurvey = lastSurveyWriteAtRef.current && (Date.now() - lastSurveyWriteAtRef.current < 10000);
              if (serverHasSurveyData) {
                if (recentlyWroteSurvey && prev != null) {
                  // Trust local state for a short window after any write to prevent stale Firestore snapshots from reverting changes.
                  next.surveyInterests = prev.surveyInterests;
                  next.surveyCompleted = prev.surveyCompleted ?? next.surveyCompleted;
                  next.surveySkipped = prev.surveySkipped ?? next.surveySkipped;
                  if (Array.isArray(prev.favoriteClubs)) next.favoriteClubs = prev.favoriteClubs;
                  if (Array.isArray(prev.favoritePlayers)) next.favoritePlayers = prev.favoritePlayers;
                } else {
                  next.surveyInterests = data.surveyInterests;
                  next.surveyCompleted = data.surveyCompleted ?? next.surveyCompleted;
                  next.surveySkipped = data.surveySkipped ?? next.surveySkipped;
                  if (Array.isArray(data.favoriteClubs)) next.favoriteClubs = data.favoriteClubs;
                  if (Array.isArray(data.favoritePlayers)) next.favoritePlayers = data.favoritePlayers;
                }
              }
              else if (prev && prevHasSurvey) {
                next.surveyInterests = prev.surveyInterests;
                next.surveyCompleted = prev.surveyCompleted ?? next.surveyCompleted;
                next.surveySkipped = prev.surveySkipped ?? next.surveySkipped;
                if (Array.isArray(prev.favoriteClubs)) next.favoriteClubs = prev.favoriteClubs;
                if (Array.isArray(prev.favoritePlayers)) next.favoritePlayers = prev.favoritePlayers;
              } else if (prev && !serverHasSurveyData) {
                if (prev.surveyInterests?.sports && Object.keys(prev.surveyInterests.sports).length > 0)
                  next.surveyInterests = prev.surveyInterests;
                if (prev.surveyCompleted === true) next.surveyCompleted = true;
                if (prev.surveySkipped === true) next.surveySkipped = true;
                if (Array.isArray(prev.favoriteClubs) && prev.favoriteClubs.length > 0 && (!next.favoriteClubs || next.favoriteClubs.length === 0))
                  next.favoriteClubs = prev.favoriteClubs;
                if (Array.isArray(prev.favoritePlayers) && prev.favoritePlayers.length > 0 && (!next.favoritePlayers || next.favoritePlayers.length === 0))
                  next.favoritePlayers = prev.favoritePlayers;
              }
              return next;
            });
            if (Array.isArray(data.favoriteClubs) && data.favoriteClubs.length > 0) setFavorites(data.favoriteClubs);
            if (Array.isArray(data.favoritePlayers) && data.favoritePlayers.length > 0) setFavoritePlayers(data.favoritePlayers);
            if (data.bookedTickets && typeof data.bookedTickets === 'object') setBookedTickets(data.bookedTickets);
            if (typeof data.penaltyBest === 'number') setPenaltyBest(data.penaltyBest);
            if (typeof data.superOverBest === 'number') setSuperOverBest(data.superOverBest);
            let role = data.role === 'super_admin' || data.role === 'admin' || data.role === 'member' ? data.role : 'member';
            const isBootstrapE = isSuperAdminEmail(firebaseUser.email);
            const isBootstrapA = isAdminEmail(firebaseUser.email);
            if (isBootstrapE) role = 'super_admin';
            else if (isBootstrapA) role = 'admin';
            const today = getLocalISODate();
            const yesterday = getYesterdayISODate();
            const lastLogin = data.lastLoginDate;
            let currentStreak = typeof data.currentStreak === 'number' ? data.currentStreak : 0;
            let longestStreak = typeof data.longestStreak === 'number' ? data.longestStreak : 0;
            if (!hasRunLoginLogic) {
              hasRunLoginLogic = true;
              if (lastLogin !== today) {
                if (lastLogin === yesterday) currentStreak += 1;
                else currentStreak = 1;
                longestStreak = Math.max(longestStreak, currentStreak);
                setUserData(firebaseUser.uid, { lastLoginDate: today, currentStreak, longestStreak, displayName: firebaseUser.displayName || '', email: firebaseUser.email || '' }).catch(() => { });
              }
              setCachedStreak(firebaseUser.uid, currentStreak, longestStreak);
              const finalRole = isBootstrapE ? 'super_admin' : isBootstrapA ? 'admin' : role;
              addLoginLog(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || firebaseUser.email?.split('@')[0], finalRole).catch(() => { });
              setUserData(firebaseUser.uid, { displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '', email: firebaseUser.email || '' }).catch(() => { });
            }
            setUser(prev => prev ? { ...prev, role, currentStreak, longestStreak } : null);
          } else {
            if (!hasRunLoginLogic) {
              hasRunLoginLogic = true;
              const localClubs = JSON.parse(localStorage.getItem('favoriteClubs') || '[]');
              const localPlayers = JSON.parse(localStorage.getItem('favoritePlayers') || '[]');
              const localBooked = JSON.parse(localStorage.getItem('bookedTickets') || '{}');
              const localBest = parseInt(localStorage.getItem('penaltyBest') || '0', 10);
              const localSuperBest = parseInt(localStorage.getItem('superOverBest') || '0', 10);
              const bootstrapSuperAdmin = isSuperAdminEmail(firebaseUser.email);
              const bootstrapAdmin = isAdminEmail(firebaseUser.email);
              const initialRole = bootstrapSuperAdmin ? 'super_admin' : bootstrapAdmin ? 'admin' : 'member';
              const today = getLocalISODate();
              const streakPayload = { lastLoginDate: today, currentStreak: 1, longestStreak: 1, role: initialRole, displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '', email: firebaseUser.email || '' };
              if (localClubs.length || localPlayers.length || Object.keys(localBooked).length || localBest > 0 || localSuperBest > 0) {
                setFavorites(localClubs);
                setFavoritePlayers(localPlayers);
                setBookedTickets(localBooked);
                setPenaltyBest(localBest);
                setSuperOverBest(localSuperBest);
                setUserData(firebaseUser.uid, { favoriteClubs: localClubs, favoritePlayers: localPlayers, bookedTickets: localBooked, penaltyBest: localBest, superOverBest: localSuperBest, ...streakPayload }).catch(() => { });
              } else {
                setUserData(firebaseUser.uid, streakPayload).catch(() => { });
              }
              setCachedStreak(firebaseUser.uid, 1, 1);
              addLoginLog(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || firebaseUser.email?.split('@')[0], initialRole).catch(() => { });
              setUser(prev => prev ? { ...prev, role: initialRole, currentStreak: 1, longestStreak: 1 } : null);
            }
          }
        });
      } else {
        unsubUser();
        setUser(null);
        setUserDataState(null);
        setUserDataLoaded(false);
        setIsAuthenticated(false);
        setFavorites(JSON.parse(localStorage.getItem('favoriteClubs') || '[]'));
        setFavoritePlayers(JSON.parse(localStorage.getItem('favoritePlayers') || '[]'));
        setBookedTickets(JSON.parse(localStorage.getItem('bookedTickets') || '{}'));
        setPenaltyBest(parseInt(localStorage.getItem('penaltyBest') || '0', 10));
        setSuperOverBest(parseInt(localStorage.getItem('superOverBest') || '0', 10));
      }
    });
    return () => {
      unsubscribeAuth();
      unsubUser();
    };
  }, []);

  // Update lastSeen in Firestore so admins can see Active/Offline. Run on mount, on focus, and every 2 min.
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    const update = () => setUserData(uid, { lastSeen: new Date().toISOString() }).catch(() => { });
    update();
    const onFocus = () => update();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(update, 2 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [user?.uid]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const [page, setPage] = useState(1);
  const [pagePlayers, setPagePlayers] = useState(1);
  const [pageNews, setPageNews] = useState(1);
  const [pageClubs, setPageClubs] = useState(1);
  const [pageFavPlayers, setPageFavPlayers] = useState(1);
  const [pageFavClubs, setPageFavClubs] = useState(1);
  const [pageManageClubs, setPageManageClubs] = useState(1);
  const [userData, setUserDataState] = useState(null);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const lastSurveyWriteAtRef = useRef(0);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [dashboardNews, setDashboardNews] = useState([]);
  const [transferNews, setTransferNews] = useState([]);
  const [matchReports, setMatchReports] = useState([]);
  const [tickerText, setTickerText] = useState('Loading breaking news...');
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favoriteClubs') || '[]'));
  const [favoritePlayers, setFavoritePlayers] = useState(JSON.parse(localStorage.getItem('favoritePlayers') || '[]'));
  const [allClubs, setAllClubs] = useState([]);
  const [tables, setTables] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [playerFilter, setPlayerFilter] = useState('all');
  const [celebration, setCelebration] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [ticketMatches, setTicketMatches] = useState([]);
  const [sportPlayers, setSportPlayers] = useState([]);
  const [selectedMatchForTicket, setSelectedMatchForTicket] = useState(null);
  const [bookedTickets, setBookedTickets] = useState(JSON.parse(localStorage.getItem('bookedTickets') || '{}'));
  const [penaltyBest, setPenaltyBest] = useState(() => parseInt(localStorage.getItem('penaltyBest') || '0', 10));
  const [superOverBest, setSuperOverBest] = useState(() => parseInt(localStorage.getItem('superOverBest') || '0', 10));
  const [ticketDate, setTicketDate] = useState(new Date().toISOString().split('T')[0].split('-').join(''));
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [manageSearch, setManageSearch] = useState('');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState(null);
  const [isFetchingMatchDetails, setIsFetchingMatchDetails] = useState(false);
  const [matchDetailTab, setMatchDetailTab] = useState('summary');
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [uclKnockoutMatches, setUclKnockoutMatches] = useState([]);
  const [uclTab, setUclTab] = useState('league'); // 'league' or 'knockout'
  const [cricketKnockoutMatches, setCricketKnockoutMatches] = useState({}); // { ipl: [], t20wc: [], ... }
  const [cricketTab, setCricketTab] = useState('league'); // 'league' or 'knockout'
  const [nbaConferenceTab, setNbaConferenceTab] = useState('east'); // 'east' | 'west' — sub-tabs when on NBA
  /** Selected season year for cricket standings (null = current/latest from API). 2008–current+1. */
  const [cricketSeasonYear, setCricketSeasonYear] = useState(null);
  const sportConfig = SPORTS_CONFIG[selectedSport] || {
    ...getSportConfig(selectedSport),
    path: selectedSport,
    leagues: {},
    leagueNames: {},
    leagueLogos: {}
  };
  const leagueNames = sportConfig.leagueNames;
  const leagueLogos = sportConfig.leagueLogos;
  const leagues = sportConfig.leagues;
  const apiBase = `${SPORTS_API_SITE_ROOT}/${sportConfig.path}`;
  const standingsBase = `${SPORTS_API_V2_ROOT}/${sportConfig.path}`;

  // When a feature is disabled, redirect away from that tab (must run after leagueNames is defined)
  useEffect(() => {
    const isLiveTab = currentTab === 'live' || (leagueNames[currentTab] != null);
    const fallback = 'players';
    if (featureFlags.live_scores === false && isLiveTab) setTab(fallback);
    else if (featureFlags.news === false && currentTab === 'news') setTab(fallback);
    else if (featureFlags.favorites === false && currentTab === 'favorites') setTab(fallback);
  }, [featureFlags.live_scores, featureFlags.news, featureFlags.favorites, currentTab, leagueNames]);

  useEffect(() => {
    const isSportTab = currentTab === 'live' || leagueNames[currentTab] != null || currentTab === 'soccer_no_reason';
    if (isSportTab) setTab('live');
    setTables({});
    setMatches([]);
    setNews([]);
    setSportPlayers([]);
    setTickerText(`Loading ${sportConfig.label} updates...`);
    setUclTab('league');
    setCricketTab('league');
    setCricketKnockoutMatches({});
    setPlayerFilter('all');
    setSelectedPlayer(null);
  }, [selectedSport, sportConfig.label]);

  // Clear modals and selections when switching tabs
  useEffect(() => {
    setSelectedPlayer(null);
    setSelectedClub(null);
    setSelectedMatchForTicket(null);
    setSearch('');
    // Reset date to today only when switching tabs, unless it's live tab
    if (currentTab !== 'live') {
      setSelectedDate(getLocalISODate());
    }
    setManageSearch('');
    setSelectedMatchStatus(null);
    setPage(1);
    setPagePlayers(1);
    setPageNews(1);
    setPageClubs(1);
    if (currentTab === 'players') setSearch('');
    // Smooth scroll to top on tab change for better mobile UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  useEffect(() => {
    setPage(1);
    setPagePlayers(1);
    setPageClubs(1);
  }, [search, playerFilter, manageSearch, uclTab]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const getPageSize = (type) => {
    if (isMobile) {
      if (type === 'players') return 4;
      if (type === 'news') return 3;
      return 2; // matches, clubs
    } else {
      if (type === 'players') return 8;
      if (type === 'news') return 3;
      return 6; // matches, clubs
    }
  };

  const addToast = useCallback((title, text, type = 'info', icon = 'notifications') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // Fetch Ticket Data for specific date
  const fetchTicketMatchesByDate = useCallback(async (dateStr) => {
    setIsFetchingTickets(true);
    try {
      // Deduplicate league codes for ticket fetching
      const uniqueTicketLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueTicketLeagues[code]) uniqueTicketLeagues[code] = key;
      });
      const leaguePromises = Object.entries(uniqueTicketLeagues)
        .map(async ([code, key]) => {
          const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${dateStr}`);
          const data = await res.json();
          return (data.events || []).filter(event => event.id).map(event => {
            // F1: Grand Prix events
            if (selectedSport === 'f1') {
              const circuit = event.circuit;
              const f1Logo = leagueLogos[key] || 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png';
              return {
                id: event.id,
                league: leagueNames[key],
                home: event.shortName || event.name || 'Grand Prix',
                away: circuit?.fullName || 'Circuit',
                homeLogo: f1Logo,
                awayLogo: f1Logo,
                time: event.status?.type?.shortDetail || 'Scheduled',
                date: event.date,
                priceBase: 200 + (Math.random() * 800),
                venue: circuit?.fullName || 'Circuit',
                pick: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800&h=400`,
                sections: [
                  { name: 'GRANDSTAND', price: Math.floor(200 + Math.random() * 500), type: 'E-Ticket' },
                  { name: 'GENERAL', price: Math.floor(100 + Math.random() * 300), type: 'E-Ticket' },
                  { name: 'PADDOCK CLUB', price: Math.floor(500 + Math.random() * 2000), type: 'Premium' }
                ]
              };
            }

            const comp = event.competitions?.[0];
            const competitors = comp?.competitors || [];
            const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
            const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || competitors[0];
            return {
              id: event.id,
              league: leagueNames[key],
              home: home?.team?.displayName || home?.athlete?.displayName || 'Competitor A',
              away: away?.team?.displayName || away?.athlete?.displayName || 'Competitor B',
              homeLogo: home?.team?.logo || home?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
              awayLogo: away?.team?.logo || away?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
              time: event.status?.type?.shortDetail || '',
              date: event.date,
              priceBase: 75 + (Math.random() * 300),
              venue: comp?.venue?.fullName || 'Stadium',
              pick: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800&h=400`,
              sections: [
                { name: 'LATERAL', price: Math.floor(80 + Math.random() * 200), type: 'Mobile transfer' },
                { name: 'TRIBUNA', price: Math.floor(120 + Math.random() * 300), type: 'Mobile transfer' },
                { name: 'GOL NORD', price: Math.floor(50 + Math.random() * 100), type: 'Print-at-Home' },
                { name: 'GOL SUD', price: Math.floor(50 + Math.random() * 100), type: 'Mobile transfer' }
              ]
            };
          });
        });

      const results = await Promise.all(leaguePromises);
      setTicketMatches(results.flat());
    } catch (e) {
      console.error('Ticket fetch error:', e);
    }
    setIsFetchingTickets(false);
  }, [apiBase, leagueNames, leagues, selectedSport, leagueLogos]);

  useEffect(() => {
    fetchTicketMatchesByDate(ticketDate);
  }, [ticketDate, fetchTicketMatchesByDate]);

  // Persistence: Firestore when logged in (real-time); localStorage for guests only
  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { bookedTickets }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('bookedTickets', JSON.stringify(bookedTickets));
    }
  }, [bookedTickets, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { favoriteClubs: favorites, favoritePlayers }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('favoriteClubs', JSON.stringify(favorites));
      localStorage.setItem('favoritePlayers', JSON.stringify(favoritePlayers));
    }
  }, [favorites, favoritePlayers, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { penaltyBest }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('penaltyBest', String(penaltyBest));
    }
  }, [penaltyBest, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      setUserData(user.uid, { superOverBest }).catch((e) => console.error('Firestore save error:', e));
    } else {
      localStorage.setItem('superOverBest', String(superOverBest));
    }
  }, [superOverBest, user?.uid]);

  const toggleFavorite = (name) => {
    setFavorites(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const toggleFavoritePlayer = (playerId) => {
    setFavoritePlayers(prev => prev.includes(playerId) ? prev.filter(p => p !== playerId) : [...prev, playerId]);
  };

  const triggerCelebration = useCallback((title, detail) => {
    setCelebration({ title, detail });
    setTimeout(() => setCelebration(null), 5000);
  }, []);

  const fetchMatchDetails = async (match) => {
    if (!match) return;
    const isFallbackCricket = typeof match.id === 'string' && match.id.startsWith('fallback-');
    if (!isFallbackCricket && !match.leagueCode) return;
    setIsFetchingMatchDetails(true);
    try {
      if (isFallbackCricket) {
        // Fallback knockout match: no API; build detail from match object
        const homeAbbr = (match.home || '').replace(/\s+/g, ' ').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'HOME';
        const awayAbbr = (match.away || '').replace(/\s+/g, ' ').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'AWAY';
        setSelectedMatchStatus({
          ...match,
          details: {
            periodScores: [
              { team: homeAbbr, logo: match.homeLogo || FALLBACK_TEAM_LOGO, isHome: true, linescores: [match.homeScore || '0', '—'], totalScore: match.homeScore || '0' },
              { team: awayAbbr, logo: match.awayLogo || FALLBACK_TEAM_LOGO, isHome: false, linescores: ['—', match.awayScore || '0'], totalScore: match.awayScore || '0' }
            ],
            gameLeaders: [],
            lineups: [],
            scoringPlays: [],
            keyEvents: [],
            venue: '',
            keyEventsNote: 'Top performer stats are not available for this historical match.'
          }
        });
        setIsFetchingMatchDetails(false);
        return;
      }

      const res = await fetch(`${apiBase}/${match.leagueCode}/summary?event=${match.id}`);
      const data = await res.json();

      // Extract sport-specific enriched details
      const enriched = { ...data };

      // --- Period/Quarter/Inning scores ---
      try {
        const linescores = data.boxscore?.teams?.map(t => ({
          team: t.team?.displayName || t.team?.shortDisplayName || '',
          logo: t.team?.logo || t.team?.logos?.[0]?.href || '',
          scores: (t.statistics || [])
        }));
        // ESPN often puts linescores in header.competitions[0].competitors
        const headerComp = data.header?.competitions?.[0]?.competitors || [];
        if (headerComp.length >= 2) {
          enriched.periodScores = headerComp.map(c => {
            const rawScore = c.score;
            const scoreStr = rawScore != null && rawScore !== '' ? (typeof rawScore === 'object' ? String(rawScore.displayValue ?? rawScore.value ?? rawScore) : String(rawScore)) : '0';
            const lineArr = (c.linescores || []).map(ls => {
              const v = ls?.displayValue ?? ls?.value ?? ls;
              return typeof v === 'object' ? String(v.displayValue ?? v.value ?? '0') : String(v || '0');
            });
            return {
              team: c.team?.abbreviation || c.team?.displayName || '',
              logo: c.team?.logo || c.team?.logos?.[0]?.href || '',
              id: c.id,
              isHome: c.homeAway === 'home',
              linescores: lineArr.length ? lineArr : [scoreStr],
              totalScore: scoreStr
            };
          });
          // Cricket: if linescores empty but we have score, use score as single inning so strip shows something
          if (selectedSport === 'cricket' && enriched.periodScores.every(ps => !ps.linescores || ps.linescores.length === 0)) {
            enriched.periodScores = enriched.periodScores.map(ps => ({
              ...ps,
              linescores: [ps.totalScore],
              totalScore: ps.totalScore
            }));
          }
        } else {
          enriched.periodScores = linescores || [];
        }
        // Cricket fallback: if still no periodScores but we have match scores, build from match
        if (selectedSport === 'cricket' && (!enriched.periodScores || enriched.periodScores.length === 0) && (match.homeScore || match.awayScore)) {
          enriched.periodScores = [
            { team: (match.home || '').slice(0, 3).toUpperCase() || 'A', logo: match.homeLogo || '', isHome: true, linescores: [match.homeScore || '0'], totalScore: match.homeScore || '0' },
            { team: (match.away || '').slice(0, 3).toUpperCase() || 'B', logo: match.awayLogo || '', isHome: false, linescores: [match.awayScore || '0'], totalScore: match.awayScore || '0' }
          ];
        }
      } catch (e) { enriched.periodScores = []; }

      // --- Leaders (top performers) ---
      try {
        const leaders = data.leaders || [];
        enriched.gameLeaders = leaders.map(cat => ({
          name: cat.name || cat.displayName || '',
          displayName: cat.displayName || cat.name || (cat.name || '').replace(/_/g, ' '),
          leaders: (cat.leaders || []).slice(0, 3).map(l => ({
            displayName: l.athlete?.displayName || l.displayName || l.athlete?.fullName || '',
            team: l.team?.abbreviation || l.athlete?.team?.abbreviation || '',
            headshot: l.athlete?.headshot?.href || l.athlete?.headshot || '',
            value: l.displayValue || l.value || (l.statistics?.[0]?.displayValue) || '',
            stats: l.statistics || []
          })).filter(l => l.displayName || l.value)
        })).filter(cat => cat.leaders && cat.leaders.length > 0);
        // Cricket: also try leaders from boxscore or statistics if gameLeaders empty
        if (selectedSport === 'cricket' && enriched.gameLeaders.length === 0 && data.boxscore?.teams) {
          const batting = [];
          const bowling = [];
          data.boxscore.teams.forEach(t => {
            (t.statistics || []).forEach(s => {
              const statName = (s.name || '').toLowerCase();
              if (statName.includes('batting') || statName.includes('runs') || statName === 'r') {
                const leader = s.athletes?.[0] || s.leader;
                if (leader) batting.push({ displayName: leader.displayName || leader.athlete?.displayName, team: t.team?.abbreviation, value: leader.displayValue || leader.value || s.displayValue });
              }
              if (statName.includes('bowling') || statName.includes('wicket') || statName === 'w') {
                const leader = s.athletes?.[0] || s.leader;
                if (leader) bowling.push({ displayName: leader.displayName || leader.athlete?.displayName, team: t.team?.abbreviation, value: leader.displayValue || leader.value || s.displayValue });
              }
            });
          });
          if (batting.length || bowling.length) {
            enriched.gameLeaders = [];
            if (batting.length) enriched.gameLeaders.push({ displayName: 'Top Run Scorers', leaders: batting.slice(0, 3) });
            if (bowling.length) enriched.gameLeaders.push({ displayName: 'Top Wicket Takers', leaders: bowling.slice(0, 3) });
          }
        }
      } catch (e) { enriched.gameLeaders = []; }

      // --- Rosters / Lineups ---
      try {
        const rosters = data.rosters || [];
        enriched.lineups = rosters.map(r => ({
          team: r.team?.displayName || '',
          logo: r.team?.logo || r.team?.logos?.[0]?.href || '',
          players: (r.roster || []).slice(0, 11).map(p => ({
            name: p.athlete?.displayName || p.displayName || '',
            position: p.position?.abbreviation || p.position?.name || '',
            jersey: p.jersey || ''
          }))
        }));
      } catch (e) { enriched.lineups = []; }

      // --- Scoring plays / Key events ---
      try {
        // Different sports put scoring plays in different locations
        const scoringPlays = data.scoringPlays || data.drives?.previous?.flatMap(d => d.plays?.filter(p => p.scoringPlay)) || [];
        enriched.scoringPlays = scoringPlays.map(p => ({
          period: p.period?.number || p.quarter || '',
          periodText: p.period?.displayValue || '',
          clock: p.clock?.displayValue || p.wallclock || '',
          text: p.text || p.shortText || p.description || '',
          team: p.team?.displayName || p.team?.abbreviation || '',
          teamLogo: p.team?.logo || p.team?.logos?.[0]?.href || '',
          homeScore: p.homeScore || '',
          awayScore: p.awayScore || '',
          type: p.type?.text || p.scoringType?.displayName || ''
        }));
      } catch (e) { enriched.scoringPlays = []; }

      // --- Winprobability / Game info ---
      try {
        const gameInfo = data.gameInfo || {};
        enriched.venue = gameInfo.venue?.fullName || gameInfo.venue?.shortName || '';
        enriched.attendance = gameInfo.attendance || '';
        enriched.weather = data.weather?.displayValue || data.weather?.temperature ? `${data.weather.temperature}°F ${data.weather.conditionId || ''}` : '';
      } catch (e) { /* ignore */ }

      setSelectedMatchStatus({
        ...match,
        details: enriched
      });
    } catch (e) {
      console.error('Error fetching match details:', e);
    }
    setIsFetchingMatchDetails(false);
  };

  // Fetch news from all leagues (sources) with periodic refresh — get enough for 10+ pages (30+ items) in every sport
  useEffect(() => {
    const leagueCodes = Object.values(leagues || {});
    const leagueKeys = Object.keys(leagues || {});

    const fetchNews = async () => {
      try {
        if (leagueCodes.length === 0) {
          setNews([]);
          setTickerText(`No ${sportConfig.label.toLowerCase()} sources configured.`);
          return;
        }
        // Request more articles per league so single-league sports (NBA, NFL, MLB, NHL, F1) get 10+ pages
        const limit = 50;
        const results = await Promise.allSettled(
          leagueCodes.map((code) =>
            fetch(`${apiBase}/${code}/news?limit=${limit}`).then((r) => r.json())
          )
        );
        const combined = [];
        results.forEach((outcome, idx) => {
          if (outcome.status !== 'fulfilled' || !outcome.value) return;
          const newsData = outcome.value;
          const articles = newsData.articles || [];
          const sourceName = leagueNames[leagueKeys[idx]] || sportConfig.label;
          articles.forEach((a) => {
            combined.push({
              tag: fixTextEncoding(a.categories?.[0]?.description) || sportConfig.label,
              title: fixTextEncoding(a.headline) || '',
              excerpt: fixTextEncoding(a.description) || '',
              image: a.images?.[0]?.url || 'https://via.placeholder.com/400x200',
              link: a.links?.web?.href,
              source: sourceName,
              published: a.published || a.lastModified || new Date().toISOString()
            });
          });
        });
        const seen = new Set();
        const deduped = combined.filter((a) => {
          const id = a.link || a.title;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        // Keep enough for 10+ pages at 3 per page (30+), cap at 200 so every sport has plenty
        setNews(deduped.slice(0, 200));
        const tickerItems = deduped.slice(0, 5).map((a) => `• ${a.title}`);
        setTickerText(tickerItems.length ? tickerItems.join('      ') : `No breaking ${sportConfig.label.toLowerCase()} headlines right now.`);
      } catch (e) {
        console.error('News fetch error:', e);
      }
    };
    fetchNews();
    const newsInterval = setInterval(fetchNews, 30000);
    return () => clearInterval(newsInterval);
  }, [apiBase, leagues, leagueNames, sportConfig.label]);

  // Unified feed: fetch many news + every match report + every transfer article for each sport from all leagues (lively, 5+ pages per category)
  const NEWS_LIMIT_PER_LEAGUE = 200;
  const MAX_NEWS_TOTAL = 1000;
  const MAX_MATCH_REPORTS_TOTAL = 800;
  const MAX_TRANSFER_NEWS_TOTAL = 800;
  const FEED_REFRESH_INTERVAL_MS = 45000; // 45 seconds for lively updates

  useEffect(() => {
    const sportsToFetch = enabledSportKeys && enabledSportKeys.length > 0
      ? enabledSportKeys
      : Object.keys(SPORTS_CONFIG);
    if (sportsToFetch.length === 0) {
      setDashboardNews([]);
      setTransferNews([]);
      setMatchReports([]);
      return;
    }

    const base = SPORTS_API_SITE_ROOT;
    const transferCategoryPattern = /transfer\s*talk|transfer\s*rumor|transfer\s*rumour|transfer\s*news|transfers|transfer\s*market|signing\s*news|rumors?\s*&\s*rumours?|done\s*deal|transfer\s*centre|free\s*agency|trade\s*rumor|trade\s*news|signing|trades?|contract|waived|acquired|traded\s+to|roster\s*move|extension\s*talk|auction|retention|released\s*players|draft\b|trade\s*window|re-signed/i;
    const transferHeadlinePattern = /^transfer\s*(rumors?|news|talk)\s*[,:]|^transfer\s*rumors?,?\s*news|transfer\s*round|signing|signed\s+for|joins\s+\w+|agrees\s+deal|^trade\s*(rumors?|news|deadline)|free\s*agency|signed\s+with|contract\s+extension|waived\s+by|traded\s+to|acquired\s+by|ipl\s*auction|bbl\s*draft|retained\s+by|released\s+by|re-signs?\b/i;
    const matchReportCategoryPattern = /recap|match\s*report|match\s*reports|game\s*report|full-time|ft\s*report|result|round\s*up|wrap\s*up|highlights?\s*report|match\s*centre|game\s*recap|box\s*score|final\s*score|game\s*summary|top\s*performers/i;
    const matchReportHeadlinePattern = /\b(beat|beats|defeat|defeats|win|wins|loss|relegation|victory|draw|condemn|consigned|full-time|\bft\b|result|scoreline|highlights?|match report|report:\s*|recap|final\s*score|box\s*score|rout|blowout|overtime|halftime|quarter\s*\d|game\s*recap|top\s*performers)\b/i;
    const matchResultInDescription = /\b(defeat|defeats?|win(?:s|ning)?|loss|beat|beats?|relegation|victory|draw|full-time|\bft\b|match report|scoreline|scored\s+a\s+goal|final\s*score|quarter|halftime|overtime|box\s*score|game\s*recap)\b/i;

    const fetchAllSportFeeds = async () => {
      try {
        const allRequests = [];
        sportsToFetch.forEach((sportKey) => {
          const config = SPORTS_CONFIG[sportKey];
          if (!config || !config.leagues) return;
          const path = config.path;
          const sportLabel = config.label || sportKey;
          Object.entries(config.leagues).forEach(([leagueKey, code]) => {
            const leagueName = (config.leagueNames && config.leagueNames[leagueKey]) || leagueKey;
            const source = `${sportLabel} · ${leagueName}`;
            allRequests.push(
              fetch(`${base}/${path}/${code}/news?limit=${NEWS_LIMIT_PER_LEAGUE}`)
                .then((r) => r.json())
                .then((data) => ({ data: data.articles || [], source, sportKey }))
                .catch(() => ({ data: [], source, sportKey }))
            );
          });
        });

        const results = await Promise.all(allRequests);
        const allArticles = [];
        const matchReportsList = [];
        const transferNewsList = [];

        // Iterate results and destruct properties
        results.forEach(({ data: articles, source, sportKey }) => {
          (articles || []).forEach((a) => {
            const categoryDesc = (a.categories?.[0]?.description || '').trim();
            const headline = (a.headline || '').trim();
            const headlineLower = headline.toLowerCase();
            const desc = (a.description || '').toLowerCase();
            const item = {
              tag: fixTextEncoding(a.categories?.[0]?.description) || source,
              title: fixTextEncoding(a.headline) || '',
              excerpt: fixTextEncoding(a.description) || '',
              image: a.images?.[0]?.url || 'https://via.placeholder.com/400x200',
              link: a.links?.web?.href,
              source,
              sportKey,
              published: a.published || a.lastModified || new Date().toISOString()
            };

            const isTransfer = transferCategoryPattern.test(categoryDesc) || transferHeadlinePattern.test(headline);
            const isMatchReport = matchReportCategoryPattern.test(categoryDesc) || matchReportHeadlinePattern.test(headlineLower) || matchResultInDescription.test(desc);
            if (isTransfer && !isMatchReport) {
              transferNewsList.push(item);
            } else if (isMatchReport && !isTransfer) {
              matchReportsList.push(item);
            }
            allArticles.push(item);
          });
        });

        const dedupe = (list, keyFn) => {
          const seen = new Set();
          return list.filter((a) => {
            const id = keyFn(a);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        };
        const byLinkOrTitle = (a) => a.link || a.title;
        const sortByNewest = (list) => [...list].sort((a, b) => new Date(b.published) - new Date(a.published));

        setDashboardNews(sortByNewest(dedupe(allArticles, byLinkOrTitle)).slice(0, MAX_NEWS_TOTAL));
        setMatchReports(sortByNewest(dedupe(matchReportsList, byLinkOrTitle)).slice(0, MAX_MATCH_REPORTS_TOTAL));
        setTransferNews(sortByNewest(dedupe(transferNewsList, byLinkOrTitle)).slice(0, MAX_TRANSFER_NEWS_TOTAL));
      } catch (e) {
        console.error('Sport feeds fetch error:', e);
        setDashboardNews([]);
        setMatchReports([]);
        setTransferNews([]);
      }
    };

    fetchAllSportFeeds();
    const interval = setInterval(fetchAllSportFeeds, FEED_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabledSportKeys]);

  /* Legacy separate effects removed – unified feed above handles news, match reports, transfer for all sports. */

  // Filter feeds to only the user's survey sports so dashboard shows mixed content from their chosen sports
  const surveySportLabelsForFilter = useMemo(() => {
    const sports = userData?.surveyInterests?.sports && typeof userData.surveyInterests.sports === 'object' ? userData.surveyInterests.sports : {};
    return Object.keys(sports).map((k) => (SPORTS_CONFIG[k]?.label || k));
  }, [userData?.surveyInterests?.sports]);

  const dashboardNewsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return dashboardNews;
    return dashboardNews.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [dashboardNews, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const transferNewsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return transferNews;
    return transferNews.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [transferNews, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const matchReportsForUser = useMemo(() => {
    const chosenKeys = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosenKeys.length === 0) return matchReports;
    return matchReports.filter((item) =>
      (item.sportKey && chosenKeys.includes(item.sportKey)) ||
      surveySportLabelsForFilter.some((label) => (item.source || '').startsWith(label))
    );
  }, [matchReports, surveySportLabelsForFilter, userData?.surveyInterests?.sports]);

  const fetchAllData = useCallback(async () => {
    try {
      // Calculate date range: YYYYMMDD
      const formatDate = (isoString) => isoString.replace(/-/g, '');


      let datesParam = '';

      // Check for "Team A vs Team B" pattern
      const vsMatch = search.toLowerCase().match(/(.+)\s+vs\s+(.+)/);
      let teamA = '', teamB = '';
      if (vsMatch) {
        teamA = vsMatch[1].trim();
        teamB = vsMatch[2].trim();
      }

      if (search.length > 2) {
        // If searching, expand range significantly (-30 days to +90 days) to find the match
        // We can just rely on basic UTC dates for wide range searches as exact day matters less
        const s = new Date();
        s.setDate(s.getDate() - 30);
        const e = new Date();
        e.setDate(e.getDate() + 90);

        datesParam = `${s.toISOString().slice(0, 10).replace(/-/g, '')}-${e.toISOString().slice(0, 10).replace(/-/g, '')}`;
      } else {
        // Default: selected date ONLY
        // selectedDate is already YYYY-MM-DD local string from state
        datesParam = formatDate(selectedDate);
      }

      // Fetch Matches - deduplicate league codes (e.g. nba-east & nba-west share 'nba')
      const uniqueLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueLeagues[code]) uniqueLeagues[code] = key;
      });
      const leaguePromises = Object.entries(uniqueLeagues)
        .map(async ([code, key]) => {
          try {
            const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${datesParam}&limit=200`);
            if (!res.ok) return [];
            const data = await res.json().catch(() => ({}));
            if (!data || !Array.isArray(data.events)) return [];

            // F1: Grand Prix events with sub-competitions (FP1, FP2, Qual, Race)
            if (selectedSport === 'f1') {
              return (data.events || []).filter(event => event.id).map(event => {
                const raceComp = event.competitions?.find(c => c.type?.abbreviation === 'Race') || event.competitions?.[event.competitions.length - 1];
                const matchDate = new Date(event.date);
                const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const raceStatus = raceComp?.status?.type || event.status?.type || {};
                const circuit = event.circuit;
                const f1Logo = leagueLogos[key] || 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png';
                return {
                  id: event.id,
                  leagueCode: code,
                  league: leagueNames[key],
                  home: event.shortName || event.name || 'Grand Prix',
                  away: circuit?.fullName || circuit?.address?.city || 'Circuit',
                  homeShort: event.shortName || '',
                  awayShort: circuit?.address?.city || '',
                  homeScore: raceStatus.state === 'post' ? 'Finished' : '',
                  awayScore: circuit?.address?.country || '',
                  time: `${dateStr} ${timeStr}`,
                  rawDate: event.date,
                  isLive: raceStatus.state === 'in',
                  isCompleted: raceStatus.state === 'post',
                  status: raceStatus.shortDetail || raceStatus.detail || 'Scheduled',
                  statusDetail: raceStatus.detail || '',
                  homeLogo: f1Logo,
                  awayLogo: f1Logo,
                  winner: null,
                  scoringPlays: []
                };
              });
            }

            return (data.events || []).filter(event => event.competitions?.[0]).map(event => {
              const comp = event.competitions[0];
              const competitors = comp?.competitors || [];
              const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
              const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || competitors[0];

              // Format time nicely
              const matchDate = new Date(event.date);
              const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return {
                id: event.id,
                leagueCode: code,
                league: leagueNames[key],
                home: home?.team?.displayName || home?.athlete?.displayName || 'Competitor A',
                away: away?.team?.displayName || away?.athlete?.displayName || 'Competitor B',
                homeShort: home?.team?.shortDisplayName || home?.athlete?.shortName || '', // Added for search matching
                awayShort: away?.team?.shortDisplayName || away?.athlete?.shortName || '', // Added for search matching
                homeScore: home?.score || '0',
                awayScore: away?.score || '0',
                time: `${dateStr} ${timeStr}`,
                rawDate: event.date,
                isLive: event.status?.type?.state === 'in',
                isCompleted: event.status?.type?.state === 'post',
                status: event.status?.type?.shortDetail || '',
                statusDetail: event.status?.type?.detail || '', // Contains "won on penalties" info
                homeLogo: home?.team?.logo || (selectedSport === 'cricket' && home?.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${home.team.id}.png` : null) || home?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
                awayLogo: away?.team?.logo || (selectedSport === 'cricket' && away?.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${away.team.id}.png` : null) || away?.athlete?.headshot?.href || 'https://via.placeholder.com/48',
                winner: home?.winner === 'true' || home?.winner === true ? 'home' : (away?.winner === 'true' || away?.winner === true ? 'away' : null),
                recapLink: (event.links || []).find(l => l.rel?.includes('recap') && l.rel?.includes('desktop'))?.href || (event.links || []).find(l => l.rel?.includes('recap'))?.href,
                sportKey: selectedSport,
                scoringPlays: (comp.scoringPlays || []).map(p => {
                  try {
                    return {
                      id: p.id,
                      teamId: p.team?.id,
                      clock: p.clock?.displayValue || '',
                      result: p.result,
                      participants: (p.participants || []).map(pr => ({
                        id: pr.athlete?.id,
                        name: pr.athlete?.displayName || '',
                        type: pr.type?.name || ''
                      }))
                    };
                  } catch (_e) { return null; }
                }).filter(Boolean)
              };
            });
          } catch (_e) {
            return [];
          }
        });

      const matchResults = await Promise.all(leaguePromises);
      let allMatches = matchResults.flat().sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

      // Filter by "Team A vs Team B" specifically if pattern matched
      if (teamA && teamB) {
        allMatches = allMatches.filter(m =>
          (
            (m.home.toLowerCase().includes(teamA) || m.homeShort?.toLowerCase().includes(teamA)) &&
            (m.away.toLowerCase().includes(teamB) || m.awayShort?.toLowerCase().includes(teamB))
          ) || (
            (m.home.toLowerCase().includes(teamB) || m.homeShort?.toLowerCase().includes(teamB)) &&
            (m.away.toLowerCase().includes(teamA) || m.awayShort?.toLowerCase().includes(teamA))
          )
        );
      }

      setMatches(prevMatches => {
        // Check for goal celebrations & notifications
        if (prevMatches.length > 0) {
          allMatches.forEach(newM => {
            const oldM = prevMatches.find(m => m.id === newM.id);
            if (oldM) {
              const homeScored = parseInt(newM.homeScore) > parseInt(oldM.homeScore);
              const awayScored = parseInt(newM.awayScore) > parseInt(oldM.awayScore);

              // 1. Favorite Club Scored
              if (homeScored && favorites.includes(newM.home)) {
                triggerCelebration('GOAL!', `${newM.home.toUpperCase()} SCORED!`);
                addToast('GOAL!', `${newM.home} just scored!`, 'success', sportConfig.icon);
                if (user?.uid) addNotification(user.uid, 'goal', 'GOAL!', `${newM.home} just scored!`, { matchId: newM.id, teamName: newM.home }).catch(() => { });
              }
              if (awayScored && favorites.includes(newM.away)) {
                triggerCelebration('GOAL!', `${newM.away.toUpperCase()} SCORED!`);
                addToast('GOAL!', `${newM.away} just scored!`, 'success', sportConfig.icon);
                if (user?.uid) addNotification(user.uid, 'goal', 'GOAL!', `${newM.away} just scored!`, { matchId: newM.id, teamName: newM.away }).catch(() => { });
              }

              // 2. Favorite Club Conceded
              if (homeScored && favorites.includes(newM.away)) {
                addToast('GOAL CONCEDED', `${newM.away} just conceded against ${newM.home}.`, 'danger', 'warning');
                if (user?.uid) addNotification(user.uid, 'goal', 'Goal conceded', `${newM.away} conceded vs ${newM.home}`, { matchId: newM.id }).catch(() => { });
              }
              if (awayScored && favorites.includes(newM.home)) {
                addToast('GOAL CONCEDED', `${newM.home} just conceded against ${newM.away}.`, 'danger', 'warning');
                if (user?.uid) addNotification(user.uid, 'goal', 'Goal conceded', `${newM.home} conceded vs ${newM.away}`, { matchId: newM.id }).catch(() => { });
              }

              // 3. Favorite Player Scored/Assisted
              if (homeScored || awayScored) {
                const newPlays = newM.scoringPlays.filter(np => !oldM.scoringPlays.some(op => op.id === np.id));
                newPlays.forEach(play => {
                  play.participants.forEach(p => {
                    if (favoritePlayers.includes(parseInt(p.id))) {
                      if (p.type === 'scorer') {
                        triggerCelebration('PLAYER GOAL!', `${p.name.toUpperCase()} SCORED!`);
                        addToast('FAVORITE PLAYER SCORE!', `${p.name} just scored for ${play.teamId === newM.homeId ? newM.home : newM.away}!`, 'success', 'stars');
                        if (user?.uid) addNotification(user.uid, 'player_news', `${p.name} scored!`, `Scored for ${play.teamId === newM.homeId ? newM.home : newM.away}`, { playerId: p.id }).catch(() => { });
                      } else if (p.type === 'assist') {
                        addToast('ASSIST!', `${p.name} provided an assist!`, 'info', 'shortcut');
                        if (user?.uid) addNotification(user.uid, 'player_news', 'Assist!', `${p.name} provided an assist`, { playerId: p.id }).catch(() => { });
                      }
                    }
                  });
                });
              }
            }
          });
        }
        return allMatches;
      });

      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    }
  }, [favorites, search, selectedDate, favoritePlayers, addToast, triggerCelebration, leagues, apiBase, leagueNames, sportConfig.icon, selectedSport, leagueLogos, user?.uid, surveySportLabelsForFilter]);

  // Dashbord matches effect: Fetch matches for all survey sports to ensure variety
  useEffect(() => {
    if (currentTab !== 'dashboard') return;
    const chosen = userData?.surveyInterests?.sports ? Object.keys(userData.surveyInterests.sports) : [];
    if (chosen.length === 0) return;

    const base = `${SPORTS_API_SITE_ROOT}`;
    const dateStr = getLocalISODate().replace(/-/g, '');

    const fetchAllChosen = async () => {
      try {
        const promises = chosen.map(async (sportKey) => {
          const config = SPORTS_CONFIG[sportKey];
          if (!config || !config.leagues) return [];
          const leagueCodes = Object.values(config.leagues);
          const uniqueCodes = Array.from(new Set(leagueCodes));

          const innerPromises = uniqueCodes.map(async (code) => {
            try {
              const res = await fetch(`${base}/${config.path}/${code}/scoreboard?dates=${dateStr}&limit=50`);
              const d = await res.json();
              return (d.events || []).map(ev => {
                const cmp = ev.competitions?.[0];
                const h = cmp?.competitors?.find(c => c.homeAway === 'home');
                const a = cmp?.competitors?.find(c => c.homeAway === 'away');
                return {
                  id: ev.id,
                  league: config.leagueNames?.[Object.keys(config.leagues).find(k => config.leagues[k] === code)] || config.label,
                  home: h?.team?.displayName || 'TBD',
                  away: a?.team?.displayName || 'TBD',
                  homeScore: h?.score || '0',
                  awayScore: a?.score || '0',
                  time: new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  rawDate: ev.date,
                  isLive: ev.status?.type?.state === 'in',
                  isCompleted: ev.status?.type?.state === 'post',
                  status: ev.status?.type?.shortDetail || '',
                  homeLogo: h?.team?.logo,
                  awayLogo: a?.team?.logo,
                  sportKey: sportKey,
                  recapLink: (ev.links || []).find(l => l.rel?.includes('recap'))?.href
                };
              });
            } catch { return []; }
          });
          const results = await Promise.all(innerPromises);
          return results.flat();
        });

        const all = await Promise.all(promises);
        const flat = all.flat();
        setMatches(prev => {
          const matchMap = new Map(prev.map(m => [m.id, m]));
          let changed = false;
          flat.forEach(m => {
            const existing = matchMap.get(m.id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(m)) {
              matchMap.set(m.id, m);
              changed = true;
            }
          });
          if (!changed) return prev;
          return Array.from(matchMap.values()).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
        });
      } catch (e) { console.error('Dashboard extra fetch error:', e); }
    };
    fetchAllChosen();
  }, [currentTab, userData?.surveyInterests?.sports]);

  const fetchTable = useCallback(async (key, forceRefresh = false, seasonYearParam = null) => {
    const isCricket = selectedSport === 'cricket';
    const requestedSeason = isCricket ? seasonYearParam : null;
    const cacheKey = key;
    // For cricket: when requesting a specific season, always fetch if cached season doesn't match (or force refresh)
    const cached = tables[cacheKey];
    const seasonMismatch = isCricket && requestedSeason != null && cached?.seasonYear != null && cached.seasonYear !== requestedSeason;
    if (cached && !forceRefresh && !seasonMismatch && (requestedSeason == null || cached.seasonYear === requestedSeason)) return;
    try {
      // Cricket: when a specific season is selected, prefer fallback data so every league shows that year (ESPN often returns current/empty for past seasons)
      if (isCricket && requestedSeason != null) {
        const fallback = getCricketStandingsFallback(key, requestedSeason);
        if (fallback?.rows?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows,
              conferences: fallback.conferences || [],
              seasonYear: requestedSeason
            }
          }));
          return;
        }
        if (fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows?.length ? fallback.rows : fallback.conferences[0].rows,
              conferences: fallback.conferences,
              seasonYear: requestedSeason
            }
          }));
          return;
        }
      }

      const code = (isCricket && sportConfig.standingsLeagueIds?.[key]) ? sportConfig.standingsLeagueIds[key] : leagues[key];
      const seasonQuery = isCricket && requestedSeason != null ? `?season=${requestedSeason}` : '';
      const url = `${standingsBase}/${code}/standings${seasonQuery}`;
      const res = await fetch(url);
      const data = await res.json();
      const seasonYear = data.season?.year ?? requestedSeason ?? null;

      const isDriverStandings = selectedSport === 'f1';
      const preferredStatsBySport = {
        soccer: ['GP', 'W', 'D', 'L', 'GD', 'P'],
        basketball: ['W', 'L', 'PCT', 'GB', 'STRK', 'L10'],
        football: ['W', 'L', 'T', 'PCT', 'PF', 'PA'],
        baseball: ['W', 'L', 'PCT', 'GB', 'STRK', 'L10'],
        hockey: ['W', 'L', 'OTL', 'PTS', 'GF', 'GA'],
        cricket: ['M', 'W', 'L', 'N/R', 'NRR', 'PT'],
        f1: ['PTS']
      };
      const fallbackStats = ['W', 'L', 'PCT', 'GB', 'PTS', 'PF', 'PA', 'F', 'A', 'GD', 'P'];
      const preferred = preferredStatsBySport[selectedSport] || fallbackStats;

      const parseConference = (child) => {
        const entries = child?.standings?.entries || [];
        if (entries.length === 0) return null;
        const conferenceName = child?.name || child?.abbreviation || '';
        const sampleStats = entries[0]?.stats || [];
        const filteredSampleStats = isDriverStandings
          ? sampleStats.filter(s => ['rank', 'points', 'championshipPts'].includes(s.type) || ['RK', 'PTS'].includes(s.abbreviation))
          : sampleStats;
        const selectedStatKeys = preferred
          .filter((ab) => filteredSampleStats.some((s) => s.abbreviation === ab))
          .slice(0, 6);
        const dynamicStatKeys = selectedStatKeys.length > 0
          ? selectedStatKeys
          : filteredSampleStats
            .map((s) => s.abbreviation)
            .filter((ab) => ab && !['R', 'RK', 'RANK', 'POS'].includes(ab.toUpperCase()))
            .slice(0, 6);
        const rows = entries.map((entry) => {
          const stats = entry.stats || [];
          const getStat = (ab) => stats.find((s) => s.abbreviation === ab)?.displayValue || '-';
          const rank = getStat('R') || getStat('RK') || getStat('RANK') || '-';
          const values = {};
          dynamicStatKeys.forEach((keyName) => { values[keyName] = getStat(keyName); });
          if (isDriverStandings) {
            return { pos: rank, team: entry.athlete?.displayName || 'Driver', logo: entry.athlete?.flag?.href || FALLBACK_TEAM_LOGO, values };
          }
          const teamLogo = entry.team?.logos?.[0]?.href || (selectedSport === 'cricket' && entry.team?.id ? `https://a.espncdn.com/i/teamlogos/cricket/500/${entry.team.id}.png` : undefined) || FALLBACK_TEAM_LOGO;
          return { pos: rank, team: entry.team?.displayName || 'Team', logo: teamLogo, values };
        });
        return { name: conferenceName, columns: dynamicStatKeys, rows };
      };

      const children = data.children || [];

      // T20 World Cup (and other multi-group cricket): try fallback first when season is set (ESPN often has no/empty group data for past years)
      if (selectedSport === 'cricket' && key === 't20wc' && requestedSeason != null) {
        const t20Fallback = getCricketStandingsFallback('t20wc', requestedSeason);
        if (t20Fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: t20Fallback.columns,
              rows: t20Fallback.rows?.length ? t20Fallback.rows : t20Fallback.conferences[0].rows,
              conferences: t20Fallback.conferences,
              seasonYear: requestedSeason
            }
          }));
          return;
        }
      }

      // Cricket with multiple groups (e.g. T20 World Cup, Ranji groups): show each as a group table
      if (selectedSport === 'cricket' && children.length > 1) {
        const conferences = children.map(parseConference).filter(Boolean);
        const useFallback = requestedSeason != null && (conferences.length === 0 || conferences.every(c => isCricketTableEmpty(c.rows)));
        const fallback = useFallback ? getCricketStandingsFallback(key, requestedSeason) : null;
        if (fallback?.conferences?.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: fallback.columns,
              rows: fallback.rows?.length ? fallback.rows : fallback.conferences[0].rows,
              conferences: fallback.conferences,
              seasonYear
            }
          }));
        } else if (conferences.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: conferences[0].columns,
              rows: conferences[0].rows,
              conferences,
              seasonYear
            }
          }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], conferences: [], seasonYear } }));
        }
        return;
      }

      // For sports with conferences (NBA, NFL, etc.) — parse each conference
      if (children.length > 1 && (selectedSport === 'basketball' || selectedSport === 'football' || selectedSport === 'hockey' || selectedSport === 'baseball')) {
        const conferences = children.map(parseConference).filter(Boolean);
        if (conferences.length > 0) {
          setTables((prev) => ({
            ...prev,
            [key]: {
              columns: conferences[0].columns,
              rows: conferences[0].rows,
              conferences,
              seasonYear
            }
          }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], conferences: [], seasonYear } }));
        }
      } else {
        // Single conference / league (soccer, cricket, f1)
        const parsed = parseConference(children[0] || { standings: data.standings || { entries: [] } });
        if (parsed) {
          // Cricket: if ESPN returned empty stats (common for historical seasons), use fallback data from 2008+
          let finalColumns = parsed.columns;
          let finalRows = parsed.rows;
          if (isCricket && requestedSeason != null && isCricketTableEmpty(parsed.rows)) {
            const fallback = getCricketStandingsFallback(key, requestedSeason);
            if (fallback?.rows?.length) {
              finalColumns = fallback.columns;
              finalRows = fallback.rows;
            }
          }
          setTables((prev) => ({ ...prev, [key]: { columns: finalColumns, rows: finalRows, seasonYear } }));
        } else {
          setTables(prev => ({ ...prev, [key]: { columns: [], rows: [], seasonYear } }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [tables, leagues, standingsBase, selectedSport, sportConfig]);

  const fetchAllClubs = useCallback(async () => {
    try {
      // F1: Use static constructor data since /racing/f1/teams returns empty
      if (selectedSport === 'f1') {
        setAllClubs(F1_CONSTRUCTORS);
        return;
      }

      // Cricket: Extract teams from scoreboard since /cricket/{id}/teams returns empty
      if (selectedSport === 'cricket') {
        const teamPromises = Object.entries(leagues).map(async ([key, code]) => {
          try {
            const res = await fetch(`${apiBase}/${code}/scoreboard`);
            const data = await res.json();
            const teams = data.teams || [];
            return teams.map(t => ({
              id: t.id,
              name: t.displayName || t.name,
              logo: t.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/cricket/500/${t.id}.png`,
              league: leagueNames[key] || 'Cricket',
              leagueCode: code,
              tagline: t.abbreviation || t.shortDisplayName || '',
              formation: t.location || 'Cricket',
              style: 'Cricket',
              description: `${t.displayName || t.name} competes in ${leagueNames[key]}.`,
              trophies: [],
              lineup: [],
              history: `${t.displayName || t.name} is tracked live from ESPNcricinfo data feeds.`,
              legends: []
            }));
          } catch (_err) {
            return [];
          }
        });
        const results = await Promise.all(teamPromises);
        setAllClubs(results.flat());
        return;
      }

      // Default: Use standard /teams endpoint (deduplicate league codes)
      const uniqueClubLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniqueClubLeagues[code]) uniqueClubLeagues[code] = key;
      });
      const teamPromises = Object.entries(uniqueClubLeagues).map(async ([code, key]) => {
        const res = await fetch(`${apiBase}/${code}/teams`);
        const data = await res.json();
        const leagueData = data.sports?.[0]?.leagues?.[0];
        const teams = leagueData?.teams || [];
        // For NBA: try to get conference groups from the response
        const groups = leagueData?.groups || [];
        return teams.map(t => {
          // Try to find conference for the team
          let conference = '';
          if (selectedSport === 'basketball' && groups.length > 0) {
            for (const g of groups) {
              if (g.teams?.some(gt => gt.id === t.team.id || gt.$ref?.includes(t.team.id))) {
                conference = g.name || g.abbreviation || '';
                break;
              }
            }
          }
          return {
            id: t.team.id,
            name: t.team.displayName,
            logo: t.team.logos?.[0]?.href,
            league: leagueNames[key] || 'League',
            leagueCode: code,
            tagline: t.team.shortDisplayName,
            conference: conference || (t.team.groups?.name || ''),
            formation: selectedSport === 'soccer' ? '4-3-3' : (t.team.location || sportConfig.label),
            style: selectedSport === 'soccer' ? 'Modern' : 'Elite',
            description: t.team.description || `${t.team.displayName} is a top ${sportConfig.label.toLowerCase()} team.`,
            trophies: selectedSport === 'soccer' ? ['League Winner', 'Cup Winner', 'Continental Trophy'] : ['League Winner', 'Playoff Contender', 'Historic Team'],
            lineup: [],
            history: `${t.team.displayName} competes in ${leagueNames[key] || 'its league'} and is tracked live from ESPN data feeds.`,
            legends: ['Icon 1', 'Icon 2']
          };
        });
      });
      const results = await Promise.all(teamPromises);
      setAllClubs(results.flat());
    } catch (e) {
      console.error('Club fetch error:', e);
    }
  }, [apiBase, leagues, leagueNames, selectedSport, sportConfig.label]);

  const getSportData = useCallback(async (sportKey) => {
    const clubs = await fetchClubsForSport(sportKey);
    const players = sportKey === 'soccer' ? PLAYERS_DATA : (EXTRA_SPORT_PLAYERS[sportKey] || []);
    return { clubs, players };
  }, []);

  const fetchUCLKnockoutMatches = useCallback(async () => {
    if (selectedSport !== 'soccer') return;
    try {
      // Fetch UCL matches for the entire season (Aug to June)
      const seasonStart = new Date();
      seasonStart.setMonth(7); // August
      seasonStart.setDate(1);
      if (new Date().getMonth() < 7) {
        seasonStart.setFullYear(seasonStart.getFullYear() - 1);
      }
      const seasonEnd = new Date();
      seasonEnd.setMonth(5); // June
      seasonEnd.setDate(30);
      if (new Date().getMonth() < 7) {
        seasonEnd.setFullYear(seasonEnd.getFullYear());
      } else {
        seasonEnd.setFullYear(seasonEnd.getFullYear() + 1);
      }

      const datesParam = `${seasonStart.toISOString().slice(0, 10).replace(/-/g, '')}-${seasonEnd.toISOString().slice(0, 10).replace(/-/g, '')}`;
      const res = await fetch(`${apiBase}/uefa.champions/scoreboard?dates=${datesParam}&limit=500`);
      const data = await res.json();

      const uclMatches = (data.events || []).map(event => {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');

        const matchDate = new Date(event.date);
        const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return {
          id: event.id,
          leagueCode: 'uefa.champions',
          league: 'UEFA Champions League',
          home: home.team.displayName,
          away: away.team.displayName,
          homeScore: home.score || '0',
          awayScore: away.score || '0',
          time: `${dateStr} ${timeStr}`,
          rawDate: event.date,
          isLive: event.status.type.state === 'in',
          isCompleted: event.status.type.state === 'post',
          status: event.status.type.shortDetail,
          statusDetail: event.status.type.detail,
          homeLogo: home.team.logo,
          awayLogo: away.team.logo,
          winner: home.winner ? 'home' : (away.winner ? 'away' : null),
          round: event.season?.slug || event.season?.type?.name || comp.notes?.[0]?.text || '',
          leg: comp.leg?.displayValue || ''
        };
      });

      setUclKnockoutMatches(uclMatches);
    } catch (e) {
      console.error('UCL knockout fetch error:', e);
    }
  }, [apiBase, selectedSport]);

  const fetchCricketKnockoutMatches = useCallback(async (leagueKey, code, seasonYearParam = null) => {
    if (selectedSport !== 'cricket' || !code) return;
    const currentYear = new Date().getFullYear();
    const t20Years = leagueKey === 't20wc' ? getCricketSeasonYears('t20wc') : [];
    const year = seasonYearParam != null ? seasonYearParam : (leagueKey === 't20wc' ? (t20Years[0] ?? currentYear) : currentYear);

    try {
      // T20 WC past editions: use curated fallback (ESPN often has no/incomplete data). Current/future: try API first.
      if (leagueKey === 't20wc' && year < currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
        const finalMatches = fallbackKnockout.length > 0
          ? fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }))
          : [];
        setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
        return;
      }

      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const datesParam = `${start.toISOString().slice(0, 10).replace(/-/g, '')}-${end.toISOString().slice(0, 10).replace(/-/g, '')}`;
      const res = await fetch(`${apiBase}/${code}/scoreboard?dates=${datesParam}&limit=200`);
      if (!res.ok) {
        if (leagueKey === 't20wc' && year <= currentYear) {
          const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
          if (fallbackKnockout.length > 0) {
            const finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
            setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
          } else setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: [] }));
        } else setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: [] }));
        return;
      }
      const data = await res.json().catch(() => ({}));
      const events = data.events || [];
      const knockoutKeywords = /Final|Semi|Qualifier|Eliminator|Playoff|playoff|knockout|Semi-Final|Quarter-Final/i;
      let knockoutEvents = events.filter(ev => {
        const comp = ev.competitions?.[0];
        const desc = (comp?.description || '') + (comp?.shortDescription || '');
        return comp && knockoutKeywords.test(desc);
      });
      // Only keep events in the selected year (API can return other years)
      knockoutEvents = knockoutEvents.filter(ev => new Date(ev.date).getFullYear() === year);

      const mapped = knockoutEvents.map(event => {
        const comp = event.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0];
        const away = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1];
        const matchDate = new Date(event.date);
        const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const roundLabel = comp?.description || comp?.shortDescription || '';
        const isPost = event.status?.type?.state === 'post';
        return {
          id: event.id,
          leagueCode: code,
          league: leagueNames[leagueKey] || 'Cricket',
          home: home?.team?.displayName || 'TBD',
          away: away?.team?.displayName || 'TBD',
          homeScore: (isPost || home?.score) ? (home?.score || '0') : '–',
          awayScore: (isPost || away?.score) ? (away?.score || '0') : '–',
          time: `${dateStr} ${timeStr}`,
          rawDate: event.date,
          isLive: event.status?.type?.state === 'in',
          isCompleted: isPost,
          status: event.status?.type?.shortDetail || '',
          statusDetail: event.status?.type?.detail || '',
          homeLogo: home?.team?.logo || home?.team?.logos?.[0]?.href || FALLBACK_TEAM_LOGO,
          awayLogo: away?.team?.logo || away?.team?.logos?.[0]?.href || FALLBACK_TEAM_LOGO,
          winner: home?.winner === 'true' || home?.winner === true ? 'home' : (away?.winner === 'true' || away?.winner === true ? 'away' : null),
          round: roundLabel
        };
      });
      let finalMatches = mapped;
      if (mapped.length === 0 && year <= currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, year);
        if (fallbackKnockout.length > 0) {
          finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
        }
      }
      setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
    } catch (e) {
      console.error('Cricket knockout fetch error:', e);
      const fallbackYear = seasonYearParam ?? (leagueKey === 't20wc' ? (getCricketSeasonYears('t20wc')[0]) : currentYear);
      if (leagueKey === 't20wc' && fallbackYear <= currentYear) {
        const fallbackKnockout = getCricketKnockoutFallback(leagueKey, fallbackYear);
        if (fallbackKnockout.length > 0) {
          const finalMatches = fallbackKnockout.map(m => ({ ...m, league: leagueNames[leagueKey] || 'Cricket', leagueCode: code }));
          setCricketKnockoutMatches(prev => ({ ...prev, [leagueKey]: finalMatches }));
        }
      }
    }
  }, [apiBase, selectedSport, leagueNames]);

  const fetchClubRoster = async (club) => {
    try {
      const res = await fetch(`${apiBase}/${club.leagueCode}/teams/${club.id}/roster`);
      const data = await res.json();
      const squad = (data.athletes || []).map(a => `${a.position.abbreviation}: ${a.displayName}`);
      setSelectedClub({ ...club, lineup: squad.slice(0, 18) });
    } catch (e) {
      console.error('Roster fetch error:', e);
      setSelectedClub(club);
    }
  };

  const fetchSportPlayers = useCallback(async () => {
    const { primary, secondary } = PLAYER_STATS_BY_SPORT[selectedSport] || PLAYER_STATS_BY_SPORT.soccer;
    const headshotFn = SPORT_HEADSHOT_FN[selectedSport] || getHeadshot;
    const normalizeAthlete = (athlete, teamName, teamLogo, leagueLogo) => {
      const source = athlete?.athlete || athlete;
      const displayName = source?.displayName || source?.fullName || 'Unknown Athlete';
      // Use the same source's id for both identity and headshot so name and picture always match
      const rawId = source?.id ?? athlete?.id ?? athlete?.uid ?? `${teamName}-${displayName}-${Math.random()}`;
      const numericId = Number(rawId);
      const safeId = Number.isNaN(numericId) ? rawId : numericId;
      // Prefer API headshot from this athlete, then build ESPN headshot from this athlete's id only
      const apiHeadshot = source?.headshot?.href || source?.images?.[0]?.href;
      const espnHeadshot = (typeof safeId === 'number' && safeId > 0) ? headshotFn(safeId) : null;
      return {
        id: safeId,
        name: displayName,
        club: teamName || source?.team?.displayName || sportConfig.label,
        position: source?.position?.abbreviation || source?.position?.displayName || 'Athlete',
        rating: source?.rating || '-',
        goals: source?.statistics?.[0]?.displayValue || source?.statistics?.[0]?.value || '-',
        assists: source?.statistics?.[1]?.displayValue || source?.statistics?.[1]?.value || '-',
        image: apiHeadshot || espnHeadshot || FALLBACK_PLAYER_IMAGE,
        leagueLogo: leagueLogo || null,
        age: source?.age || '-',
        height: source?.displayHeight || '-',
        weight: source?.displayWeight || '-',
        career: [teamName || source?.team?.displayName || sportConfig.label],
        trophies: [],
        achievements: [],
        primaryStatLabel: primary,
        secondaryStatLabel: secondary
      };
    };

    try {
      // F1: Extract drivers from standings since /racing/f1/teams returns empty
      if (selectedSport === 'f1') {
        try {
          const res = await fetch(`${standingsBase}/f1/standings`);
          const data = await res.json();
          const driverEntries = data.children?.[0]?.standings?.entries || [];
          const drivers = driverEntries.map(entry => {
            const driverId = Number(entry.athlete?.id);
            const pts = entry.stats?.find(s => s.abbreviation === 'PTS')?.displayValue || '0';
            const rank = entry.stats?.find(s => s.abbreviation === 'RK')?.displayValue || '-';
            return {
              id: driverId || entry.athlete?.id,
              name: entry.athlete?.displayName || 'Driver',
              club: 'Formula 1',
              position: 'Driver',
              rating: rank,
              goals: pts,
              assists: '-',
              image: getF1Headshot(driverId),
              age: '-',
              height: '-',
              weight: '-',
              career: ['F1'],
              trophies: [],
              achievements: [],
              primaryStatLabel: 'Points',
              secondaryStatLabel: 'Rank'
            };
          });
          if (drivers.length > 0) {
            setSportPlayers(drivers);
            return;
          }
        } catch (_e) { /* fall through to static data */ }
        setSportPlayers([]);
        return;
      }

      // Cricket: Extract players from scoreboard featured athletes or use static data
      // The /cricket/{id}/teams endpoint returns empty, so skip team/roster fetching
      if (selectedSport === 'cricket') {
        // We'll rely on static EXTRA_SPORT_PLAYERS data which is already good
        setSportPlayers([]);
        return;
      }

      // Deduplicate league codes for player fetching
      const uniquePlayerLeagues = {};
      Object.entries(leagues).forEach(([key, code]) => {
        if (!uniquePlayerLeagues[code]) uniquePlayerLeagues[code] = key;
      });
      const teamResponses = await Promise.all(
        Object.entries(uniquePlayerLeagues).map(async ([code, key]) => {
          const res = await fetch(`${apiBase}/${code}/teams`);
          const data = await res.json();
          const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
          return teams.map((t) => ({
            leagueCode: code,
            teamId: t.team.id,
            name: t.team.displayName,
            logo: t.team.logos?.[0]?.href || leagueLogos[key] || FALLBACK_TEAM_LOGO,
            leagueLogo: leagueLogos[key] || null
          }));
        })
      );

      const allTeams = teamResponses.flat().slice(0, selectedSport === 'soccer' ? 20 : (selectedSport === 'basketball' ? 30 : 14));
      let fetchedPlayers = [];

      if (allTeams.length > 0) {
        const rosterResponses = await Promise.all(
          allTeams.map(async (team) => {
            try {
              const res = await fetch(`${apiBase}/${team.leagueCode}/teams/${team.teamId}/roster`);
              const data = await res.json();
              // ESPN roster response can be flat or grouped by position
              let athletes = data.athletes || data.team?.athletes || [];
              // If athletes are grouped by position (e.g. NFL), flatten them
              if (athletes.length > 0 && athletes[0]?.items) {
                athletes = athletes.flatMap((group) => group.items || []);
              }
              return athletes.map((a) => normalizeAthlete(a, team.name, team.logo, team.leagueLogo));
            } catch (_err) {
              return [];
            }
          })
        );
        fetchedPlayers = rosterResponses.flat();
      }

      if (fetchedPlayers.length === 0) {
        const athleteResponses = await Promise.all(
          Object.entries(uniquePlayerLeagues).map(async ([code, key]) => {
            try {
              const res = await fetch(`${apiBase}/${code}/athletes?limit=200`);
              const data = await res.json();
              const athletes = data.athletes || data.sports?.[0]?.leagues?.[0]?.athletes || [];
              return athletes.map((a) => normalizeAthlete(a, leagueNames[key], leagueLogos[key], leagueLogos[key]));
            } catch (_err) {
              return [];
            }
          })
        );
        fetchedPlayers = athleteResponses.flat();
      }

      const deduped = fetchedPlayers.reduce((acc, p) => {
        if (!acc.some((x) => String(x.id) === String(p.id))) acc.push(p);
        return acc;
      }, []);
      setSportPlayers(deduped.slice(0, 160));
    } catch (e) {
      console.error('Player fetch error:', e);
    }
  }, [selectedSport, sportConfig.label, leagues, apiBase, leagueNames, leagueLogos, standingsBase]);

  useEffect(() => {
    fetchAllClubs();
  }, [fetchAllClubs]);

  useEffect(() => {
    fetchSportPlayers();
    const interval = setInterval(fetchSportPlayers, 30000);
    return () => clearInterval(interval);
  }, [fetchSportPlayers]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  useEffect(() => {
    if (leagueNames[currentTab]) {
      const seasonParam = selectedSport === 'cricket' ? cricketSeasonYear : undefined;
      fetchTable(currentTab, false, seasonParam);
      const interval = setInterval(() => fetchTable(currentTab, true, selectedSport === 'cricket' ? cricketSeasonYear : undefined), 1000);
      return () => clearInterval(interval);
    }
  }, [currentTab, fetchTable, leagueNames, selectedSport, cricketSeasonYear]);

  // Reset cricket season when switching to a league that doesn't have that year
  useEffect(() => {
    if (selectedSport !== 'cricket' || cricketSeasonYear == null) return;
    const validYears = getCricketSeasonYears(currentTab);
    if (validYears.indexOf(cricketSeasonYear) === -1) setCricketSeasonYear(null);
  }, [selectedSport, currentTab, cricketSeasonYear]);

  // Fetch data based on tab
  useEffect(() => {
    if (currentTab === 'ucl' && uclTab === 'knockout') {
      fetchUCLKnockoutMatches();
    }
  }, [currentTab, uclTab, fetchUCLKnockoutMatches]);

  useEffect(() => {
    if (selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && cricketTab === 'knockout') {
      const code = leagues[currentTab];
      fetchCricketKnockoutMatches(currentTab, code, cricketSeasonYear);
    }
  }, [selectedSport, currentTab, cricketTab, leagues, cricketSeasonYear, fetchCricketKnockoutMatches]);

  // Filtering
  const filteredMatches = useMemo(() => {
    let list = matches;
    if (currentTab !== 'live' && leagueNames[currentTab]) {
      list = matches.filter(m => m.league === leagueNames[currentTab]);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || m.league.toLowerCase().includes(q));
    }
    return list;
  }, [matches, currentTab, search, leagueNames]);

  const fallbackPlayersForSport = useMemo(
    () => (selectedSport === 'soccer' ? PLAYERS_DATA : (EXTRA_SPORT_PLAYERS[selectedSport] || [])),
    [selectedSport]
  );

  const playersForCurrentSport = useMemo(
    () => (selectedSport === 'soccer'
      ? PLAYERS_DATA
      : (sportPlayers.length > 0 ? sportPlayers : fallbackPlayersForSport)),
    [selectedSport, sportPlayers, fallbackPlayersForSport]
  );

  const allPlayersIndex = useMemo(() => {
    const merged = [...PLAYERS_DATA, ...Object.values(EXTRA_SPORT_PLAYERS).flat(), ...sportPlayers];
    return merged.reduce((acc, p) => {
      if (!acc.some((x) => String(x.id) === String(p.id))) acc.push(p);
      return acc;
    }, []);
  }, [sportPlayers]);

  const playerFilterOptions = useMemo(() => {
    const sportPositions = [...new Set(playersForCurrentSport.map((p) => p.position).filter(Boolean))];
    return ['all', ...sportPositions.slice(0, 8)];
  }, [playersForCurrentSport]);

  const getPositionClass = (league, pos) => {
    const p = parseInt(pos, 10);
    if (selectedSport === 'cricket') {
      if (p === 1) return 'league-winner';
      return '';
    }
    if (selectedSport !== 'soccer') return '';
    if (league === 'ucl') {
      if (p <= 8) return 'ucl-direct';
      if (p <= 24) return 'ucl-playoff';
      return 'ucl-out';
    }
    if (league === 'pl') {
      if (p === 1) return 'league-winner';
      if (p <= 4) return 'ucl-qualify';
      if (p >= 18) return 'relegation';
    }
    if (league === 'laliga' || league === 'seriea' || league === 'bundesliga') {
      if (p === 1) return 'league-winner';
      if (p <= 4) return 'ucl-qualify';
      if (p >= 18) return 'relegation';
    }
    if (league === 'ligue1') {
      if (p === 1) return 'league-winner';
      if (p <= 3) return 'ucl-qualify';
      if (p >= 16) return 'relegation';
    }
    if (league === 'eredivisie') {
      if (p === 1) return 'league-winner';
      if (p === 2) return 'ucl-direct';
      if (p === 3) return 'ucl-qualify';
      if (p === 4) return 'uel-qualify';
      if (p <= 8) return 'uecl';
      if (p === 16) return 'ucl-playoff'; // Using purple for relegation PO
      if (p >= 17) return 'relegation';
    }
    return '';
  };

  const filteredPlayers = useMemo(() => {
    let list = playersForCurrentSport;
    if (playerFilter !== 'all') {
      list = list.filter(p => p.position === playerFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q));
    }
    return list;
  }, [playerFilter, search, playersForCurrentSport]);

  const filteredClubs = useMemo(() => {
    let list = allClubs.length > 0 ? allClubs : TACTICS_DATA;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, allClubs]);

  const managedClubs = useMemo(() => {
    if (!manageSearch) return allClubs;
    const q = manageSearch.toLowerCase();
    return allClubs.filter(c => c.name.toLowerCase().includes(q));
  }, [manageSearch, allClubs]);

  // --- Render Sections ---

  const renderSection = () => {
    switch (currentTab) {
      case 'live':
      case 'ucl':
      case 'pl':
      case 'laliga':
      case 'bundesliga':
      case 'seriea':
      case 'ligue1':
      case 'eredivisie':
      case 'nba':
      case 'nfl':
      case 'mlb':
      case 'nhl':
      case 'ipl':
      case 'bbl':
      case 'psl':
      case 'ilt20':
      case 'sa20':
      case 't20wc':
      case 'ranji':
      case 'sheffield':
      case 'county':
      case 'icc_test':
      case 'f1':
        if (featureFlags.live_scores === false) {
          return (
            <section key="live-disabled" className="content-section active">
              <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>Live scores are currently disabled.</p>
            </section>
          );
        }
        return (
          <section key={currentTab} className="content-section active">
            <div className="live-ticker">
              <div className="ticker-item">{tickerText}</div>
            </div>

            {/* Date Navigator & Calendar */}
            <div className="date-navigator-container">
              <button className="nav-arrow-btn" onClick={() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                dateObj.setDate(dateObj.getDate() - 1);
                const newDate = getLocalISODate(dateObj); // Ensure we get the local represention string
                setSelectedDate(newDate);
              }}>
                <span className="material-icons-round">chevron_left</span>
              </button>

              <div className="date-trigger-btn" onClick={() => setShowCalendar(!showCalendar)}>
                <span className="material-icons-round" style={{ fontSize: '18px', color: 'var(--highlight)' }}>event</span>
                <span className="current-date-label">
                  {(() => {
                    const todayStr = getLocalISODate();
                    const [ty, tm, td] = todayStr.split('-').map(Number);
                    const todayDate = new Date(ty, tm - 1, td);

                    const [sy, sm, sd] = selectedDate.split('-').map(Number);
                    const selDate = new Date(sy, sm - 1, sd);

                    // Check exact day difference
                    const diffTime = selDate - todayDate;
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) return `Today, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                    if (diffDays === -1) return `Yesterday, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                    if (diffDays === 1) return `Tomorrow, ${selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

                    return selDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
                  })()}
                </span>
                <span className="material-icons-round expand-icon">expand_more</span>
              </div>

              <button className="nav-arrow-btn" onClick={() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                dateObj.setDate(dateObj.getDate() + 1);
                const newDate = getLocalISODate(dateObj);
                setSelectedDate(newDate);
              }}>
                <span className="material-icons-round">chevron_right</span>
              </button>

              {/* Calendar Popover */}
              {showCalendar && (
                <div className="calendar-popover animate-in">
                  <div className="calendar-header">
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() - 1))); }}>&lt;</button>
                    <span>{calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() + 1))); }}>&gt;</button>
                  </div>
                  <div className="calendar-grid">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
                    {(() => {
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const days = [];
                      const todayStr = getLocalISODate();

                      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
                      for (let i = 1; i <= daysInMonth; i++) {
                        // Construct local date string YYYY-MM-DD safely
                        const mStr = String(month + 1).padStart(2, '0');
                        const dStr = String(i).padStart(2, '0');
                        const isoDate = `${year}-${mStr}-${dStr}`;

                        const isSelected = selectedDate === isoDate;
                        const isToday = todayStr === isoDate;

                        days.push(
                          <div
                            key={i}
                            className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => { setSelectedDate(isoDate); setShowCalendar(false); }}
                          >
                            {i}
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>
                  {/* Close button inside popover for mobile friendliness */}
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <button onClick={() => setShowCalendar(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '12px' }}>Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Overlay for Calendar (Click outside to close) */}
            {showCalendar && <div className="fixed-overlay" onClick={() => setShowCalendar(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}

            {leagueNames[currentTab] && (
              <div className="section-header-pro">
                <h3>
                  <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                  {selectedSport === 'cricket' && leagueLogos[currentTab] && (
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="" className="section-header-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  {selectedSport === 'f1' ? 'Race Center' : selectedSport === 'cricket' ? 'Cricket Center' : 'Match Center'}
                </h3>
                {Math.ceil(filteredMatches.length / getPageSize('matches')) > 1 && (
                  <Pagination
                    current={page}
                    total={Math.ceil(filteredMatches.length / getPageSize('matches'))}
                    onPageChange={setPage}
                  />
                )}
                {selectedSport === 'soccer' && currentTab === 'ucl' && (
                  <div className="toggle-tabs">
                    <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                    <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                  </div>
                )}
                {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                  <div className="toggle-tabs">
                    <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                    <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                  </div>
                )}
                {selectedSport === 'basketball' && currentTab === 'nba' && (
                  <div className="conference-sub-tabs">
                    <button className={`conference-tab ${nbaConferenceTab === 'east' ? 'active' : ''}`} onClick={() => setNbaConferenceTab('east')}>Eastern Conference</button>
                    <button className={`conference-tab ${nbaConferenceTab === 'west' ? 'active' : ''}`} onClick={() => setNbaConferenceTab('west')}>Western Conference</button>
                  </div>
                )}
              </div>
            )}

            <div className="matches-grid">
              {filteredMatches.length > 0 ? (
                filteredMatches
                  .slice((page - 1) * getPageSize('matches'), page * getPageSize('matches'))
                  .map(m => <MatchCard key={m.id} match={m} favorites={favorites} toggleFavorite={toggleFavorite} onOpen={fetchMatchDetails} showFavorite={featureFlags.favorites !== false} />)
              ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', width: '100%' }}>
                  {search ? 'No matches found for this search.' : 'No matches found for this date.'}
                </div>
              )}
            </div>

            <Pagination
              current={page}
              total={Math.ceil(filteredMatches.length / getPageSize('matches'))}
              onPageChange={setPage}
            />

            {/* Cricket: season selector from league start year (or T20 WC edition years only) */}
            {selectedSport === 'cricket' && leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (!CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && (
              <div className="cricket-season-selector">
                <div className="cricket-season-selector-inner">
                  <span className="cricket-season-selector-icon material-icons-round" aria-hidden="true">calendar_today</span>
                  <label htmlFor="cricket-season-select" className="cricket-season-selector-label">Season</label>
                  <select
                    id="cricket-season-select"
                    className="cricket-season-selector-select"
                    value={cricketSeasonYear ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const year = val === '' ? null : parseInt(val, 10);
                      setCricketSeasonYear(year);
                      fetchTable(currentTab, true, year);
                    }}
                    aria-label="Select cricket season"
                  >
                    <option value="">Current</option>
                    {(() => {
                      const years = getCricketSeasonYears(currentTab);
                      return years.map(y => <option key={y} value={y}>{y}</option>);
                    })()}
                  </select>
                  <span className="cricket-season-selector-hint">
                    <span className="material-icons-round" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: 4 }}>refresh</span>
                    Live · refreshes every second
                  </span>
                </div>
              </div>
            )}

            {/* Conference-based standings: NBA shows one table per sub-tab; NFL/NHL/MLB show all */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && tables[currentTab]?.conferences?.length > 0 && (
              (() => {
                const conferences = tables[currentTab].conferences;
                // NBA: show only the selected conference (Eastern = index 0, Western = index 1)
                const toShow = selectedSport === 'basketball' && currentTab === 'nba'
                  ? [conferences[nbaConferenceTab === 'east' ? 0 : 1]].filter(Boolean)
                  : conferences;
                return toShow.map((conf, ci) => (
                  <div key={`${ci}-${tables[currentTab]?.seasonYear ?? ''}`} className="table-container fade-in" style={{ marginTop: ci === 0 ? '50px' : '30px' }}>
                    <div className="league-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                          {conf.name || `Conference ${ci + 1}`}
                          {tables[currentTab].seasonYear && (
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Pos</th><th>Team</th>
                          {conf.columns.map((col) => <th key={col}>{col}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {conf.rows.map((row, i) => (
                          <tr key={i} className={`animate-in ${getPositionClass(currentTab, row.pos)}`} style={{ animationDelay: `${i * 0.03}s` }}>
                            <td className="pos-cell">{row.pos}</td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                              <img loading="lazy" decoding="async" src={row.logo} style={{ width: '24px', height: '24px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                              <span className="team-name">{row.team}</span>
                              {featureFlags.favorites !== false && (
                                <span className={`material-icons-round fav-star ${favorites.includes(row.team) ? 'active' : ''}`} onClick={() => toggleFavorite(row.team)}>
                                  {favorites.includes(row.team) ? 'star' : 'star_border'}
                                </span>
                              )}
                            </td>
                            {conf.columns.map((col) => (
                              <td key={`${row.team}-${col}`}>{row.values?.[col] ?? '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()
            )}

            {/* Single-conference standings (Soccer, Cricket, F1) */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && !tables[currentTab]?.conferences?.length && tables[currentTab]?.rows?.length > 0 && (
              <div key={`standings-${currentTab}-${tables[currentTab]?.seasonYear ?? 'current'}`} className="table-container fade-in" style={{ marginTop: '50px' }}>
                <div className="league-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {leagueNames[currentTab]} Standings
                      {tables[currentTab].seasonYear && (
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                      )}
                    </h3>
                  </div>
                  {selectedSport === 'soccer' && currentTab === 'ucl' && uclTab === 'league' && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                      <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                    </div>
                  )}
                  {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  )}
                </div>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Pos</th><th>{selectedSport === 'f1' ? 'Driver' : 'Team'}</th>
                      {tables[currentTab].columns.map((col) => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tables[currentTab].rows.map((row, i) => (
                      <tr key={i} className={`animate-in ${getPositionClass(currentTab, row.pos)}`} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="pos-cell">{row.pos}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                          <img loading="lazy" decoding="async" src={row.logo} style={{ width: '24px', height: '24px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                          <span className="team-name">{row.team}</span>
                          {featureFlags.favorites !== false && (
                            <span className={`material-icons-round fav-star ${favorites.includes(row.team) ? 'active' : ''}`} onClick={() => toggleFavorite(row.team)}>
                              {favorites.includes(row.team) ? 'star' : 'star_border'}
                            </span>
                          )}
                        </td>
                        {tables[currentTab].columns.map((col) => (
                          <td key={`${row.team}-${col}`}>{row.values?.[col] ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-legend">
                  {selectedSport === 'soccer' && currentTab === 'ucl' ? (
                    <>
                      <div className="legend-item"><span className="dot ucl-direct"></span> Direct Round of 16</div>
                      <div className="legend-item"><span className="dot ucl-playoff"></span> Knockout Playoffs</div>
                      <div className="legend-item"><span className="dot ucl-out"></span> Eliminated</div>
                    </>
                  ) : selectedSport === 'soccer' && currentTab === 'eredivisie' ? (
                    <>
                      <div className="legend-item"><span className="dot winner"></span> Champion / UCL</div>
                      <div className="legend-item"><span className="dot ucl"></span> UCL Qualifiers</div>
                      <div className="legend-item"><span className="dot uel"></span> Europa League</div>
                      <div className="legend-item"><span className="dot uecl"></span> Conference PO</div>
                      <div className="legend-item"><span className="dot playoff"></span> Relegation Play-off</div>
                      <div className="legend-item"><span className="dot relegation"></span> Direct Relegation</div>
                    </>
                  ) : selectedSport === 'cricket' ? (
                    <>
                      <div className="legend-item"><span className="dot ucl"></span> M = Matches · W = Won · L = Lost · N/R = No Result · NRR = Net Run Rate · PT = Points</div>
                      <div className="legend-item" style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>Standings: ESPN live; historical seasons (from 2008) use fallback data when ESPN has no stats.</div>
                    </>
                  ) : (
                    <div className="legend-item"><span className="dot ucl"></span> Live data from ESPN standings feed</div>
                  )}
                </div>
              </div>
            )}

            {/* League table section with season but no rows yet (e.g. PSL before season starts) */}
            {leagueNames[currentTab] && (currentTab !== 'ucl' || uclTab === 'league') && (selectedSport !== 'cricket' || !CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) || cricketTab === 'league') && tables[currentTab] && !tables[currentTab]?.conferences?.length && !(tables[currentTab]?.rows?.length > 0) && tables[currentTab].seasonYear && (
              <div className="table-container fade-in" style={{ marginTop: '50px' }}>
                <div className="league-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <img loading="lazy" decoding="async" src={leagueLogos[currentTab]} alt="logo" className="league-brand-logo" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                      {leagueNames[currentTab]} Standings
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 6 }}>— {tables[currentTab].seasonYear}</span>
                    </h3>
                  </div>
                  {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && (
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted, #94a3b8)', padding: '24px 0', margin: 0 }}>Table not yet available for this season. Standings will appear when the competition starts.</p>
              </div>
            )}

            {
              selectedSport === 'soccer' && currentTab === 'ucl' && uclTab === 'knockout' && (
                <div className="knockout-bracket fade-in" style={{ marginTop: '40px' }}>
                  <div className="league-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Champions League Knockout Stage</h3>
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${uclTab === 'league' ? 'active' : ''}`} onClick={() => setUclTab('league')}>League Phase</button>
                      <button className={`toggle-btn ${uclTab === 'knockout' ? 'active' : ''}`} onClick={() => setUclTab('knockout')}>Knockout</button>
                    </div>
                  </div>
                  {isMobile && (
                    <div className="swipe-hint">
                      <span className="material-icons-round">swipe</span> Swipe to explore bracket
                    </div>
                  )}
                  <div className="bracket-container">
                    <div className="bracket-grid">
                      {/* Play-Offs */}
                      <div className="bracket-round">
                        <h4 className="round-title">PLAY-OFFS</h4>
                        <div className="round-matches playoff-offset">
                          {(() => {
                            const playoffMatches = uclKnockoutMatches.filter(m =>
                              m.round?.includes('Playoff') || m.round?.includes('Play-off') || m.status?.includes('Play-off') || m.round?.includes('knockout-round-playoffs')
                            );
                            if (playoffMatches.length === 0) {
                              return Array(8).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card">
                                  <div className="placeholder-team">TBD</div>
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return playoffMatches.slice(0, 8).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                  {match.leg && <span className="leg-tag">{match.leg}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                                {match.isCompleted && <div className="match-status-mini">{match.statusDetail?.replace(/Final/i, 'FT') || 'FT'}</div>}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Round of 16 */}
                      <div className="bracket-round">
                        <h4 className="round-title">ROUND OF 16</h4>
                        <div className="round-matches r16-offset">
                          {(() => {
                            const r16Matches = uclKnockoutMatches.filter(m => m.round?.includes('Round of 16') || m.round?.includes('round-of-16'));
                            if (r16Matches.length === 0) {
                              return Array(8).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card">
                                  <div className="placeholder-team">TBD</div>
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return r16Matches.slice(0, 8).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                  {match.leg && <span className="leg-tag">{match.leg}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Quarter Finals */}
                      <div className="bracket-round">
                        <h4 className="round-title">QUARTER FINALS</h4>
                        <div className="round-matches qf-offset">
                          {(() => {
                            const qfMatches = uclKnockoutMatches.filter(m => m.round?.includes('Quarterfinal') || m.round?.includes('Quarter Final') || m.round?.includes('quarter-finals'));
                            if (qfMatches.length === 0) {
                              return Array(4).fill(null).map((_, i) => (
                                <div key={i} className="bracket-match-card placeholder-card qf-height-fix">
                                  <div className="placeholder-team">TBD</div>
                                </div>
                              ));
                            }
                            return qfMatches.slice(0, 4).map((match, i) => (
                              <div key={i} className="qf-wrapper">
                                <div className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                  <div className="match-meta">
                                    {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                    {match.leg && <span className="leg-tag">{match.leg}</span>}
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                    </div>
                                    <span className="score-mini">{match.homeScore}</span>
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                    </div>
                                    <span className="score-mini">{match.awayScore}</span>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Semi Finals */}
                      <div className="bracket-round">
                        <h4 className="round-title">SEMI FINALS</h4>
                        <div className="round-matches sf-offset">
                          {(() => {
                            const sfMatches = uclKnockoutMatches.filter(m => m.round?.includes('Semifinal') || m.round?.includes('Semi Final') || m.round?.includes('semi-finals'));
                            if (sfMatches.length === 0) {
                              return Array(2).fill(null).map((_, i) => (
                                <div key={i} className="sf-wrapper">
                                  <div className="bracket-match-card placeholder-card">
                                    <div className="placeholder-team">TBD</div>
                                  </div>
                                </div>
                              ));
                            }
                            return sfMatches.slice(0, 2).map((match, i) => (
                              <div key={i} className="sf-wrapper">
                                <div className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                  <div className="match-meta">
                                    {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                    {match.leg && <span className="leg-tag">{match.leg}</span>}
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                    </div>
                                    <span className="score-mini">{match.homeScore}</span>
                                  </div>
                                  <div className="team-row">
                                    <div className="team-info-mini">
                                      <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                      <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                    </div>
                                    <span className="score-mini">{match.awayScore}</span>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Final */}
                      <div className="bracket-round">
                        <h4 className="round-title final-title"><span className="material-icons-round" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> FINAL</h4>
                        <div className="round-matches final-offset">
                          {(() => {
                            const finalMatch = uclKnockoutMatches.find(m => (m.round?.includes('Final') || m.round === 'final') && !m.round?.includes('Quarter') && !m.round?.includes('Semi') && !m.round?.includes('Playoff'));
                            if (!finalMatch) {
                              return (
                                <div className="bracket-match-card final-placeholder">
                                  <div className="final-icon"><span className="material-icons-round">emoji_events</span></div>
                                  <div className="final-label">CHAMPION</div>
                                  <div className="final-tbd">TBD</div>
                                </div>
                              );
                            }
                            return (
                              <div className={`bracket-match-card final-match-card ${finalMatch.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(finalMatch)}>
                                <div className="final-meta">
                                  {finalMatch.isLive ? <span className="live-tag-gold">● LIVE FINAL</span> : <span className="time-tag-gold">{finalMatch.time}</span>}
                                </div>
                                <div className="team-row-final">
                                  <div className="team-info-final">
                                    <img loading="lazy" decoding="async" src={finalMatch.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={finalMatch.winner === 'home' ? 'winner-gold' : ''}>{finalMatch.home}</span>
                                  </div>
                                  <span className="score-final">{finalMatch.homeScore}</span>
                                </div>
                                <div className="team-row-final">
                                  <div className="team-info-final">
                                    <img loading="lazy" decoding="async" src={finalMatch.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={finalMatch.winner === 'away' ? 'winner-gold' : ''}>{finalMatch.away}</span>
                                  </div>
                                  <span className="score-final">{finalMatch.awayScore}</span>
                                </div>
                                {finalMatch.isCompleted && <div className="match-status-final">{finalMatch.statusDetail?.replace(/Final/i, 'CHAMPIONS') || 'CHAMPIONS'}</div>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Cricket knockout grid (IPL, BBL, T20WC, ILT20, SA20, PSL) */}
            {selectedSport === 'cricket' && CRICKET_KNOCKOUT_LEAGUES.includes(currentTab) && cricketTab === 'knockout' && (
              <div className="knockout-bracket fade-in cricket-knockout" style={{ marginTop: '40px' }}>
                <div className="league-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <h3>
                    {leagueNames[currentTab]} — Knockout / Playoffs
                    {cricketSeasonYear != null && (
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginLeft: 8 }}>— {cricketSeasonYear}</span>
                    )}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div className="cricket-season-selector" style={{ margin: 0 }}>
                      <div className="cricket-season-selector-inner">
                        <span className="cricket-season-selector-icon material-icons-round" aria-hidden="true">calendar_today</span>
                        <label htmlFor="cricket-season-select-knockout" className="cricket-season-selector-label">Season</label>
                        <select
                          id="cricket-season-select-knockout"
                          className="cricket-season-selector-select"
                          value={cricketSeasonYear ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const year = val === '' ? null : parseInt(val, 10);
                            setCricketSeasonYear(year);
                            fetchCricketKnockoutMatches(currentTab, leagues[currentTab], year);
                          }}
                          aria-label="Select season for knockout"
                        >
                          <option value="">Current</option>
                          {getCricketSeasonYears(currentTab).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="toggle-tabs">
                      <button className={`toggle-btn ${cricketTab === 'league' ? 'active' : ''}`} onClick={() => setCricketTab('league')}>League Table</button>
                      <button className={`toggle-btn ${cricketTab === 'knockout' ? 'active' : ''}`} onClick={() => setCricketTab('knockout')}>Knockout</button>
                    </div>
                  </div>
                </div>
                {isMobile && (
                  <div className="swipe-hint">
                    <span className="material-icons-round">swipe</span> Swipe to explore bracket
                  </div>
                )}
                <div className="bracket-container">
                  <div className="bracket-grid" key={`knockout-${currentTab}-${cricketSeasonYear ?? 'current'}`}>
                    {(() => {
                      const list = cricketKnockoutMatches[currentTab] || [];
                      const byRound = {};
                      list.forEach(m => {
                        const r = m.round || 'Other';
                        if (!byRound[r]) byRound[r] = [];
                        byRound[r].push(m);
                      });
                      const order = ['Qualifier 1', 'Eliminator', 'Qualifier 2', 'Semi-Final 1', 'Semi-Final 2', 'Semi-Final', 'Semi Final', 'Semi 1', 'Semi 2', 'Quarter-Final', 'Final'];
                      const sortedRounds = Object.keys(byRound).sort((a, b) => {
                        const ai = order.findIndex(o => (a || '').toLowerCase().includes(o.toLowerCase()));
                        const bi = order.findIndex(o => (b || '').toLowerCase().includes(o.toLowerCase()));
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return (a || '').localeCompare(b || '');
                      });
                      if (sortedRounds.length === 0) {
                        const isT20wc = currentTab === 't20wc';
                        const year = cricketSeasonYear ?? new Date().getFullYear();
                        const isFutureYear = year > new Date().getFullYear();
                        const message = isT20wc && isFutureYear
                          ? 'Knockout matches will appear when the tournament reaches that stage. Data comes from ESPN.'
                          : 'No knockout matches found for this season. Check back during playoffs. Data is from ESPN when available.';
                        return (
                          <div className="bracket-round" style={{ width: '100%' }}>
                            <h4 className="round-title">Playoffs</h4>
                            <p style={{ color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>{message}</p>
                          </div>
                        );
                      }
                      return sortedRounds.map((roundName) => (
                        <div key={roundName} className="bracket-round">
                          <h4 className="round-title">{roundName.toUpperCase()}</h4>
                          <div className="round-matches">
                            {(byRound[roundName] || []).map((match, i) => (
                              <div key={i} className={`bracket-match-card ${match.isLive ? 'is-live' : ''}`} onClick={() => fetchMatchDetails(match)}>
                                <div className="match-meta">
                                  {match.isLive ? <span className="live-tag">● LIVE</span> : <span className="time-tag">{match.time}</span>}
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'home' ? 'winner' : ''}>{match.home}</span>
                                  </div>
                                  <span className="score-mini">{match.homeScore}</span>
                                </div>
                                <div className="team-row">
                                  <div className="team-info-mini">
                                    <img loading="lazy" decoding="async" src={match.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                    <span className={match.winner === 'away' ? 'winner' : ''}>{match.away}</span>
                                  </div>
                                  <span className="score-mini">{match.awayScore}</span>
                                </div>
                                {match.isCompleted && match.statusDetail && <div className="match-status-mini">{match.statusDetail}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </section >
        );

      case 'news':
        if (featureFlags.news === false) {
          return (
            <section key="news-disabled" className="content-section active">
              <div className="section-header-pro">
                <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>News &amp; Updates is currently disabled.</p>
              </div>
            </section>
          );
        }
        return (
          <section key="news" className="content-section active">
            <div className="section-header-pro">
              <h3>
                <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                Latest Headlines
              </h3>
              <p className="section-header-sub" style={{ marginTop: 4, fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>From league feeds — {Object.values(leagueNames || {}).slice(0, 3).join(', ')}{Object.keys(leagueNames || {}).length > 3 ? ' & more' : ''}</p>
              {Math.ceil(news.length / getPageSize('news')) > 1 && (
                <Pagination
                  current={pageNews}
                  total={Math.ceil(news.length / getPageSize('news'))}
                  onPageChange={setPageNews}
                />
              )}
            </div>
            <div className="news-grid">
              {news
                .slice((pageNews - 1) * getPageSize('news'), pageNews * getPageSize('news'))
                .map((n, i) => (
                  <div key={i} className="news-card animate-in" onClick={() => window.open(n.link, '_blank')}>
                    <img loading="lazy" decoding="async" src={n.image} className="news-image" alt="" onError={(e) => { e.target.src = FALLBACK_NEWS_IMAGE; }} />
                    <div className="news-content">
                      <span className="news-tag">{n.source || n.tag}</span>
                      <h3 className="news-title">{n.title}</h3>
                      <p className="news-excerpt">{n.excerpt}</p>
                    </div>
                  </div>
                ))}
            </div>
            <Pagination
              current={pageNews}
              total={Math.ceil(news.length / getPageSize('news'))}
              onPageChange={setPageNews}
            />
          </section>
        );

      case 'players':
        return (
          <section key="players" className="content-section active players-tab-section">
            <div className="section-header-pro players-section-header">
              <h3>
                <span className="material-icons-round section-header-sport-icon" aria-hidden="true">{sportConfig.icon}</span>
                {selectedSport === 'f1' ? 'Top Drivers' : 'Top Players'}
              </h3>
              {Math.ceil(filteredPlayers.length / getPageSize('players')) > 1 && (
                <Pagination
                  current={pagePlayers}
                  total={Math.ceil(filteredPlayers.length / getPageSize('players'))}
                  onPageChange={setPagePlayers}
                />
              )}
            </div>
            <div className="players-header">
              <div className="filter-tabs">
                {playerFilterOptions.map(f => (
                  <button key={f} className={`filter-btn ${playerFilter === f ? 'active' : ''}`} onClick={() => setPlayerFilter(f)}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="players-grid-wrap">
              {filteredPlayers.length === 0 ? (
                <div className="empty-state-pro players-empty">No players match your search or filter. Try "All" or clear the search.</div>
              ) : (
                <div className="players-grid">
                  {filteredPlayers
                    .slice((pagePlayers - 1) * getPageSize('players'), pagePlayers * getPageSize('players'))
                    .map(p => (
                      <div key={String(p.id)} className="player-card" onClick={() => setSelectedPlayer(p)}>
                        <div className="player-image-container">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={p.image}
                            className="player-image"
                            alt={p.name}
                            onError={(e) => {
                              e.target.src = FALLBACK_PLAYER_IMAGE;
                            }}
                          />
                        </div>
                        <div className="player-stats-mini">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="player-name">{p.name}</div>
                            {featureFlags.favorites !== false && (
                              <span className={`material-icons-round fav-star ${favoritePlayers.includes(p.id) ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavoritePlayer(p.id); }}>
                                {favoritePlayers.includes(p.id) ? 'star' : 'star_border'}
                              </span>
                            )}
                          </div>
                          <div className="player-club-position">
                            {p.leagueLogo && (
                              <img loading="lazy" decoding="async" src={p.leagueLogo} alt="" className="player-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            {p.club} | {p.position}
                          </div>
                          <div className="stats-grid">
                            <div className="stat-item"><span className="stat-val">{p.rating}</span><span className="stat-lbl">OVR</span></div>
                            <div className="stat-item"><span className="stat-val">{p.goals ?? '-'}</span><span className="stat-lbl">{p.primaryStatLabel || 'G'}</span></div>
                            <div className="stat-item"><span className="stat-val">{p.assists ?? '-'}</span><span className="stat-lbl">{p.secondaryStatLabel || 'A'}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {filteredPlayers.length > 0 && (
              <Pagination
                current={pagePlayers}
                total={Math.ceil(filteredPlayers.length / getPageSize('players'))}
                onPageChange={setPagePlayers}
              />
            )}
          </section>
        );

      case 'favorites':
        if (featureFlags.favorites === false) {
          return (
            <section key="favorites-disabled" className="content-section active">
              <p style={{ color: 'var(--text-muted, #94a3b8)', padding: 24 }}>Favorites are currently disabled.</p>
            </section>
          );
        }
        return (
          <section key="favorites" className="content-section active">
            <div className="favorites-header" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800 }}><span className="material-icons-round" style={{ fontSize: 26, verticalAlign: 'middle', marginRight: 8 }}>star</span> My Favorites</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your favorite athletes and teams across {sportConfig.label} competitions.</p>
            </div>

            <div style={{ marginBottom: '50px' }}>
              <h4 className="section-title-pro">Favorite Players</h4>
              <div className="players-grid">
                {allPlayersIndex.filter(p => favoritePlayers.includes(p.id)).length > 0 ? (
                  allPlayersIndex.filter(p => favoritePlayers.includes(p.id))
                    .slice((pageFavPlayers - 1) * getPageSize('players'), pageFavPlayers * getPageSize('players'))
                    .map(p => (
                      <div key={p.id} className="player-card animate-in">
                        <div className="player-image-container">
                          <img loading="lazy" decoding="async" src={p.image} className="player-image" alt={p.name} onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />
                        </div>
                        <div className="player-stats-mini">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="player-name">{p.name}</div>
                            <span className="material-icons-round fav-star active" onClick={() => toggleFavoritePlayer(p.id)}>star</span>
                          </div>
                          <div className="player-club-position">{p.club}</div>
                        </div>
                      </div>
                    ))
                ) : <div className="empty-state-pro">No favorite players yet. Go to "Top Players" to add some!</div>}
              </div>
              <Pagination
                current={pageFavPlayers}
                total={Math.ceil(allPlayersIndex.filter(p => favoritePlayers.includes(p.id)).length / getPageSize('players'))}
                onPageChange={setPageFavPlayers}
              />
            </div>

            <div style={{ marginBottom: '50px' }}>
              <h4 className="section-title-pro">Favorite Teams</h4>
              <div className="matches-grid">
                {allClubs.filter(c => favorites.includes(c.name)).length > 0 ? (
                  allClubs.filter(c => favorites.includes(c.name))
                    .slice((pageFavClubs - 1) * getPageSize('clubs'), pageFavClubs * getPageSize('clubs'))
                    .map(c => (
                      <div key={c.id} className="match-card animate-in stubhub-card-sleek" style={{ padding: '20px', textAlign: 'center' }}>
                        <img loading="lazy" decoding="async" src={c.logo} style={{ width: '80px', height: '80px', marginBottom: '15px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{c.name}</div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>{c.league}</div>
                        <button className="book-btn-minimal" style={{ width: '100%' }} onClick={() => toggleFavorite(c.name)}>Remove Favorite</button>
                      </div>
                    ))
                ) : <div className="empty-state-pro">No favorite clubs yet.</div>}
              </div>
              <Pagination
                current={pageFavClubs}
                total={Math.ceil(allClubs.filter(c => favorites.includes(c.name)).length / getPageSize('clubs'))}
                onPageChange={setPageFavClubs}
              />
            </div>

            <div>
              <h4 className="section-title-pro"><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>public</span> Manage All Teams</h4>
              <div className="search-bar" style={{ marginBottom: '20px', maxWidth: '400px' }}>
                <span className="material-icons-round">search</span>
                <input
                  type="text"
                  placeholder="Find team to favorite..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                />
              </div>
              <div className="matches-grid">
                {managedClubs.length > 0 ? (
                  managedClubs
                    .slice((pageManageClubs - 1) * getPageSize('clubs'), pageManageClubs * getPageSize('clubs'))
                    .map(c => (
                      <div key={c.id} className="match-card animate-in stubhub-card-sleek" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img loading="lazy" decoding="async" src={c.logo} style={{ width: '40px', height: '40px' }} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.league}</div>
                        </div>
                        {featureFlags.favorites !== false && (
                          <span className={`material-icons-round fav-star ${favorites.includes(c.name) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(c.name)}>
                            {favorites.includes(c.name) ? 'star' : 'star_border'}
                          </span>
                        )}
                      </div>
                    ))
                ) : <div className="loader-container"><div className="loader"></div> Loading teams...</div>}
              </div>
              <Pagination
                current={pageManageClubs}
                total={Math.ceil(managedClubs.length / getPageSize('clubs'))}
                onPageChange={setPageManageClubs}
              />
            </div>
          </section>
        );

      case 'tactics':
        return (
          <section key="tactics" className="content-section active">
            <div className="tickets-header-pro">
              <div className="header-text">
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>Teams</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Explore profiles of {allClubs.length} teams across {sportConfig.label} leagues.</p>
              </div>
            </div>
            <div className="tactics-grid">
              {filteredClubs
                .slice((pageClubs - 1) * getPageSize('clubs'), pageClubs * getPageSize('clubs'))
                .map(t => (
                  <div key={t.id} className="tactic-card animate-in tactic-card-item" data-name={t.name} onClick={() => fetchClubRoster(t)}>
                    <div className="tactic-header">
                      <img loading="lazy" decoding="async" src={t.logo} className="tactic-logo" alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800 }}>{t.name}</div>
                          {featureFlags.favorites !== false && (
                            <span className={`material-icons-round fav-star ${favorites.includes(t.name) ? 'active' : ''}`}
                              onClick={() => toggleFavorite(t.name)}>
                              {favorites.includes(t.name) ? 'star' : 'star_border'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.tagline}</div>
                      </div>
                    </div>
                    <div className="formation-badge">{t.formation}</div>
                    <p className="tactic-description">{t.description}</p>
                  </div>
                ))}
              {allClubs.length === 0 && <div className="loader-container"><div className="loader"></div> Loading Tactics...</div>}
            </div>
            <Pagination
              current={pageClubs}
              total={Math.ceil(filteredClubs.length / getPageSize('clubs'))}
              onPageChange={setPageClubs}
            />
          </section>
        );

      case 'game':
        if (selectedSport === 'cricket') {
          return <SuperOverGame key="game" triggerCelebration={triggerCelebration} bestScore={superOverBest} onBestScore={setSuperOverBest} />;
        }
        return <PenaltyGame key="game" triggerCelebration={triggerCelebration} bestScore={penaltyBest} onBestScore={setPenaltyBest} />;

      case 'tickets':
        return (
          <section key="tickets" className="content-section active">
            {!selectedMatchForTicket ? (
              <>
                <div className="tickets-header-pro">
                  <div className="header-text">
                    <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>Find Live Schedules</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Live availability for top {sportConfig.label} leagues</p>
                  </div>
                  <div className="date-selector">
                    <input
                      type="date"
                      className="search-bar"
                      value={`${ticketDate.slice(0, 4)}-${ticketDate.slice(4, 6)}-${ticketDate.slice(6, 8)}`}
                      onChange={(e) => setTicketDate(e.target.value.split('-').join(''))}
                      style={{ width: '200px' }}
                    />
                    <div className="quick-dates">
                      <button onClick={() => setTicketDate(new Date().toISOString().split('T')[0].split('-').join(''))}>Today</button>
                      <button onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setTicketDate(tomorrow.toISOString().split('T')[0].split('-').join(''));
                      }}>Tomorrow</button>
                    </div>
                  </div>
                </div>

                {isFetchingTickets ? (
                  <div className="loader-container"><div className="loader"></div> Searching tickets...</div>
                ) : (
                  <div className="matches-grid tickets-pro-grid">
                    {ticketMatches.length > 0 ? (
                      ticketMatches.map(m => (
                        <div key={m.id} className="match-card animate-in stubhub-card-sleek" onClick={() => setSelectedMatchForTicket(m)}>
                          <div className="match-hero">
                            <img loading="lazy" decoding="async" src={m.pick} alt="Stadium" className="hero-img" />
                            <div className="hero-overlay">
                              <span className="league-tag-pro">{m.league}</span>
                              <div className="match-icons-row">
                                <img loading="lazy" decoding="async" src={m.homeLogo} alt={m.home} className="team-logo-pro" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                                <span className="vs-minimal">VS</span>
                                <img loading="lazy" decoding="async" src={m.awayLogo} alt={m.away} className="team-logo-pro" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                              </div>
                            </div>
                          </div>
                          <div className="match-info-box">
                            <div className="match-title-pro">
                              <span className="t-name">{m.home}</span>
                              <span className="vs-sep">v</span>
                              <span className="t-name">{m.away}</span>
                            </div>
                            <div className="venue-detail">
                              <span className="material-icons-round">pin_drop</span> {m.venue}
                            </div>
                            <div className="match-date-time-tag">
                              <span className="material-icons-round">calendar_today</span> {m.time}
                            </div>
                            <div className="card-pro-footer">
                              <div className="price-label">Tickets from</div>
                              <div className="price-value-bold">${Math.floor(m.priceBase)}</div>
                              <button className="book-btn-minimal">Book Now</button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-matches-placeholder">
                        <span className="material-icons-round" style={{ fontSize: '48px', marginBottom: '16px' }}>event_busy</span>
                        <p>No matches scheduled for this date.</p>
                        <button className="game-btn" onClick={() => setTicketDate(new Date().toISOString().split('T')[0].split('-').join(''))}>Return to Today</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <StubHubBooking
                match={selectedMatchForTicket}
                onBack={() => setSelectedMatchForTicket(null)}
                onBook={(booking) => {
                  setBookedTickets(prev => ({
                    ...prev,
                    [selectedMatchForTicket.id]: [...(prev[selectedMatchForTicket.id] || []), booking]
                  }));
                }}
              />
            )}
          </section>
        );

      case 'soccer_no_reason':
        if (selectedSport !== 'soccer') return null;
        return (
          <section key="soccer_no_reason" className="content-section active">
            <div style={{ padding: 48, textAlign: 'center', maxWidth: 420, margin: '60px auto' }}>
              <span className="material-icons-round" style={{ fontSize: 72, color: 'var(--accent, #f59e0b)', marginBottom: 16 }}>mood</span>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>For No Reason</h2>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>You found the tab that exists for no reason. Congrats.</p>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!authReady) {
    return (
      <div className="app-loading" aria-live="polite" aria-busy="true">
        <div className="app-loading-inner">
          <img src="/curlysports-logo.png" alt="Curly Sports" className="app-loading-logo" />
          <h1 className="app-loading-title">CURLY SPORTS</h1>
          <div className="loader"></div>
          <p className="app-loading-text">Loading…</p>
        </div>
      </div>
    );
  }

  const isProtectedRoute = isDashboardRoute || normalizedPath.startsWith('/dashboard/');
  const isPublicRoute = isHomeRoute || isLoginRoute || isSignupRoute;

  if (isHomeRoute) {
    return <HomePage isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isLoginRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <LoginPage mode="login" isAuthenticated={false} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isSignupRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <LoginPage mode="signup" isAuthenticated={false} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />;
  }
  if (isProtectedRoute && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isPublicRoute && !isProtectedRoute) {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // From here: authenticated user on /dashboard (main app)
  // Single codebase: switch UI by role (no redirect). Use email as fallback so bootstrap admin/super_admin always see correct UI.
  // Super Admin–managed list (sa_admins) also grants admin/super_admin; bootstrap emails always have access.
  const saRole = getSaRoleForEmail(user?.email, appConfig.saAdmins);
  const effectiveSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(user?.email) || saRole === 'super_admin';
  const effectiveAdmin = user?.role === 'admin' || isAdminEmail(user?.email) || saRole === 'admin';
  if (effectiveSuperAdmin) {
    return (
      <SuperAdminDashboard
        user={{ ...user, role: 'super_admin' }}
        onLogout={handleLogout}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }
  if (effectiveAdmin) {
    return (
      <AdminDashboard
        user={{ ...user, role: 'admin' }}
        onLogout={handleLogout}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    );
  }
  const isMaintenanceMode = appConfig.maintenance === true || (typeof localStorage !== 'undefined' && localStorage.getItem('sa_maintenance') === 'true');
  if (isMaintenanceMode) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#121212', color: '#f1f5f9', flexDirection: 'column', gap: 16, padding: 24 }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Under maintenance</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>We’ll be back shortly. Please try again later.</p>
        <button type="button" onClick={handleLogout} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#0a0e1a', cursor: 'pointer', fontWeight: 600 }}>Log out</button>
      </div>
    );
  }
  /* Signup survey: block main app until user either completes or skips (after first userData load). */
  const mustShowSurvey = user && userDataLoaded && userData?.surveyCompleted !== true && userData?.surveySkipped !== true;
  if (mustShowSurvey) {
    return (
      <SurveyInterests
        user={user}
        sportsList={enabledSportKeys.map((key) => ({ key, label: SPORTS_CONFIG[key]?.label || key }))}
        getSportData={getSportData}
        initialSurveyInterests={userData?.surveyInterests}
        initialFavoriteTeams={favorites}
        initialFavoritePlayers={favoritePlayers}
        onComplete={(payload) => {
          if (payload) {
            if (Array.isArray(payload.favoriteClubs)) setFavorites(payload.favoriteClubs);
            if (Array.isArray(payload.favoritePlayers)) setFavoritePlayers(payload.favoritePlayers);
          }
          setUserDataState((prev) => (prev ? { ...prev, ...payload } : { ...payload }));
          setTab('dashboard');
        }}
        onSkip={() => {
          setUserDataState((prev) => (prev ? { ...prev, surveySkipped: true } : { surveySkipped: true }));
          setTab('dashboard');
        }}
      />
    );
  }
  /* Main app: sidebar + content. Dashboard is a tab inside the app (no /dashboard route). */
  return (
    <>
      <div className="app-container">
        <div className={`theme-experience theme-experience--${themeMode}`} aria-hidden="true" />
        <Sidebar
          currentTab={currentTab}
          setTab={setTab}
          user={user}
          onLogout={handleLogout}
          onOpenProfileMenu={() => setProfileMenuOpen(true)}
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          enabledSportKeys={enabledSportKeys}
          leagueNames={leagueNames}
          leagueLogos={leagueLogos}
          leagueShortNames={sportConfig.leagueShortNames || {}}
          leagues={leagues}
          featureFlags={featureFlags}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        />

        {profileMenuOpen && user && (
          <ProfileMenu
            user={user}
            onClose={() => setProfileMenuOpen(false)}
            onLogout={handleLogout}
            colorScheme={colorScheme}
            setColorScheme={setColorScheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
          />
        )}
        <main className="main-content" data-tab={currentTab}>
          {currentTab === 'dashboard' ? (
            <>
              <div className="dashboard-bg-overlay" aria-hidden="true" />
              <Dashboard
                user={user}
                userData={userData}
                favorites={favorites}
                favoritePlayers={favoritePlayers}
                news={dashboardNewsForUser}
                transferNews={transferNewsForUser}
                matchReports={matchReportsForUser}
                matches={matches}
                allClubs={allClubs}
                allPlayersIndex={allPlayersIndex}
                onOpenMatch={fetchMatchDetails}
                selectedSport={selectedSport}
                surveySkipped={userData?.surveySkipped === true}
                surveyCompleted={userData?.surveyCompleted === true}
                onOpenSurvey={() => setShowSurveyModal(true)}
              />
            </>
          ) : (
            <>
              {/* Mobile/tablet: logo + sport dropdown + profile + logout (all formats) */}
              <div className="mobile-sport-selector">
                <div className="mobile-header-logo" onClick={() => setTab('live')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('live'); }} aria-label="Go to Live Scores">
                  <img src="/curlysports-logo.png" alt="Curly Sports" className="mobile-header-logo-img" />
                </div>
                <button type="button" className={`mobile-dashboard-btn ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} aria-label="Dashboard">
                  <span className="material-icons-round">dashboard</span>
                  <span>Dashboard</span>
                </button>
                <div className="mobile-header-sport">
                  <SportDropdown selectedSport={selectedSport} setSelectedSport={setSelectedSport} enabledSportKeys={enabledSportKeys} setTab={setTab} className="sport-dropdown-mobile" />
                </div>
                <div className="mobile-header-user">
                  <div className="user-profile mobile-user-profile" onClick={() => setProfileMenuOpen(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileMenuOpen(true); } }} aria-label="Open profile menu">
                    <div className="avatar">
                      {user?.avatar && user.avatar.length > 2 ? (
                        <img loading="lazy" decoding="async" src={user.avatar} alt="" className="avatar-img" />
                      ) : (
                        user?.avatar || 'M'
                      )}
                    </div>
                    <div className="user-info">
                      <span className="name">{user?.name || 'Member'}</span>
                      <span className="status">Online</span>
                      {featureFlags.streaks !== false && typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
                        <span className="user-streak mobile-streak"><span className="material-icons-round streak-icon">local_fire_department</span>{user.currentStreak}d</span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="logout-btn-pro mobile-logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
                    <span className="material-icons-round">logout</span>
                  </button>
                </div>
              </div>
              {enabledSportKeys.length > 0 && !enabledSportKeys.includes(selectedSport) ? (
                <div className="sport-unavailable-block" style={{ padding: 48, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
                  <span className="material-icons-round" style={{ fontSize: 64, color: 'var(--accent, #f59e0b)', marginBottom: 16 }}>sports</span>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Sorry, this sport is not currently available.</h2>
                  <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: 24 }}>Coming soon. Please choose another sport from the menu.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedSport(enabledSportKeys[0])}
                    style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--accent, #f59e0b)', color: '#0a0e1a', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View {SPORTS_CONFIG[enabledSportKeys[0]]?.label || enabledSportKeys[0]} instead
                  </button>
                </div>
              ) : (
                <>
                  <TopBar
                    title={currentTab === 'live' ? `${sportConfig.label} Live Match Center` : (leagueNames[currentTab] || currentTab.charAt(0).toUpperCase() + currentTab.slice(1))}
                    titleLogo={leagueNames[currentTab] && leagueLogos[currentTab] ? leagueLogos[currentTab] : undefined}
                    search={search}
                    setSearch={setSearch}
                    lastUpdate={lastUpdate}
                    sourceLabel={sportConfig.dataSource}
                    sources={sportConfig.sources}
                    rightSlot={user?.uid ? <NotificationsBell userId={user.uid} /> : null}
                  />
                  {renderSection()}
                </>
              )}
            </>
          )}
        </main>

        {celebration && (
          <div className="celebration-overlay active" onClick={() => setCelebration(null)}>
            <div className="team-alert">
              <span className="material-icons-round celebration-icon">workspace_premium</span>
              <h1>{celebration.title}</h1>
              <p>{celebration.detail}</p>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast-card animate-in ${toast.type}`}>
              <span className="material-icons-round toast-icon">{toast.icon || 'notifications'}</span>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-text">{toast.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
            <div className="modal-content animate-in player-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedPlayer(null)}>&times;</button>
              <div className="modal-hero">
                <img loading="lazy" decoding="async" src={selectedPlayer.image} className="modal-player-img" alt="" onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />
                <div className="modal-hero-text">
                  <h2>{selectedPlayer.name}</h2>
                  <p className="modal-hero-meta">
                    {selectedPlayer.leagueLogo && (
                      <img loading="lazy" decoding="async" src={selectedPlayer.leagueLogo} alt="" className="modal-league-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    {selectedPlayer.club} | {selectedPlayer.position}
                  </p>
                </div>
              </div>
              <div className="modal-body mini-scroll">
                <div className="quick-stats">
                  <div className="modal-stat"><label>Age</label><strong>{selectedPlayer.age || '-'}</strong></div>
                  <div className="modal-stat"><label>Height</label><strong>{selectedPlayer.height || '-'}</strong></div>
                  <div className="modal-stat"><label>Weight</label><strong>{selectedPlayer.weight || '-'}</strong></div>
                  <div className="modal-stat"><label>{selectedPlayer.primaryStatLabel || 'Goals'}</label><strong>{typeof selectedPlayer.goals === 'number' ? selectedPlayer.goals.toLocaleString() : (selectedPlayer.goals ?? '-')}</strong></div>
                  {selectedPlayer.assists && selectedPlayer.assists !== '-' && (
                    <div className="modal-stat"><label>{selectedPlayer.secondaryStatLabel || 'AST'}</label><strong>{typeof selectedPlayer.assists === 'number' ? selectedPlayer.assists.toLocaleString() : selectedPlayer.assists}</strong></div>
                  )}
                  {selectedPlayer.conference && (
                    <div className="modal-stat"><label>Conference</label><strong>{selectedPlayer.conference}</strong></div>
                  )}
                </div>
                <div className="modal-section-box">
                  <h4>Career Path</h4>
                  <div className="career-line">
                    {selectedPlayer.career?.map((c, i) => <span key={i} className="career-tag">{c}</span>)}
                  </div>
                </div>
                {selectedPlayer.trophies?.length > 0 && (
                  <div className="modal-section-box">
                    <h4>Trophies & Awards</h4>
                    <ul>{selectedPlayer.trophies.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
                {selectedPlayer.achievements?.length > 0 && (
                  <div className="modal-section-box">
                    <h4>Key Achievements</h4>
                    <ul>{selectedPlayer.achievements.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Club Detail Modal */}
        {selectedClub && (
          <div className="modal-overlay" onClick={() => setSelectedClub(null)}>
            <div className="modal-content animate-in club-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedClub(null)}>&times;</button>
              <div className="modal-hero club-hero">
                <img loading="lazy" decoding="async" src={selectedClub.logo} className="modal-club-logo" alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                <div className="modal-hero-text">
                  <h2>{selectedClub.name}</h2>
                  <p>{selectedClub.league} | {selectedClub.tagline}</p>
                </div>
              </div>
              <div className="modal-body mini-scroll">
                <div className="modal-section-box">
                  <h4>Club History</h4>
                  <p>{selectedClub.history}</p>
                </div>
                <div className="modal-section-box">
                  <h4>Actual Lineup / Roster</h4>
                  <div className="lineup-grid">
                    {selectedClub.lineup?.length > 0 ? (
                      selectedClub.lineup.map((p, i) => <div key={i} className="lineup-player">{p}</div>)
                    ) : (
                      <div className="lineup-player">Loading real lineup...</div>
                    )}
                  </div>
                </div>
                <div className="modal-section-box">
                  <h4>Club Legends</h4>
                  <div className="career-line">
                    {selectedClub.legends?.map((l, i) => <span key={i} className="career-tag legend">{l}</span>)}
                  </div>
                </div>
                <div className="modal-section-box">
                  <h4>Trophies</h4>
                  <ul>{selectedClub.trophies?.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Detail Modal — Sport-Aware */}
        {selectedMatchStatus && (() => {
          const mCfg = MATCH_DETAIL_CONFIG[selectedSport] || MATCH_DETAIL_CONFIG.soccer;
          const d = selectedMatchStatus.details || {};
          const hasStarted = selectedMatchStatus.isLive || selectedMatchStatus.isCompleted;
          const gameLeaders = d.gameLeaders || [];
          const lineups = d.lineups || [];
          const scoringPlays = d.scoringPlays || [];
          const keyEvents = d.keyEvents || [];
          const boxTeams = d.boxscore?.teams || [];

          // Normalize any value to string for display (prevents [object Object])
          const toScoreStr = (v) => {
            if (v == null || v === '') return '—';
            if (typeof v === 'object') return String(v.displayValue ?? v.value ?? v.text ?? '—').trim() || '—';
            const s = String(v).trim();
            return s.replace(/^Target\s*\)?/i, '').replace(/\)+$/, '').trim() || '—';
          };
          const cleanMainScore = (v) => {
            if (v == null || v === '') return '0';
            if (typeof v === 'object') return String(v.displayValue ?? v.value ?? v).trim();
            return String(v).replace(/^Target\s*\)?/i, '').replace(/\)+$/, '').trim() || '0';
          };

          // Normalize periodScores so every cell is a string
          const periodScores = (d.periodScores || []).map(ps => ({
            ...ps,
            team: toScoreStr(ps.team),
            linescores: (ps.linescores || []).map(ls => toScoreStr(ls)),
            totalScore: toScoreStr(ps.totalScore)
          }));

          // Build available tabs dynamically based on sport & data
          const tabs = [{ id: 'summary', label: 'Summary' }];
          if (keyEvents.length > 0 || scoringPlays.length > 0) tabs.push({ id: 'plays', label: selectedSport === 'f1' ? 'Race Log' : 'Key Plays' });
          if (boxTeams.length >= 2) tabs.push({ id: 'stats', label: 'Stats' });
          if (gameLeaders.length > 0 && mCfg.showLeaders) tabs.push({ id: 'leaders', label: 'Leaders' });
          if (selectedSport === 'cricket' && mCfg.showLeaders && gameLeaders.length === 0) tabs.push({ id: 'leaders', label: 'Leaders' });
          if (lineups.length > 0 && mCfg.showLineups) tabs.push({ id: 'lineups', label: 'Lineups' });

          const activeTab = tabs.find(t => t.id === matchDetailTab) ? matchDetailTab : 'summary';

          return (
            <div className="modal-overlay" onClick={() => { setSelectedMatchStatus(null); setMatchDetailTab('summary'); }}>
              <div className="modal-content animate-in match-detail-modal" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={() => { setSelectedMatchStatus(null); setMatchDetailTab('summary'); }}>&times;</button>
                <div className="modal-hero match-hero-detail">
                  <div className="match-league-tag">
                    <span className="material-icons-round" style={{ fontSize: 14 }}>{sportConfig.icon}</span>
                    {selectedMatchStatus.league}
                  </div>
                  <div className="match-teams-large">
                    <div className="m-team">
                      <img loading="lazy" decoding="async" src={selectedMatchStatus.homeLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <h3>{selectedMatchStatus.home}</h3>
                    </div>
                    <div className="m-score-box">
                      <span className="m-score">{hasStarted ? `${cleanMainScore(selectedMatchStatus.homeScore)} – ${cleanMainScore(selectedMatchStatus.awayScore)}` : 'vs'}</span>
                      <span className="m-time-detail">
                        {selectedMatchStatus.isLive && <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, marginRight: 6, verticalAlign: 'middle' }}></span>}
                        {selectedMatchStatus.time}
                      </span>
                    </div>
                    <div className="m-team">
                      <img loading="lazy" decoding="async" src={selectedMatchStatus.awayLogo} alt="" onError={(e) => { e.target.src = FALLBACK_TEAM_LOGO; }} />
                      <h3>{selectedMatchStatus.away}</h3>
                    </div>
                  </div>

                  {/* Period/Quarter/Inning score strip */}
                  {hasStarted && periodScores.length >= 2 && periodScores[0].linescores?.length > 0 && (
                    <div className="period-score-strip">
                      <table className="period-score-table">
                        <thead>
                          <tr>
                            <th></th>
                            {periodScores[0].linescores.map((_, i) => (
                              <th key={i}>{mCfg.periodNames[i] || `${mCfg.periodLabel} ${i + 1}`}</th>
                            ))}
                            <th className="total-col">T</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodScores.sort((a, b) => (a.isHome ? -1 : 1)).map((ps, i) => (
                            <tr key={i}>
                              <td className="period-team-cell">
                                <img loading="lazy" decoding="async" src={ps.logo} alt="" style={{ width: 16, height: 16, marginRight: 6 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                {ps.team}
                              </td>
                              {ps.linescores.map((s, j) => <td key={j}>{typeof s === 'string' ? s : toScoreStr(s)}</td>)}
                              <td className="total-col"><strong>{ps.totalScore}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Game info bar */}
                {(d.venue || d.attendance || d.weather) && (
                  <div className="match-info-bar">
                    {d.venue && <span><span className="material-icons-round" style={{ fontSize: 14 }}>stadium</span> {d.venue}</span>}
                    {d.attendance && <span><span className="material-icons-round" style={{ fontSize: 14 }}>groups</span> {Number(d.attendance).toLocaleString()}</span>}
                    {d.weather && <span><span className="material-icons-round" style={{ fontSize: 14 }}>thermostat</span> {d.weather}</span>}
                  </div>
                )}

                <div className="modal-body mini-scroll">
                  {/* Dynamic tabs */}
                  <div className="match-tabs">
                    {tabs.map(t => (
                      <div key={t.id} className={`match-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setMatchDetailTab(t.id)}>
                        {t.label}
                      </div>
                    ))}
                  </div>

                  {/* ========== SUMMARY TAB ========== */}
                  {activeTab === 'summary' && (
                    <div className="match-detail-section">
                      {/* Scoring plays timeline */}
                      {scoringPlays.length > 0 && (
                        <div className="scoring-plays-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>{mCfg.eventIcons.goal}</span> Scoring Summary</h4>
                          <div className="scoring-timeline">
                            {scoringPlays.map((p, i) => (
                              <div key={i} className="scoring-play-item animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="sp-score-badge">{p.homeScore} - {p.awayScore}</div>
                                <div className="sp-content">
                                  <div className="sp-meta">
                                    {p.periodText && <span className="sp-period">{p.periodText}</span>}
                                    {p.clock && <span className="sp-clock">{p.clock}</span>}
                                    {p.type && <span className="sp-type">{p.type}</span>}
                                  </div>
                                  <div className="sp-text">{p.text}</div>
                                  {p.team && <div className="sp-team">{p.team}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick leaders preview */}
                      {(gameLeaders.length > 0 && mCfg.showLeaders) ? (
                        <div className="leaders-preview-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> Top Performers</h4>
                          <div className="leaders-preview-grid">
                            {gameLeaders.slice(0, 3).map((cat, i) => (
                              <div key={i} className="leader-preview-card">
                                <div className="lp-category">{cat.displayName}</div>
                                {cat.leaders.slice(0, 1).map((l, j) => (
                                  <div key={j} className="lp-player">
                                    {l.headshot && <img loading="lazy" decoding="async" src={l.headshot} alt="" className="lp-headshot" onError={(e) => { e.target.style.display = 'none'; }} />}
                                    <div className="lp-info">
                                      <div className="lp-name">{l.displayName}</div>
                                      <div className="lp-value">{l.value}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (selectedSport === 'cricket' && hasStarted && (
                        <div className="leaders-preview-section leaders-empty-state">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>emoji_events</span> Top Performers</h4>
                          <p className="leaders-empty-text">{selectedMatchStatus.details?.keyEventsNote || 'Top performer stats (runs, wickets) will appear here when available from the source.'}</p>
                        </div>
                      ))}

                      {/* Boxscore stats summary - top 5 */}
                      {hasStarted && boxTeams.length >= 2 && boxTeams[0].statistics?.length > 0 && (
                        <div className="stats-summary-section">
                          <h4><span className="material-icons-round" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>bar_chart</span> Key Stats</h4>
                          <div className="stats-grid-pro">
                            {boxTeams[0].statistics.slice(0, 6).map((stat, idx) => {
                              const awayStat = boxTeams[1].statistics.find(s => s.name === stat.name);
                              if (!awayStat) return null;
                              const hVal = parseFloat(stat.displayValue) || 0;
                              const aVal = parseFloat(awayStat.displayValue) || 0;
                              const total = hVal + aVal;
                              const hPerc = total === 0 ? 50 : (hVal / total) * 100;
                              return (
                                <div key={idx} className="stat-row-pro animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                  <div className="stat-labels">
                                    <span>{stat.displayValue}</span>
                                    <span className="stat-name">{stat.label}</span>
                                    <span>{awayStat.displayValue}</span>
                                  </div>
                                  <div className="stat-bar-container">
                                    <div className="stat-bar-fill" style={{ width: `${hPerc}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fallback if no data yet */}
                      {!hasStarted && (
                        <div className="match-not-started">
                          <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-secondary)', marginBottom: 12 }}>schedule</span>
                          <p>Match hasn't started yet</p>
                          <p className="mns-sub">Stats, scoring plays, and leaders will appear once the {selectedSport === 'f1' ? 'race' : 'game'} begins.</p>
                          <div className="stats-grid-pro" style={{ marginTop: 20, opacity: 0.4 }}>
                            {mCfg.fallbackStats.slice(0, 5).map((label, i) => (
                              <div key={i} className="stat-row-pro">
                                <div className="stat-labels">
                                  <span>—</span>
                                  <span className="stat-name">{label}</span>
                                  <span>—</span>
                                </div>
                                <div className="stat-bar-container">
                                  <div className="stat-bar-fill" style={{ width: '50%', opacity: 0.3 }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========== KEY PLAYS TAB ========== */}
                  {activeTab === 'plays' && (
                    <div className="match-detail-section">
                      <div className="updates-list">
                        {keyEvents.length > 0 ? keyEvents.map((ev, i) => (
                          <div key={i} className="update-item animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="update-time-tag">{ev.clock?.displayValue || ev.shortText}</div>
                            <div className="update-icon">
                              <span className="material-icons-round">
                                {(() => {
                                  const t = ev.type?.text?.toLowerCase() || '';
                                  if (t.includes('goal') || t.includes('run') || t.includes('touchdown') || t.includes('homer')) return mCfg.eventIcons.goal;
                                  if (t.includes('card') || t.includes('foul') || t.includes('penalty')) return 'warning';
                                  if (t.includes('substitution') || t.includes('pit')) return 'cached';
                                  if (t.includes('wicket')) return 'sports_cricket';
                                  return 'info';
                                })()}
                              </span>
                            </div>
                            <div className="update-content">
                              <div className="update-type">{ev.type?.text}</div>
                              <div className="update-text">{ev.text}</div>
                              {ev.participants?.map(p => (
                                <div key={p.athlete?.id || Math.random()} className="update-player">{p.athlete?.displayName}</div>
                              ))}
                            </div>
                          </div>
                        )) : scoringPlays.length > 0 ? scoringPlays.map((p, i) => (
                          <div key={i} className="update-item animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="update-time-tag">{p.clock || p.periodText}</div>
                            <div className="update-icon">
                              <span className="material-icons-round">{mCfg.eventIcons.goal}</span>
                            </div>
                            <div className="update-content">
                              <div className="update-type">{p.type || mCfg.scoreTerm}</div>
                              <div className="update-text">{p.text}</div>
                              {p.team && <div className="update-player">{p.team} — {p.homeScore} - {p.awayScore}</div>}
                            </div>
                          </div>
                        )) : (
                          <div className="no-updates">No play data available.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ========== STATS TAB ========== */}
                  {activeTab === 'stats' && (
                    <div className="match-detail-section">
                      <div className="stats-grid-pro">
                        {boxTeams.length >= 2 && boxTeams[0].statistics?.map((stat, idx) => {
                          const awayStat = boxTeams[1].statistics.find(s => s.name === stat.name);
                          if (!awayStat) return null;
                          const hVal = parseFloat(stat.displayValue) || 0;
                          const aVal = parseFloat(awayStat.displayValue) || 0;
                          const total = hVal + aVal;
                          const hPerc = total === 0 ? 50 : (hVal / total) * 100;
                          return (
                            <div key={idx} className="stat-row-pro animate-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                              <div className="stat-labels">
                                <span>{stat.displayValue}</span>
                                <span className="stat-name">{stat.label}</span>
                                <span>{awayStat.displayValue}</span>
                              </div>
                              <div className="stat-bar-container">
                                <div className="stat-bar-fill" style={{ width: `${hPerc}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========== LEADERS TAB ========== */}
                  {activeTab === 'leaders' && (
                    <div className="match-detail-section">
                      {gameLeaders.length > 0 ? (
                        <div className="leaders-full-grid">
                          {gameLeaders.map((cat, ci) => (
                            <div key={ci} className="leader-category-card animate-in" style={{ animationDelay: `${ci * 0.08}s` }}>
                              <div className="lc-header">{cat.displayName}</div>
                              {cat.leaders.map((l, li) => (
                                <div key={li} className="leader-row">
                                  <div className="lr-rank">{li + 1}</div>
                                  {l.headshot && <img loading="lazy" decoding="async" src={l.headshot} alt="" className="lr-headshot" onError={(e) => { e.target.src = FALLBACK_PLAYER_IMAGE; }} />}
                                  <div className="lr-info">
                                    <div className="lr-name">{l.displayName}</div>
                                    {l.team && <div className="lr-team">{l.team}</div>}
                                  </div>
                                  <div className="lr-value">{l.value}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="leaders-empty-state" style={{ padding: 24, textAlign: 'center' }}>
                          <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--text-secondary)', marginBottom: 12 }}>emoji_events</span>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{selectedSport === 'cricket' ? (selectedMatchStatus.details?.keyEventsNote || 'Top performer stats (runs, wickets) are not available for this match.') : 'No leader data available.'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========== LINEUPS TAB ========== */}
                  {activeTab === 'lineups' && (
                    <div className="match-detail-section">
                      {lineups.map((roster, ri) => (
                        <div key={ri} className="lineup-section-card animate-in" style={{ animationDelay: `${ri * 0.1}s` }}>
                          <div className="ls-header">
                            <img loading="lazy" decoding="async" src={roster.logo} alt="" style={{ width: 24, height: 24 }} onError={(e) => { e.target.style.display = 'none'; }} />
                            <span>{roster.team}</span>
                          </div>
                          <div className="lineup-grid">
                            {roster.players.map((p, pi) => (
                              <div key={pi} className="lineup-player">
                                {p.jersey && <span className="lp-jersey">#{p.jersey}</span>}
                                <span className="lp-pos">{p.position}</span>
                                <span>{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {isFetchingMatchDetails && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="loader"></div>
          </div>
        )}
      </div>

      {showSurveyModal && user && (
        <SurveyInterests
          key={Object.keys(userData?.surveyInterests?.sports || {}).sort().join(',') || 'survey'}
          user={user}
          sportsList={enabledSportKeys.map((key) => ({ key, label: SPORTS_CONFIG[key]?.label || key }))}
          getSportData={getSportData}
          initialSurveyInterests={userData?.surveyInterests}
          initialFavoriteTeams={favorites}
          initialFavoritePlayers={favoritePlayers}
          isModal
          onClose={() => setShowSurveyModal(false)}
          onComplete={(payload) => {
            if (payload) {
              lastSurveyWriteAtRef.current = Date.now();
              if (Array.isArray(payload.favoriteClubs)) setFavorites(payload.favoriteClubs);
              if (Array.isArray(payload.favoritePlayers)) setFavoritePlayers(payload.favoritePlayers);
            }
            setUserDataState((prev) => (prev ? { ...prev, ...(payload || {}), surveyCompleted: true, surveySkipped: false } : { ...(payload || {}), surveyCompleted: true, surveySkipped: false }));
            setShowSurveyModal(false);
          }}
        />
      )}
    </>
  );
}

// --- Super Over Minigame (Cricket) ---

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

// --- Minigame Component ---

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
        setMessage('SAVED! 🧤 The keeper caught it.');
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

// --- Advanced StubHub Booking Component ---

const StubHubBooking = ({ match, onBack, onBook }) => {
  const [viewMode, setViewMode] = useState('stadium'); // 'stadium' or 'section'
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [quantity, setQuantity] = useState(2);
  const [maxPrice, setMaxPrice] = useState(5000);

  // Simulated Real-time inventory
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    // Realistic seat state logic:
    // Matches with high base price are "hot" and have more sold out seats
    const isHotMatch = match.priceBase > 200;

    if (selectedSection) {
      const seats = {};
      for (let i = 1; i <= 100; i++) {
        const rand = Math.random();
        const soldOutThreshold = isHotMatch ? 0.6 : 0.3; // 60% vs 30% sold out
        const lockedThreshold = isHotMatch ? 0.8 : 0.4; // More competition for hot matches

        if (rand < soldOutThreshold) seats[i] = 'soldout';
        else if (rand < lockedThreshold) seats[i] = 'locked';
        else seats[i] = 'available';
      }
      setInventory(seats);
    }
  }, [selectedSection, match.priceBase]);

  const toggleSeat = (id) => {
    if (inventory[id] === 'soldout' || inventory[id] === 'locked') return;
    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      if (selectedSeats.length < (typeof quantity === 'number' ? quantity : 10)) {
        setSelectedSeats([...selectedSeats, id]);
      }
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setViewMode('section');
    setSelectedSeats([]);
  };

  return (
    <div className="stubhub-booking-layout animate-in">
      <div className="booking-header">
        <button className="game-btn" onClick={viewMode === 'section' ? () => setViewMode('stadium') : onBack}>
          <span className="material-icons-round">arrow_back</span> {viewMode === 'section' ? 'Back to Map' : 'Exit'}
        </button>
        <div className="event-title">
          <h2>{match.home} vs {match.away}</h2>
          <p>{match.time} • {selectedSection ? `Section: ${selectedSection}` : 'Select a Section'}</p>
        </div>
      </div>

      <div className="booking-main-grid">
        {/* Left Sidebar */}
        <aside className="booking-filters">
          <div className="filter-group">
            <label>Tickets needed</label>
            <div className="qty-grid">
              {[1, 2, 3, 4, '5+'].map(q => (
                <button key={q} className={`qty-btn ${quantity === q ? 'active' : ''}`} onClick={() => setQuantity(q)}>{q}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div style={{ fontWeight: 800 }}>$100 - ${maxPrice}</div>
            <input type="range" min="100" max="5000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          <div className="ticket-listings mini-scroll">
            {match.sections.filter(s => s.price <= maxPrice && (!selectedSection || s.name.includes(selectedSection))).map((s, i) => (
              <div
                key={i}
                className={`listing-card ${selectedSection === s.name ? 'selected' : ''}`}
                onClick={() => handleSectionClick(s.name)}
              >
                <div className="listing-info">
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{s.name}</div>
                  <div className="tag green-tag" style={{ border: 'none', padding: '2px 6px', marginTop: '4px' }}>
                    $ {s.price} each
                  </div>
                </div>
                <button className="game-btn main" style={{ padding: '6px 12px' }}>Pick</button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Interactive Map / Seat View */}
        <div className="stadium-map-container" style={{ position: 'relative', overflow: 'hidden' }}>
          {viewMode === 'stadium' ? (
            <div className="stadium-svg-wrapper zoom-in">
              <svg viewBox="0 0 400 300" className="stadium-svg">
                {/* Simplified Stadium Shape */}
                <rect x="50" y="50" width="300" height="200" rx="100" fill="none" stroke="var(--border-color)" strokeWidth="2" />
                <rect x="150" y="100" width="100" height="100" rx="4" fill="#22c55e" /> {/* Pitch */}

                {/* Clickable Sections */}
                {['LATERAL', 'TRIBUNA', 'GOL NORD', 'GOL SUD'].map((sec, idx) => {
                  const paths = {
                    'LATERAL': "M50,100 Q50,50 150,50 L150,250 Q50,250 50,200 Z",
                    'TRIBUNA': "M350,100 Q350,50 250,50 L250,250 Q350,250 350,200 Z",
                    'GOL NORD': "M160,40 L240,40 Q280,40 280,80 L120,80 Q120,40 160,40 Z",
                    'GOL SUD': "M160,260 L240,260 Q280,260 280,220 L120,220 Q120,260 160,260 Z"
                  };
                  return (
                    <path
                      key={sec}
                      d={paths[sec]}
                      className="map-section-path"
                      fill={selectedSection === sec ? 'var(--highlight)' : 'rgba(148, 163, 184, 0.1)'}
                      stroke="white"
                      strokeWidth="1"
                      onClick={() => handleSectionClick(sec)}
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="section-zoom-view animate-in">
              <div className="seat-legend">
                <span className="legend-item"><div className="dot available"></div> Available</span>
                <span className="legend-item"><div className="dot soldout"></div> Sold out</span>
                <span className="legend-item"><div className="dot locked"></div> Locked</span>
                <span className="legend-item"><div className="dot selected"></div> Selected</span>
              </div>
              <div className="seats-grid">
                {Object.keys(inventory).map(id => (
                  <div
                    key={id}
                    className={`seat ${inventory[id]} ${selectedSeats.includes(id) ? 'selected' : ''}`}
                    onClick={() => toggleSeat(id)}
                    title={`Seat ${id}`}
                  ></div>
                ))}
              </div>

              {selectedSeats.length > 0 && (
                <div className="booking-cta animate-in sleek-checkout">
                  <div className="cta-glass">
                    <div className="cta-info">
                      <span className="label">SECURED SEATS</span>
                      <strong className="value">{selectedSeats.length} Tickets</strong>
                    </div>
                    <div className="cta-divider"></div>
                    <div className="cta-info">
                      <span className="label">TOTAL PRICE</span>
                      <strong className="value highlight-text">${selectedSeats.length * match.priceBase}</strong>
                    </div>
                    <button className="checkout-btn-pro" onClick={() => { onBook({ matchId: match.id, seats: selectedSeats }); alert('Booking Confirmed! Check your email.'); setViewMode('stadium'); }}>
                      Complete Order <span className="material-icons-round">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default App;
