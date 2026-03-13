// @ts-nocheck
/**
 * F1 data layer: fetch from ESPN, normalize, cache.
 * All times are converted to user's local timezone for display.
 */
import { SESSION_LABELS, ESPN_SESSION_TYPE_MAP, F1_CACHE_TTL_MS, F1_STANDINGS_CACHE_TTL_MS, F1_TEAM_LOGO_URLS } from './f1Constants';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard';
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/racing/f1/standings';

let scoreboardCache = null;
let scoreboardCacheTime = 0;
let standingsCache = null;
let standingsCacheTime = 0;

function now() { return Date.now(); }

/** Format ISO date string to user's local time */
export function toLocalTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

/** Format ISO date to local date only */
export function toLocalDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format for session time (e.g. "Fri, 3:30 AM") */
export function toLocalSessionTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

/**
 * Fetch race calendar and upcoming/current events with session timings.
 * Returns { seasonYear, calendar: [...], events: [...], nextRace, previousRace }.
 */
export async function getRaceCalendar() {
  if (scoreboardCache && now() - scoreboardCacheTime < F1_CACHE_TTL_MS) {
    return scoreboardCache;
  }
  try {
    const res = await fetch(ESPN_SCOREBOARD);
    const data = await res.json();
    const league = data.leagues?.[0];
    const calendar = (league?.calendar || []).map((c, idx) => ({
      round: idx + 1,
      grandPrixName: c.label || '',
      startDate: c.startDate,
      endDate: c.endDate,
      country: extractCountryFromLabel(c.label),
      eventRef: c.event?.$ref || null,
    }));
    const events = (data.events || []).map(ev => {
      const comps = ev.competitions || [];
      const sessions = comps.map(c => {
        const typeId = c.type?.id;
        const abbr = ESPN_SESSION_TYPE_MAP[typeId] || c.type?.abbreviation || 'Session';
        return {
          id: c.id,
          type: abbr,
          label: SESSION_LABELS[abbr] || abbr,
          startDate: c.startDate || c.date,
          status: c.status?.type?.description || c.status?.type?.shortDetail || 'Scheduled',
          shortDetail: c.status?.type?.shortDetail || '',
        };
      }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const circuit = ev.circuit || {};
      const nowDate = new Date();
      const eventStart = ev.date ? new Date(ev.date) : null;
      const eventEnd = ev.endDate ? new Date(ev.endDate) : null;
      let status = 'upcoming';
      if (eventEnd && nowDate > eventEnd) status = 'completed';
      else if (eventStart && nowDate >= eventStart) status = 'live';
      return {
        id: ev.id,
        name: ev.name || ev.shortName || 'Grand Prix',
        shortName: ev.shortName || ev.name,
        date: ev.date,
        endDate: ev.endDate,
        circuitName: circuit.fullName || '',
        circuitCity: circuit.address?.city || '',
        circuitCountry: circuit.address?.country || '',
        sessions,
        status,
      };
    });
    const nowDate = new Date();
    let nextRace = null;
    let previousRace = null;
    for (const ev of events) {
      const end = ev.endDate ? new Date(ev.endDate) : null;
      if (end && end > nowDate && !nextRace) nextRace = ev;
      if (end && end <= nowDate) previousRace = ev;
    }
    if (!nextRace && events.length > 0) nextRace = events.find(e => e.status === 'upcoming') || events[0];
    const result = {
      seasonYear: league?.season?.year || data.season?.year || new Date().getFullYear(),
      calendar,
      events,
      nextRace,
      previousRace,
    };
    scoreboardCache = result;
    scoreboardCacheTime = now();
    return result;
  } catch (err) {
    console.warn('F1 getRaceCalendar error', err);
    return { seasonYear: new Date().getFullYear(), calendar: [], events: [], nextRace: null, previousRace: null };
  }
}

function extractCountryFromLabel(label) {
  if (!label || typeof label !== 'string') return '';
  const known = {
    Australian: 'Australia', Chinese: 'China', Japanese: 'Japan', Bahrain: 'Bahrain',
    Saudi: 'Saudi Arabia', Arabian: 'Saudi Arabia', Miami: 'USA', Canadian: 'Canada',
    Monaco: 'Monaco', Spanish: 'Spain', Barcelona: 'Spain', Austrian: 'Austria',
    British: 'UK', Belgian: 'Belgium', Hungarian: 'Hungary', Dutch: 'Netherlands',
    Italian: 'Italy', Singapore: 'Singapore', 'United States': 'USA', Qatar: 'Qatar',
    'Abu Dhabi': 'UAE', Azerbaijan: 'Azerbaijan', Mexican: 'Mexico'
  };
  for (const [k, v] of Object.entries(known)) {
    if (label.includes(k)) return v;
  }
  const stripped = label.replace(/\s*(Grand Prix|GP)\s*$/gi, '').trim();
  return stripped || '';
}

/**
 * Fetch driver and constructor standings.
 * Returns { driverStandings: [...], constructorStandings: [...] }.
 */
export async function getStandings() {
  if (standingsCache && now() - standingsCacheTime < F1_STANDINGS_CACHE_TTL_MS) {
    return standingsCache;
  }
  try {
    const res = await fetch(ESPN_STANDINGS);
    const data = await res.json();
    const driverChild = data.children?.find(c => (c.name || '').toLowerCase().includes('driver'));
    const constructorChild = data.children?.find(c => (c.name || '').toLowerCase().includes('constructor') || (c.name || '').toLowerCase().includes('team'));
    const driverEntries = driverChild?.standings?.entries || [];
    const constructorEntries = constructorChild?.standings?.entries || [];
    const driverStandings = driverEntries.map((entry, idx) => {
      const athlete = entry.athlete || {};
      const rankStat = entry.stats?.find(s => s.name === 'rank' || s.abbreviation === 'RK');
      const ptsStat = entry.stats?.find(s => s.name === 'championshipPts' || s.abbreviation === 'PTS');
      const winsStat = entry.stats?.find(s => s.name === 'wins' || s.displayName === 'Wins');
      return {
        position: rankStat?.value ?? idx + 1,
        driverId: athlete.id,
        driverName: athlete.displayName || athlete.name || 'Driver',
        abbreviation: athlete.abbreviation || '',
        nationality: athlete.flag?.alt || '',
        flagUrl: athlete.flag?.href || '',
        team: entry.team?.displayName || entry.team?.name || '',
        teamId: entry.team?.id,
        points: ptsStat?.value ?? 0,
        wins: winsStat?.value ?? 0,
      };
    });
    const constructorStandings = constructorEntries.map((entry, idx) => {
      const team = entry.team || entry;
      const rankStat = entry.stats?.find(s => s.name === 'rank' || s.abbreviation === 'RK');
      const ptsStat = entry.stats?.find(s => s.name === 'championshipPts' || s.name === 'points' || s.abbreviation === 'PTS');
      const winsStat = entry.stats?.find(s => s.name === 'wins');
      const logo = team.logo || team.logos?.[0]?.href || F1_TEAM_LOGO_URLS[team.id] || F1_TEAM_LOGO_URLS[String(team.id)] || (team.id ? `https://a.espncdn.com/i/teamlogos/f1/500/${team.id}.png` : '');
      return {
        position: rankStat?.value ?? idx + 1,
        teamId: team.id,
        teamName: team.displayName || team.name || 'Team',
        logo,
        points: ptsStat?.value ?? 0,
        wins: winsStat?.value ?? 0,
      };
    });
    const result = { driverStandings, constructorStandings };
    standingsCache = result;
    standingsCacheTime = now();
    return result;
  } catch (err) {
    console.warn('F1 getStandings error', err);
    return { driverStandings: [], constructorStandings: [] };
  }
}

/**
 * Fetch event summary for a race (results, qualifying when available).
 * ESPN summary endpoint may 404; we return sessions from scoreboard and placeholder for results.
 */
export async function getEventDetails(eventId) {
  try {
    const { events } = await getRaceCalendar();
    const ev = events.find(e => e.id === String(eventId));
    if (!ev) return null;
    return { ...ev, sessionsWithLocal: ev.sessions.map(s => ({ ...s, localTime: toLocalSessionTime(s.startDate) })) };
  } catch (err) {
    console.warn('F1 getEventDetails error', err);
    return null;
  }
}

/**
 * Fetch race results for a completed event. Tries ESPN summary endpoint; returns null if 404 or no results.
 */
export async function getEventResults(eventId) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/racing/f1/summary?event=${eventId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const results = [];
    const races = data.events || [];
    const eventName = data.header?.competitions?.[0]?.name || data.header?.events?.[0]?.name || data.name || 'Race';
    for (const ev of races) {
      const comps = ev.competitions || [];
      const raceComp = comps.find(c => (String(c.type?.abbreviation || '').toLowerCase()) === 'race') || comps[comps.length - 1];
      const entries = raceComp?.competitors || raceComp?.entries || [];
      entries.forEach((e, idx) => {
        const athlete = e.athlete || e.driver || e;
        const team = e.team || {};
        results.push({
          position: e.order?.displayOrder ?? e.position ?? e.rank ?? idx + 1,
          driverId: athlete?.id,
          driverName: athlete?.displayName || athlete?.name || e.name || 'Driver',
          team: team.displayName || team.name || '',
          points: e.points ?? 0,
          status: e.status || e.finishReason || '',
        });
      });
    }
    if (results.length === 0) return null;
    return { eventId, eventName: eventName || 'Race', results };
  } catch (err) {
    return null;
  }
}

/** Invalidate cache (e.g. on manual refresh) */
export function invalidateF1Cache() {
  scoreboardCache = null;
  standingsCache = null;
}
