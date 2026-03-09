// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import '../styles/Dashboard.css';

/**
 * Dashboard: survey-based personalized feed. Shown when user selects Dashboard tab in the sidebar.
 * No top bar tabs or hamburger — content only.
 */
function Dashboard({
  user,
  userData,
  favorites,
  favoritePlayers,
  news,
  transferNews = [],
  matchReports = [],
  matches,
  allClubs,
  allPlayersIndex,
  onOpenMatch,
  selectedSport,
  surveySkipped = false,
  surveyCompleted = false,
  onOpenSurvey,
}) {
  const interests = userData?.surveyInterests || {};
  const sportsInterests = interests.sports && typeof interests.sports === 'object' ? interests.sports : null;

  const { favTeams, favPlayerIds, contentTypes } = useMemo(() => {
    if (sportsInterests && Object.keys(sportsInterests).length > 0) {
      const allTeams = [];
      const allPlayers = [];
      const mergedContent = { news: false, matchReports: false, transferNews: false, liveScores: false, playerStats: false, videos: false };
      Object.values(sportsInterests).forEach((s) => {
        if (s.favoriteTeams) allTeams.push(...s.favoriteTeams);
        if (s.favoritePlayers) allPlayers.push(...s.favoritePlayers);
        if (s.contentTypes) {
          Object.keys(s.contentTypes).forEach((k) => {
            if (s.contentTypes[k]) mergedContent[k] = true;
          });
        }
      });
      return {
        favTeams: [...new Set(allTeams)].length > 0 ? [...new Set(allTeams)] : (favorites || []),
        favPlayerIds: [...new Set(allPlayers)].length > 0 ? [...new Set(allPlayers)] : (favoritePlayers || []),
        contentTypes: mergedContent,
      };
    }
    return {
      favTeams: interests.favoriteTeams?.length > 0 ? interests.favoriteTeams : (favorites || []),
      favPlayerIds: interests.favoritePlayers?.length > 0 ? interests.favoritePlayers : (favoritePlayers || []),
      contentTypes: interests.contentTypes || {},
    };
  }, [sportsInterests, interests, favorites, favoritePlayers]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  const favoriteClubsList = useMemo(() => {
    if (!Array.isArray(favTeams) || favTeams.length === 0) return [];
    const seen = new Set();
    return allClubs.filter((c) => {
      if (!favTeams.includes(c.name)) return false;
      const key = c.id != null ? String(c.id) : c.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allClubs, favTeams]);

  const favoritePlayersList = useMemo(() => {
    if (!Array.isArray(favPlayerIds) || favPlayerIds.length === 0) return [];
    return favPlayerIds.map(id => {
      const p = allPlayersIndex?.[id];
      if (p) return p;
      return { id, name: 'Favorite Player' };
    });
  }, [favPlayerIds, allPlayersIndex]);

  const favTeamNamesOnly = useMemo(() => {
    if (!Array.isArray(favTeams) || favTeams.length === 0) return [];
    const namesFromClubs = new Set(favoriteClubsList.map((c) => c.name));
    return favTeams.filter((name) => !namesFromClubs.has(name));
  }, [favTeams, favoriteClubsList]);

  // All news from all sports and sources; show source on each card (many news)
  const showNews = contentTypes.news !== false;
  const dashboardNews = useMemo(() => {
    if (!showNews || !(news || []).length) return [];
    return (news || []).slice(0, 60);
  }, [showNews, news]);

  const DASHBOARD_NEWS_PER_PAGE = 6;
  const [dashboardNewsPage, setDashboardNewsPage] = useState(1);
  const dashboardNewsTotalPages = Math.max(1, Math.ceil(dashboardNews.length / DASHBOARD_NEWS_PER_PAGE));
  const dashboardNewsPaginated = dashboardNews.slice(
    (dashboardNewsPage - 1) * DASHBOARD_NEWS_PER_PAGE,
    dashboardNewsPage * DASHBOARD_NEWS_PER_PAGE
  );
  const showDashboardNewsPagination = dashboardNews.length > DASHBOARD_NEWS_PER_PAGE;

  useEffect(() => {
    setDashboardNewsPage(1);
  }, [dashboardNews.length]);

  // Match reports
  const reportsList = useMemo(() => {
    return (matchReports || []).slice(0, 60);
  }, [matchReports]);

  const DASHBOARD_REPORTS_PER_PAGE = 6;
  const [matchReportsPage, setMatchReportsPage] = useState(1);
  const matchReportsTotalPages = Math.max(1, Math.ceil(reportsList.length / DASHBOARD_REPORTS_PER_PAGE));
  const matchReportsPaginated = reportsList.slice(
    (matchReportsPage - 1) * DASHBOARD_REPORTS_PER_PAGE,
    matchReportsPage * DASHBOARD_REPORTS_PER_PAGE
  );
  const showMatchReportsPagination = reportsList.length > DASHBOARD_REPORTS_PER_PAGE;

  useEffect(() => {
    setMatchReportsPage(1);
  }, [reportsList.length]);

  // Transfer news
  const DASHBOARD_TRANSFER_PER_PAGE = 6;
  const [transferNewsPage, setTransferNewsPage] = useState(1);
  const transferNewsTotalPages = Math.max(1, Math.ceil((transferNews || []).length / DASHBOARD_TRANSFER_PER_PAGE));
  const transferNewsPaginated = (transferNews || []).slice(
    (transferNewsPage - 1) * DASHBOARD_TRANSFER_PER_PAGE,
    transferNewsPage * DASHBOARD_TRANSFER_PER_PAGE
  );
  const showTransferNewsPagination = (transferNews || []).length > DASHBOARD_TRANSFER_PER_PAGE;

  useEffect(() => {
    setTransferNewsPage(1);
  }, [(transferNews || []).length]);

  // Video highlights
  const videoHighlights = useMemo(() => {
    const allMatchesPool = Array.isArray(matches) ? matches : [];
    if (allMatchesPool.length === 0) return [];

    const chosenSports = sportsInterests ? Object.keys(sportsInterests) : [selectedSport || 'soccer'];
    const seen = new Set();
    const items = [];

    const completedChosen = allMatchesPool.filter(m =>
      m.isCompleted && (chosenSports.includes(m.sportKey || 'soccer'))
    );

    completedChosen.forEach((m) => {
      const home = (m.home || '').trim();
      const away = (m.away || '').trim();
      if (!home || !away) return;
      const key = `${home}__${away}__${m.id || ''}`;
      if (seen.has(key)) return;
      seen.add(key);

      const title = `${home} vs ${away} highlights`;
      const query = encodeURIComponent(title);
      const watchUrl = m.recapLink || `https://www.youtube.com/results?search_query=${query}`;

      const homeLogo = m.homeLogo || (allClubs || []).find((c) => (c.name || '').toLowerCase() === home.toLowerCase())?.logo;
      const awayLogo = m.awayLogo || (allClubs || []).find((c) => (c.name || '').toLowerCase() === away.toLowerCase())?.logo;
      const thumbnail = homeLogo || awayLogo || 'https://via.placeholder.com/400x220?text=Highlights';

      items.push({
        id: key,
        title: `${home} vs ${away}`,
        subtitle: m.league || m.status || 'Match Highlights',
        image: thumbnail,
        imageAway: awayLogo || thumbnail,
        url: watchUrl,
        isEspn: !!m.recapLink
      });
    });
    return items.slice(0, 12);
  }, [matches, sportsInterests, selectedSport, allClubs]);

  if (surveySkipped) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-main-new">
          <div className="dashboard-content">
            <div className="dashboard-empty-state">
              <span className="material-icons-round dashboard-empty-state-icon">dashboard_customize</span>
              <h1 className="dashboard-greeting">Your dashboard is empty</h1>
              <p className="dashboard-tagline">Fill in the short survey to get news, match reports, and highlights tailored to your favorite teams and players.</p>
              {onOpenSurvey && (
                <button type="button" className="dashboard-cta-btn" onClick={onOpenSurvey}>
                  <span className="material-icons-round">edit_note</span>
                  Fill the survey
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <main className="dashboard-main-new">
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div className="dashboard-welcome-row">
              <div className="dashboard-welcome-content">
                <h1 className="dashboard-greeting">
                  <span className="greeting-small">Good day,</span>
                  <span className="greeting-name">{displayName}</span>
                </h1>
                <p className="dashboard-tagline">Your personalized arena based on your interests.</p>
              </div>
              {surveyCompleted && onOpenSurvey && (
                <button type="button" className="dashboard-update-interests-btn" onClick={onOpenSurvey}>
                  <span className="material-icons-round">tune</span>
                  Configure interests
                </button>
              )}
            </div>
          </div>

          {showNews && (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">
                <span className="material-icons-round">article</span> Latest news
              </h2>
              {dashboardNews.length > 0 ? (
                <>
                  <div className="dashboard-news-grid">
                    {dashboardNewsPaginated.map((n, i) => (
                      <a
                        key={(dashboardNewsPage - 1) * DASHBOARD_NEWS_PER_PAGE + i}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dashboard-news-card"
                      >
                        <img src={n.image} alt="" className="dashboard-news-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200'; }} />
                        <span className="dashboard-news-tag">{n.source || n.tag}</span>
                        <h3 className="dashboard-news-title">{n.title}</h3>
                      </a>
                    ))}
                  </div>
                  {showDashboardNewsPagination && (
                    <div className="pagination-pro" style={{ marginTop: 24 }}>
                      <button
                        type="button"
                        className="pager-nav-btn"
                        disabled={dashboardNewsPage === 1}
                        onClick={() => { setDashboardNewsPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        aria-label="Previous page"
                      >
                        <span className="material-icons-round">chevron_left</span>
                      </button>
                      <div className="pager-list">
                        {Array.from({ length: dashboardNewsTotalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`pager-item ${dashboardNewsPage === p ? 'active' : ''}`}
                            onClick={() => { setDashboardNewsPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="pager-nav-btn"
                        disabled={dashboardNewsPage === dashboardNewsTotalPages}
                        onClick={() => { setDashboardNewsPage((p) => Math.min(dashboardNewsTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        aria-label="Next page"
                      >
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="dashboard-empty">
                  {favTeams.length > 0 || favoritePlayersList.length > 0
                    ? 'No news from your sources right now. Check back later.'
                    : 'News from all leagues and sources will appear here.'}
                </p>
              )}
            </section>
          )}

          {contentTypes.matchReports !== false && (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">
                <span className="material-icons-round">description</span> Match reports
              </h2>
              {reportsList.length > 0 ? (
                <>
                  <div className="dashboard-reports-grid">
                    {matchReportsPaginated.map((n, i) => (
                      <a
                        key={(matchReportsPage - 1) * DASHBOARD_REPORTS_PER_PAGE + i}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dashboard-report-card"
                      >
                        <div className="dashboard-report-img-wrap">
                          <img src={n.image} alt="" className="dashboard-report-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x220?text=Match+Report'; }} />
                          <span className="dashboard-report-badge">
                            <span className="material-icons-round" aria-hidden="true">sports_soccer</span>
                            {n.source || n.tag}
                          </span>
                        </div>
                        <div className="dashboard-report-body">
                          <h3 className="dashboard-report-title">{n.title}</h3>
                          {n.excerpt && <p className="dashboard-report-excerpt">{n.excerpt.slice(0, 140)}{n.excerpt.length > 140 ? '…' : ''}</p>}
                        </div>
                      </a>
                    ))}
                  </div>
                  {showMatchReportsPagination && (
                    <div className="pagination-pro" style={{ marginTop: 24 }}>
                      <button
                        type="button"
                        className="pager-nav-btn"
                        disabled={matchReportsPage === 1}
                        onClick={() => { setMatchReportsPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        aria-label="Previous page"
                      >
                        <span className="material-icons-round">chevron_left</span>
                      </button>
                      <div className="pager-list">
                        {Array.from({ length: matchReportsTotalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`pager-item ${matchReportsPage === p ? 'active' : ''}`}
                            onClick={() => { setMatchReportsPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="pager-nav-btn"
                        disabled={matchReportsPage === matchReportsTotalPages}
                        onClick={() => { setMatchReportsPage((p) => Math.min(matchReportsTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        aria-label="Next page"
                      >
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="dashboard-empty">
                  {favTeams.length > 0 || favoritePlayersList.length > 0
                    ? 'No match reports for your teams and players right now. Reports from your selected sports will appear here when available.'
                    : 'Add favorite teams or players in your survey to see match reports here.'}
                </p>
              )}
            </section>
          )}

          {contentTypes.transferNews !== false && (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">
                <span className="material-icons-round">swap_horiz</span> Transfer news
              </h2>
              <p className="dashboard-section-desc">From league feeds — transfers, signings, deals &amp; rumours.</p>
              {(transferNews || []).length > 0 ? (
                <>
                  <div className="dashboard-transfer-grid" aria-label="Transfer news">
                    {transferNewsPaginated.map((n, i) => (
                      <a
                        key={(transferNewsPage - 1) * DASHBOARD_TRANSFER_PER_PAGE + i}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dashboard-transfer-card"
                      >
                        <div className="dashboard-transfer-card-img-wrap">
                          <img src={n.image} alt="" className="dashboard-transfer-card-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x220?text=Transfer'; }} />
                          <span className="dashboard-transfer-card-badge">
                            <span className="material-icons-round">swap_horiz</span>
                            {n.source || n.tag}
                          </span>
                        </div>
                        <div className="dashboard-transfer-card-body">
                          <h3 className="dashboard-transfer-card-title">{n.title}</h3>
                          {n.excerpt && <p className="dashboard-transfer-card-excerpt">{n.excerpt.slice(0, 120)}{n.excerpt.length > 120 ? '…' : ''}</p>}
                          <span className="dashboard-transfer-card-link">
                            Read more <span className="material-icons-round">arrow_forward</span>
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="pagination-pro" style={{ marginTop: 24 }}>
                    <button
                      type="button"
                      className="pager-nav-btn"
                      disabled={transferNewsPage === 1}
                      onClick={() => { setTransferNewsPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      aria-label="Previous page"
                    >
                      <span className="material-icons-round">chevron_left</span>
                    </button>
                    <div className="pager-list">
                      {Array.from({ length: transferNewsTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`pager-item ${transferNewsPage === p ? 'active' : ''}`}
                          onClick={() => { setTransferNewsPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="pager-nav-btn"
                      disabled={transferNewsPage === transferNewsTotalPages}
                      onClick={() => { setTransferNewsPage((p) => Math.min(transferNewsTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      aria-label="Next page"
                    >
                      <span className="material-icons-round">chevron_right</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="dashboard-empty">
                  No transfer news from your selected sports right now. Updates will appear here when available from league feeds.
                </p>
              )}
            </section>
          )}

          {contentTypes.videos !== false && videoHighlights.length > 0 && (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">
                <span className="material-icons-round">play_circle</span> Match highlights
              </h2>
              <div className="dashboard-videos-grid">
                {videoHighlights.map((v) => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="dashboard-video-card">
                    <div className="dashboard-video-img-wrap">
                      <img src={v.image} alt="" className="dashboard-video-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x220?text=Highlights'; }} />
                      <div className="dashboard-video-play-overlay">
                        <span className="material-icons-round">play_arrow</span>
                      </div>
                      {v.isEspn && (
                        <span className="dashboard-video-espn-badge">ESPN recap</span>
                      )}
                    </div>
                    <div className="dashboard-video-body">
                      <h3 className="dashboard-video-title">{v.title}</h3>
                      <p className="dashboard-video-subtitle">{v.subtitle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(favTeams.length > 0 || favoritePlayersList.length > 0) && (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">
                <span className="material-icons-round">star</span> Your favorites
              </h2>
              {(favoriteClubsList.length > 0 || favTeamNamesOnly.length > 0) && (
                <div className="dashboard-fav-teams">
                  <h3 className="dashboard-subtitle">Teams</h3>
                  <div className="dashboard-fav-chips">
                    {favoriteClubsList.map((c) => (
                      <div key={c.id} className="dashboard-fav-chip">
                        <img src={c.logo} alt="" onError={(e) => { e.target.src = 'https://via.placeholder.com/32'; }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                    {favTeamNamesOnly.map((name) => (
                      <div key={name} className="dashboard-fav-chip dashboard-fav-chip-name-only">
                        <span className="material-icons-round">sports_soccer</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {favoritePlayersList.length > 0 && (
                <div className="dashboard-fav-players">
                  <h3 className="dashboard-subtitle">Players</h3>
                  <div className="dashboard-players-grid">
                    {favoritePlayersList.map((p) => (
                      <div key={p.id} className="dashboard-player-fav-card">
                        <span className="material-icons-round">person</span>
                        <div className="dashboard-player-fav-info">
                          <span className="dashboard-player-fav-name">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
