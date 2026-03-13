// @ts-nocheck
/**
 * F1 section: tab bar + Overview, Schedule, Live, Results, Drivers, Teams, Standings.
 * Uses real data from f1Api (calendar, standings). Live tab content is rendered by parent (matches grid + standings).
 */
import React from 'react';
import { getRaceCalendar, getStandings, getEventResults, toLocalTime, toLocalSessionTime } from './f1Api';

const F1_TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar_month' },
  { id: 'live', label: 'Live', icon: 'timer' },
  { id: 'results', label: 'Results', icon: 'flag' },
  { id: 'drivers', label: 'Drivers', icon: 'person' },
  { id: 'teams', label: 'Teams', icon: 'groups' },
  { id: 'standings', label: 'Standings', icon: 'emoji_events' },
];

function Countdown({ targetDate }) {
  const [diff, setDiff] = React.useState(null);
  React.useEffect(() => {
    const t = targetDate ? new Date(targetDate) : null;
    const update = () => {
      if (!t || t <= new Date()) { setDiff(null); return; }
      const d = Math.floor((t - new Date()) / (24 * 60 * 60 * 1000));
      const h = Math.floor(((t - new Date()) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor(((t - new Date()) % (60 * 60 * 1000)) / (60 * 1000));
      setDiff({ days: d, hours: h, minutes: m });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (!diff) return null;
  return (
    <div className="f1-countdown">
      <span className="f1-countdown-num">{diff.days}</span>d <span className="f1-countdown-num">{diff.hours}</span>h <span className="f1-countdown-num">{diff.minutes}</span>m
    </div>
  );
}

export function F1Section({
  f1Tab,
  setF1Tab,
  calendar = null,
  standings = null,
  loading = false,
  error = null,
  onRefresh,
  renderLiveContent,
  selectedDate,
}) {
  const nextRace = calendar?.nextRace;
  const events = calendar?.events || [];
  const fullSeasonCalendar = calendar?.calendar || [];
  const driverStandings = standings?.driverStandings || [];
  const constructorStandings = standings?.constructorStandings || [];

  /** Race to show in Overview based on selected date: race on that day, or next upcoming (first race whose end date is after the selected date). */
  const overviewRace = React.useMemo(() => {
    const selected = (selectedDate || '').toString().slice(0, 10);
    if (!selected) return nextRace || null;
    const raceOnDay = events.find((ev) => {
      const start = (ev.date || '').slice(0, 10);
      const end = (ev.endDate || ev.date || '').slice(0, 10);
      return start && end && selected >= start && selected <= end;
    });
    if (raceOnDay) return raceOnDay;
    const raceOnDayCal = fullSeasonCalendar.find((c) => {
      const start = (c.startDate || '').slice(0, 10);
      const end = (c.endDate || '').slice(0, 10);
      return start && end && selected >= start && selected <= end;
    });
    if (raceOnDayCal) {
      return { id: `cal-${raceOnDayCal.round}`, name: raceOnDayCal.grandPrixName || 'Grand Prix', date: raceOnDayCal.startDate, endDate: raceOnDayCal.endDate, circuitName: '', circuitCity: '', circuitCountry: raceOnDayCal.country || '' };
    }
    const nextFromDate = events.find((ev) => {
      const end = (ev.endDate || ev.date || '').slice(0, 10);
      return end && end > selected;
    });
    if (nextFromDate) return nextFromDate;
    const nextFromCal = fullSeasonCalendar.find((c) => {
      const end = (c.endDate || '').slice(0, 10);
      return end && end > selected;
    });
    if (nextFromCal) {
      return { id: `cal-${nextFromCal.round}`, name: nextFromCal.grandPrixName || 'Grand Prix', date: nextFromCal.startDate, endDate: nextFromCal.endDate, circuitName: '', circuitCity: '', circuitCountry: nextFromCal.country || '' };
    }
    return nextRace || null;
  }, [events, fullSeasonCalendar, selectedDate, nextRace]);

  const isSelectedDateToday = React.useMemo(() => {
    const d = new Date();
    const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return (selectedDate || '').toString().slice(0, 10) === todayStr;
  }, [selectedDate]);

  const [selectedResultEventId, setSelectedResultEventId] = React.useState(null);
  const [raceResults, setRaceResults] = React.useState(null);
  const [resultsLoading, setResultsLoading] = React.useState(false);
  const [profileDriver, setProfileDriver] = React.useState(null);
  const [profileTeam, setProfileTeam] = React.useState(null);

  const completedEvents = React.useMemo(
    () => events.filter((e) => e.status === 'completed').sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
    [events]
  );

  React.useEffect(() => {
    if (!selectedResultEventId) {
      setRaceResults(null);
      return;
    }
    let cancelled = false;
    setResultsLoading(true);
    getEventResults(selectedResultEventId)
      .then((data) => {
        if (!cancelled) {
          setRaceResults(data);
          setResultsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRaceResults(null);
          setResultsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [selectedResultEventId]);

  return (
    <div className="f1-section">
      <p className="f1-section-intro">Overview, schedule, live races, results, drivers, teams and standings.</p>
      <div className="f1-tabs">
        {F1_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`f1-tab ${f1Tab === id ? 'active' : ''}`}
            onClick={() => setF1Tab(id)}
          >
            <span className="material-icons-round f1-tab-icon">{icon}</span>
            <span className="f1-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="f1-loading">
          <div className="loader" />
          <p>Loading F1 data…</p>
        </div>
      )}
      {error && (
        <div className="f1-error">
          <p>{error}</p>
          {onRefresh && <button type="button" className="btn-refresh" onClick={onRefresh}>Retry</button>}
        </div>
      )}

      {!loading && !error && f1Tab === 'overview' && (
        <div className="f1-overview fade-in">
          <h3 className="f1-panel-title">Season {calendar?.seasonYear || new Date().getFullYear()}</h3>
          {overviewRace ? (
            <div className="f1-next-race-card">
              <div className="f1-next-race-header">
                <span className="f1-next-race-badge">
                  {overviewRace.date && selectedDate && (selectedDate.slice(0, 10) >= (overviewRace.date || '').slice(0, 10) && selectedDate.slice(0, 10) <= (overviewRace.endDate || overviewRace.date || '').slice(0, 10))
                    ? 'This weekend'
                    : 'Next race'}
                </span>
                {isSelectedDateToday && overviewRace.date && new Date(overviewRace.date) > new Date() && (
                  <Countdown targetDate={overviewRace.date} />
                )}
              </div>
              <h4 className="f1-next-race-name">{overviewRace.name}</h4>
              <p className="f1-next-race-circuit">{overviewRace.circuitName || overviewRace.circuitCity} {overviewRace.circuitCountry && ` · ${overviewRace.circuitCountry}`}</p>
              <p className="f1-next-race-dates">{toLocalTime(overviewRace.date)} — {toLocalTime(overviewRace.endDate)}</p>
            </div>
          ) : (
            <p className="f1-fallback-msg">No race for the selected date. Change the date above or check the Schedule tab.</p>
          )}
          <p className="f1-overview-standings-cta">
            Driver and constructor standings are in the <strong>Standings</strong> tab.
          </p>
        </div>
      )}

      {!loading && !error && f1Tab === 'schedule' && (
        <div className="f1-schedule fade-in">
          <h3 className="f1-panel-title">Race calendar</h3>
          <div className="f1-schedule-list">
            {events.map((ev) => {
              const selected = (selectedDate || '').toString().slice(0, 10);
              const start = (ev.date || '').slice(0, 10);
              const end = (ev.endDate || ev.date || '').slice(0, 10);
              const isSelectedDateRace = selected && start && end && selected >= start && selected <= end;
              return (
              <div key={ev.id} className={`f1-schedule-card${isSelectedDateRace ? ' f1-schedule-card--selected-date' : ''}`}>
                <div className="f1-schedule-card-header">
                  <span className={`f1-schedule-status f1-schedule-status--${ev.status || 'upcoming'}`}>{ev.status}</span>
                  <span className="f1-schedule-dates">{toLocalDate(ev.date)} — {toLocalDate(ev.endDate)}</span>
                </div>
                <h4>{ev.name}</h4>
                <p className="f1-schedule-circuit">{ev.circuitName || ev.circuitCity} {ev.circuitCountry && ` · ${ev.circuitCountry}`}</p>
                <div className="f1-sessions">
                  {(ev.sessions || []).map((s) => (
                    <div key={s.id || s.type} className="f1-session-row">
                      <span className="f1-session-label">{s.label || s.type}</span>
                      <span className="f1-session-time">{toLocalSessionTime(s.startDate)}</span>
                      {s.shortDetail && <span className="f1-session-status">{s.shortDetail}</span>}
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && f1Tab === 'live' && renderLiveContent && renderLiveContent()}

      {!loading && !error && f1Tab === 'results' && (
        <div className="f1-results fade-in">
          <h3 className="f1-panel-title">Race results</h3>
          {completedEvents.length > 0 ? (
            <>
              <p className="f1-results-pick">Select a completed race to view finishing order and points.</p>
              <div className="f1-results-select-wrap">
                <select
                  className="f1-results-select"
                  value={selectedResultEventId || ''}
                  onChange={(e) => setSelectedResultEventId(e.target.value || null)}
                  aria-label="Select race"
                >
                  <option value="">— Select race —</option>
                  {completedEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name} — {toLocalDate(ev.endDate)}</option>
                  ))}
                </select>
              </div>
              {resultsLoading && <div className="f1-results-loading"><div className="loader" /> <span>Loading results…</span></div>}
              {!resultsLoading && raceResults && raceResults.results?.length > 0 && (
                <div className="f1-results-table-wrap">
                  <h4 className="f1-results-event-name">{raceResults.eventName}</h4>
                  <table className="standings-table f1-table">
                    <thead>
                      <tr><th>Pos</th><th>Driver</th><th>Team</th><th>Pts</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {raceResults.results.map((r, i) => (
                        <tr key={r.driverId || i}>
                          <td className="pos-cell">{r.position}</td>
                          <td className="f1-driver-name">{r.driverName}</td>
                          <td>{r.team}</td>
                          <td>{r.points}</td>
                          <td className="f1-result-status">{r.status || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!resultsLoading && selectedResultEventId && raceResults && (!raceResults.results || raceResults.results.length === 0) && (
                <p className="f1-fallback-msg">Results for this race are not yet available from the feed. Try again later.</p>
              )}
            </>
          ) : (
            <p className="f1-fallback-msg">No completed races this season yet. After a race finishes, you can view results here.</p>
          )}
        </div>
      )}

      {!loading && !error && f1Tab === 'drivers' && (
        <div className="f1-drivers fade-in">
          <h3 className="f1-panel-title">Drivers</h3>
          <p className="f1-drivers-hint">Click a driver for profile.</p>
          <div className="f1-drivers-table-wrap">
            <table className="standings-table f1-table">
              <thead>
                <tr><th>Pos</th><th>Driver</th><th>Team</th><th>Pts</th><th>Wins</th></tr>
              </thead>
              <tbody>
                {driverStandings.map((d, i) => (
                  <tr
                    key={d.driverId || i}
                    className="f1-row-clickable"
                    onClick={() => setProfileDriver(d)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileDriver(d); } }}
                    aria-label={`View profile for ${d.driverName}`}
                  >
                    <td className="pos-cell">{d.position}</td>
                    <td>
                      {d.flagUrl && <img src={d.flagUrl} alt="" className="f1-flag" />}
                      <span className="f1-driver-name">{d.driverName}</span>
                      {d.nationality && <span className="f1-nationality"> ({d.nationality})</span>}
                    </td>
                    <td>{d.team}</td>
                    <td>{d.points}</td>
                    <td>{d.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && f1Tab === 'teams' && (
        <div className="f1-teams fade-in">
          <h3 className="f1-panel-title">Constructors</h3>
          <p className="f1-teams-hint">Click a team for profile.</p>
          <div className="f1-teams-grid">
            {constructorStandings.map((c, i) => (
              <div
                key={c.teamId || i}
                className="f1-team-card f1-card-clickable"
                onClick={() => setProfileTeam(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileTeam(c); } }}
                aria-label={`View profile for ${c.teamName}`}
              >
                <div className="f1-team-logo-wrap">
                  {c.logo ? (
                    <img src={c.logo} alt="" className="f1-team-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; const next = e.target.nextElementSibling; if (next) next.style.display = 'flex'; }} />
                  ) : null}
                  <span className="f1-team-logo-fallback" style={{ display: c.logo ? 'none' : 'flex' }} aria-hidden>{(c.teamName || 'T').charAt(0)}</span>
                </div>
                <div className="f1-team-info">
                  <span className="f1-team-pos">{c.position}</span>
                  <h4 className="f1-team-name">{c.teamName}</h4>
                  <p className="f1-team-pts">{c.points} pts · {c.wins} wins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && f1Tab === 'standings' && (
        <div className="f1-standings-full fade-in">
          <h3 className="f1-panel-title">Driver standings</h3>
          <p className="f1-drivers-hint">Click a driver for profile.</p>
          <div className="f1-standings-table-wrap">
            <table className="standings-table f1-table">
              <thead>
                <tr><th>Pos</th><th>Driver</th><th>Team</th><th>Pts</th><th>Wins</th></tr>
              </thead>
              <tbody>
                {driverStandings.map((d, i) => (
                  <tr
                    key={d.driverId || i}
                    className="f1-row-clickable"
                    onClick={() => setProfileDriver(d)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileDriver(d); } }}
                    aria-label={`View profile for ${d.driverName}`}
                  >
                    <td className="pos-cell">{d.position}</td>
                    <td>
                      {d.flagUrl && <img src={d.flagUrl} alt="" className="f1-flag" />}
                      {d.driverName}
                      {d.nationality && <span className="f1-nationality"> ({d.nationality})</span>}
                    </td>
                    <td>{d.team}</td>
                    <td>{d.points}</td>
                    <td>{d.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="f1-panel-title" style={{ marginTop: '24px' }}>Constructor standings</h3>
          <p className="f1-teams-hint">Click a team for profile.</p>
          <div className="f1-standings-table-wrap">
            <table className="standings-table f1-table">
              <thead>
                <tr><th>Pos</th><th>Team</th><th>Pts</th><th>Wins</th></tr>
              </thead>
              <tbody>
                {constructorStandings.map((c, i) => (
                  <tr
                    key={c.teamId || i}
                    className="f1-row-clickable"
                    onClick={() => setProfileTeam(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileTeam(c); } }}
                    aria-label={`View profile for ${c.teamName}`}
                  >
                    <td className="pos-cell">{c.position}</td>
                    <td>
                      {c.logo ? <img src={c.logo} alt="" className="f1-flag" style={{ width: 24, height: 24, marginRight: 8 }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} /> : null}
                      {c.teamName}
                    </td>
                    <td>{c.points}</td>
                    <td>{c.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {profileDriver && (
        <div className="f1-modal-backdrop" onClick={() => setProfileDriver(null)} role="presentation">
          <div className="f1-modal f1-profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="f1-driver-profile-title">
            <div className="f1-modal-header">
              <h3 id="f1-driver-profile-title" className="f1-modal-title">Driver profile</h3>
              <button type="button" className="f1-modal-close" onClick={() => setProfileDriver(null)} aria-label="Close">×</button>
            </div>
            <div className="f1-profile-body">
              <div className="f1-profile-head">
                {profileDriver.flagUrl && <img src={profileDriver.flagUrl} alt="" className="f1-flag f1-profile-flag" />}
                <div>
                  <h4 className="f1-profile-name">{profileDriver.driverName}</h4>
                  {profileDriver.nationality && <p className="f1-profile-meta">{profileDriver.nationality}</p>}
                  {profileDriver.team && <p className="f1-profile-meta">Team: {profileDriver.team}</p>}
                </div>
              </div>
              <div className="f1-profile-stats">
                <div className="f1-profile-stat"><span className="f1-profile-stat-value">{profileDriver.points}</span><span className="f1-profile-stat-label">Points</span></div>
                <div className="f1-profile-stat"><span className="f1-profile-stat-value">{profileDriver.wins}</span><span className="f1-profile-stat-label">Wins</span></div>
                <div className="f1-profile-stat"><span className="f1-profile-stat-value">#{profileDriver.position}</span><span className="f1-profile-stat-label">Standings</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {profileTeam && (
        <div className="f1-modal-backdrop" onClick={() => setProfileTeam(null)} role="presentation">
          <div className="f1-modal f1-profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="f1-team-profile-title">
            <div className="f1-modal-header">
              <h3 id="f1-team-profile-title" className="f1-modal-title">Constructor profile</h3>
              <button type="button" className="f1-modal-close" onClick={() => setProfileTeam(null)} aria-label="Close">×</button>
            </div>
            <div className="f1-profile-body">
              <div className="f1-profile-head f1-profile-head--team">
                <div className="f1-team-logo-wrap">
                  {profileTeam.logo ? (
                    <img src={profileTeam.logo} alt="" className="f1-team-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  ) : null}
                  <span className="f1-team-logo-fallback" style={{ display: profileTeam.logo ? 'none' : 'flex' }}>{(profileTeam.teamName || 'T').charAt(0)}</span>
                </div>
                <div>
                  <h4 className="f1-profile-name">{profileTeam.teamName}</h4>
                  <p className="f1-profile-meta">P{profileTeam.position} · {profileTeam.points} pts · {profileTeam.wins} wins</p>
                </div>
              </div>
              <div className="f1-profile-drivers">
                <h5 className="f1-profile-drivers-title">Drivers</h5>
                <ul className="f1-profile-drivers-list">
                  {driverStandings.filter((d) => d.team === profileTeam.teamName).map((d, i) => (
                    <li key={d.driverId || i}>
                      {d.flagUrl && <img src={d.flagUrl} alt="" className="f1-flag" />}
                      <span>{d.driverName}</span>
                      <span className="f1-profile-driver-pts">{d.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook: load F1 calendar + standings when sport is F1 and tab is f1. */
export function useF1Data(selectedSport, currentTab) {
  const [data, setData] = React.useState({ calendar: null, standings: null });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const isF1 = selectedSport === 'f1' && currentTab === 'f1';

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [calendar, standings] = await Promise.all([getRaceCalendar(), getStandings()]);
      setData({ calendar, standings });
    } catch (e) {
      setError(e?.message || 'Failed to load F1 data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isF1) return;
    load();
  }, [isF1, load]);

  return { ...data, loading, error, refresh: load };
}

function toLocalDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
