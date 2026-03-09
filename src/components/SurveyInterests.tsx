// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { setUserData } from '../services/database';
import '../styles/SurveyInterests.css';

const CONTENT_TYPES = [
  { key: 'news', label: 'News & updates', icon: 'article' },
  { key: 'matchReports', label: 'Match reports', icon: 'sports_soccer' },
  { key: 'transferNews', label: 'Transfer news', icon: 'swap_horiz' },
  { key: 'liveScores', label: 'Live scores', icon: 'live_tv' },
  { key: 'playerStats', label: 'Player stats', icon: 'bar_chart' },
  { key: 'videos', label: 'Videos', icon: 'play_circle' },
];

const DEFAULT_CONTENT_TYPES = {
  news: true,
  matchReports: true,
  transferNews: true,
  liveScores: true,
  playerStats: true,
  videos: true,
};

/**
 * Signup survey: per-sport accordion.
 * User selects sports, then for each sport: favorite teams, players, and content types.
 * Optional "Skip for now" saves surveySkipped and lets user use the app with an empty dashboard.
 */
function SurveyInterests({
  user,
  sportsList = [],
  getSportData,
  initialSurveyInterests,
  initialFavoriteTeams = [],
  initialFavoritePlayers = [],
  onComplete,
  onSkip,
  onClose,
  onReportWrite,
  isModal = false,
}) {
  const [selectedSports, setSelectedSports] = useState([]);
  const [expandedSport, setExpandedSport] = useState(null);
  const [sportDataCache, setSportDataCache] = useState({});
  const [loadingSport, setLoadingSport] = useState(null);
  const [perSportSelections, setPerSportSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const errorRef = useRef(null);
  const submittingRef = useRef(false);
  const [showCancelSave, setShowCancelSave] = useState(false);
  const saveTimeoutRef = useRef(null);
  const cancelSaveRequestedRef = useRef(false);

  useEffect(() => {
    if (error && errorRef.current) {
      const t = setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Lock body scroll when survey is open to prevent background scrolling
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Initialize from saved survey only on mount (so unchecking a sport isn't overwritten by re-renders).
  // Only include sports that are in sportsList (feature-flag enabled); disabled sports are hidden from the survey.
  useEffect(() => {
    const allowedKeys = sportsList.map((s) => s.key);
    if (!initialSurveyInterests) {
      setSelectedSports([]);
      setPerSportSelections({});
      return;
    }
    if (initialSurveyInterests.sports && typeof initialSurveyInterests.sports === 'object') {
      const sports = Object.keys(initialSurveyInterests.sports).filter((k) => allowedKeys.includes(k));
      setSelectedSports(sports);
      const filtered = {};
      sports.forEach((k) => {
        if (initialSurveyInterests.sports[k]) filtered[k] = initialSurveyInterests.sports[k];
      });
      setPerSportSelections(filtered);
      return;
    }
    const firstKey = sportsList.length > 0 ? sportsList[0].key : 'soccer';
    setSelectedSports([firstKey]);
    setPerSportSelections({
      [firstKey]: {
        favoriteTeams: initialSurveyInterests.favoriteTeams || initialFavoriteTeams || [],
        favoritePlayers: initialSurveyInterests.favoritePlayers || initialFavoritePlayers || [],
        contentTypes: initialSurveyInterests.contentTypes || { ...DEFAULT_CONTENT_TYPES },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When sportsList changes (e.g. feature flags updated — a sport turned off), remove that sport from selection
  const sportsListKeys = sportsList.map((s) => s.key).sort().join(',');
  const prevSportsListKeysRef = useRef(null);
  useEffect(() => {
    if (prevSportsListKeysRef.current === null) {
      prevSportsListKeysRef.current = sportsListKeys;
      return;
    }
    if (prevSportsListKeysRef.current === sportsListKeys) return;
    prevSportsListKeysRef.current = sportsListKeys;
    setSelectedSports((prev) => prev.filter((k) => sportsList.some((s) => s.key === k)));
    setPerSportSelections((prev) => {
      const next = {};
      sportsList.forEach((s) => {
        if (prev[s.key]) next[s.key] = prev[s.key];
      });
      return next;
    });
  }, [sportsListKeys, sportsList]);

  const loadSportData = useCallback(
    async (sportKey) => {
      if (sportDataCache[sportKey]) return;
      if (!getSportData) return;
      setLoadingSport(sportKey);
      try {
        const data = await getSportData(sportKey);
        setSportDataCache((prev) => ({ ...prev, [sportKey]: data }));
      } finally {
        setLoadingSport(null);
      }
    },
    [getSportData, sportDataCache]
  );

  const toggleSportSelected = (sportKey) => {
    setSelectedSports((prev) =>
      prev.includes(sportKey) ? prev.filter((k) => k !== sportKey) : [...prev, sportKey]
    );
    if (expandedSport === sportKey) setExpandedSport(null);
  };

  const toggleExpanded = (sportKey) => {
    if (expandedSport === sportKey) {
      setExpandedSport(null);
      return;
    }
    setExpandedSport(sportKey);
    if (!sportDataCache[sportKey]) loadSportData(sportKey);
  };

  const getOrInitSelections = (sportKey) => {
    return (
      perSportSelections[sportKey] || {
        favoriteTeams: [],
        favoritePlayers: [],
        contentTypes: { ...DEFAULT_CONTENT_TYPES },
      }
    );
  };

  const setSelectionsForSport = (sportKey, updater) => {
    setPerSportSelections((prev) => ({
      ...prev,
      [sportKey]: updater(getOrInitSelections(sportKey)),
    }));
  };

  const toggleTeam = (sportKey, name) => {
    setSelectionsForSport(sportKey, (s) => ({
      ...s,
      favoriteTeams: s.favoriteTeams.includes(name)
        ? s.favoriteTeams.filter((t) => t !== name)
        : [...s.favoriteTeams, name],
    }));
  };

  const togglePlayer = (sportKey, id) => {
    const idStr = String(id);
    setSelectionsForSport(sportKey, (s) => ({
      ...s,
      favoritePlayers: s.favoritePlayers.some((p) => String(p) === idStr)
        ? s.favoritePlayers.filter((p) => String(p) !== idStr)
        : [...s.favoritePlayers, id],
    }));
  };

  const toggleContentType = (sportKey, key) => {
    setSelectionsForSport(sportKey, (s) => ({
      ...s,
      contentTypes: { ...s.contentTypes, [key]: !s.contentTypes[key] },
    }));
  };

  const validate = () => {
    if (selectedSports.length === 0) {
      if (isModal) return true;
      setError('Please select at least one sport.');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      return false;
    }
    if (isModal) return true;
    for (const sportKey of selectedSports) {
      const s = getOrInitSelections(sportKey);
      if (!s.favoriteTeams?.length) {
        setError(`Expand "${sportsList.find((x) => x.key === sportKey)?.label || sportKey}" and select at least one favorite team.`);
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        return false;
      }
      if (!s.favoritePlayers?.length) {
        setError(`Select at least one favorite player for ${sportsList.find((x) => x.key === sportKey)?.label || sportKey}.`);
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        return false;
      }
      const hasContent = s.contentTypes && Object.values(s.contentTypes).some(Boolean);
      if (!hasContent) {
        setError(`Select at least one content type (e.g. News, Live scores) for ${sportsList.find((x) => x.key === sportKey)?.label || sportKey}.`);
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        return false;
      }
    }
    return true;
  };

  /** Remove undefined so Firestore accepts the payload (Firestore rejects undefined values). */
  const sanitizeForFirestore = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (typeof obj !== 'object') return obj;
    const out = {};
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v !== undefined) out[k] = sanitizeForFirestore(v);
    });
    return out;
  };

  /** Build survey payload from current state (for submit and auto-save). Returns null only when no user. */
  const buildSurveyPayload = useCallback(() => {
    const sports = {};
    const allTeams = [];
    const allPlayers = [];
    selectedSports.forEach((sportKey) => {
      const s = perSportSelections[sportKey] || {
        favoriteTeams: [],
        favoritePlayers: [],
        contentTypes: { ...DEFAULT_CONTENT_TYPES },
      };
      sports[sportKey] = {
        favoriteTeams: s.favoriteTeams || [],
        favoritePlayers: s.favoritePlayers || [],
        contentTypes: s.contentTypes || { ...DEFAULT_CONTENT_TYPES },
      };
      allTeams.push(...(s.favoriteTeams || []));
      allPlayers.push(...(s.favoritePlayers || []));
    });
    const uniqueTeams = [...new Set(allTeams)];
    const uniquePlayers = [...new Set(allPlayers)].map((p) =>
      typeof p === 'number' || typeof p === 'string' ? p : String(p)
    );
    return sanitizeForFirestore({
      surveyCompleted: selectedSports.length > 0,
      surveySkipped: false,
      surveyInterests: { sports },
      favoriteClubs: uniqueTeams,
      favoritePlayers: uniquePlayers,
    });
  }, [selectedSports, perSportSelections]);

  // Auto-save when interests change (debounced), including when deselecting
  const autoSaveRef = useRef(null);
  useEffect(() => {
    if (!user?.uid) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      autoSaveRef.current = null;
      const payload = buildSurveyPayload();
      if (payload) {
        setUserData(user.uid, payload)
          .then(() => { onReportWrite && onReportWrite(); })
          .catch((e) => console.warn('Survey auto-save failed:', e));
      }
    }, 600);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [user?.uid, selectedSports, perSportSelections, buildSurveyPayload]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current || submitting) return;
    setError('');
    setSaveFailed(false);
    if (!validate()) return;
    const uid = user?.uid;
    if (!uid) {
      setError('Not signed in. Please refresh and try again.');
      return;
    }
    if (!onComplete) {
      setError('Something went wrong. Please refresh the page.');
      return;
    }
    const payload = buildSurveyPayload();
    if (!payload) {
      setError('Please select at least one sport.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setShowCancelSave(false);
    setError('');
    saveTimeoutRef.current = setTimeout(() => setShowCancelSave(true), 7000);
    const savePromise = setUserData(uid, payload);
    const maxWaitMs = 15000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('save_timeout')), maxWaitMs)
    );
    try {
      await Promise.race([savePromise, timeoutPromise]);
      onReportWrite && onReportWrite();
      if (cancelSaveRequestedRef.current) return;
      try {
        onComplete(payload);
      } catch (callbackErr) {
        console.error('Survey onComplete error:', callbackErr);
        setSaveFailed(true);
        setError(callbackErr?.message || 'Something went wrong. You can close and try again.');
      }
    } catch (err) {
      if (cancelSaveRequestedRef.current) return;
      if (err?.message === 'save_timeout') {
        setError('Taking longer than expected. Closing – we\'ll keep syncing in the background.');
        try { onComplete(payload); } catch (_) { }
        setUserData(uid, payload).catch((e) => console.warn('Survey background sync failed:', e));
      } else {
        setSaveFailed(true);
        const code = err?.code || '';
        const msg = err?.message || '';
        setError(
          code === 'permission-denied'
            ? "You don't have permission to save. Sign in and try again."
            : code === 'unavailable' || code === 'resource-exhausted'
              ? 'Service temporarily unavailable. Try again in a moment.'
              : msg.toLowerCase().includes('timeout')
                ? 'Save took too long. Check your connection and try again.'
                : msg || 'Could not save. Check your connection and try again.'
        );
      }
    } finally {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      submittingRef.current = false;
      setSubmitting(false);
      setShowCancelSave(false);
    }
  };

  const handleCancelSave = () => {
    cancelSaveRequestedRef.current = true;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setShowCancelSave(false);
    submittingRef.current = false;
    setSubmitting(false);
    setError('Save cancelled. Try again when your connection is ready.');
  };

  const handleSkip = async () => {
    if (!user?.uid) {
      setError('Not signed in. Please refresh and try again.');
      return;
    }
    if (!onSkip) {
      setError('Something went wrong. Please refresh.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const savePromise = setUserData(user.uid, { surveySkipped: true });
      const timeoutMs = 12000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out.')), timeoutMs)
      );
      await Promise.race([savePromise, timeoutPromise]);
      onSkip();
    } catch (err) {
      console.error('Survey skip save error:', err);
      setError(err?.message || 'Could not save. Try again or check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-interests-overlay" role="dialog" aria-labelledby="survey-title">
      <div className={`survey-interests-panel ${isModal ? 'survey-interests-panel-modal' : ''}`}>
        {isModal && onClose && (
          <button
            type="button"
            className="survey-interests-close"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        )}
        <h2 id="survey-title" className="survey-title">
          {isModal ? 'Update your interests' : 'Welcome — set your interests'}
        </h2>
        <p className="survey-desc">
          Select the sports you follow, then for each sport choose favorite teams, players, and the content you want on your dashboard.
        </p>

        {sportsList.length === 0 ? (
          <div className="survey-no-sports" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>
            <p style={{ marginBottom: 16 }}>No sports are currently available. Your admin can enable sports in Feature Flags.</p>
            {onSkip && (
              <button type="button" className="survey-skip-btn" onClick={handleSkip}>
                Continue anyway
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="survey-form">
            <section className="survey-section">
              <h3 className="survey-section-title">Sports you follow</h3>
              <p className="survey-hint">Select at least one sport. Then expand each to fill required details.</p>
              <div className="survey-sports-accordion">
                {sportsList.map(({ key: sportKey, label }) => {
                  const isSelected = selectedSports.includes(sportKey);
                  const isExpanded = expandedSport === sportKey;
                  const data = sportDataCache[sportKey];
                  const loading = loadingSport === sportKey;
                  const selections = getOrInitSelections(sportKey);
                  const clubs = (data?.clubs || []).filter(Boolean);
                  const players = (data?.players || []).filter(Boolean);
                  return (
                    <div
                      key={sportKey}
                      className={`survey-accordion-item ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                    >
                      <div className="survey-accordion-header">
                        <label className="survey-accordion-check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSportSelected(sportKey)}
                          />
                          <span className="survey-accordion-label">{label}</span>
                        </label>
                        {isSelected && (
                          <button
                            type="button"
                            className="survey-accordion-toggle"
                            onClick={() => toggleExpanded(sportKey)}
                            aria-expanded={isExpanded}
                          >
                            <span className="material-icons-round">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        )}
                      </div>
                      {isSelected && (
                        <div className="survey-accordion-body">
                          {loading && (
                            <p className="survey-loading">Loading teams and players…</p>
                          )}
                          {!loading && isExpanded && (
                            <>
                              <div className="survey-subsection">
                                <h4 className="survey-subtitle">Favorite teams (required)</h4>
                                <div className="survey-chips">
                                  {clubs.slice(0, 60).map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      className={`survey-chip ${selections.favoriteTeams.includes(c.name) ? 'active' : ''}`}
                                      onClick={() => toggleTeam(sportKey, c.name)}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                                {selections.favoriteTeams.length > 0 && (
                                  <p className="survey-selected">
                                    Selected: {selections.favoriteTeams.join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="survey-subsection">
                                <h4 className="survey-subtitle">Favorite players (required)</h4>
                                <div className="survey-chips">
                                  {players.slice(0, 60).map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className={`survey-chip ${selections.favoritePlayers.some((id) => String(id) === String(p.id)) ? 'active' : ''}`}
                                      onClick={() => togglePlayer(sportKey, p.id)}
                                    >
                                      {p.name}
                                    </button>
                                  ))}
                                </div>
                                {selections.favoritePlayers.length > 0 && (
                                  <p className="survey-selected">
                                    Selected: {selections.favoritePlayers.length} player(s)
                                  </p>
                                )}
                              </div>
                              <div className="survey-subsection">
                                <h4 className="survey-subtitle">Content you want (at least one)</h4>
                                <div className="survey-content-types">
                                  {CONTENT_TYPES.map(({ key, label: ctLabel, icon }) => (
                                    <label key={key} className="survey-check-wrap survey-content-check">
                                      <input
                                        type="checkbox"
                                        checked={selections.contentTypes[key] === true}
                                        onChange={() => toggleContentType(sportKey, key)}
                                      />
                                      <span className="material-icons-round">{icon}</span>
                                      <span>{ctLabel}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {error && (
              <div ref={errorRef} className="survey-error-wrap" role="alert">
                <p className="survey-error">{error}</p>
                {saveFailed && (
                  <>
                    {onSkip && (
                      <button
                        type="button"
                        className="survey-continue-anyway"
                        onClick={() => onSkip()}
                      >
                        Continue to dashboard anyway
                      </button>
                    )}
                    {isModal && onClose && (
                      <button
                        type="button"
                        className="survey-continue-anyway"
                        onClick={() => onClose()}
                      >
                        Close
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="survey-actions">
              <button
                type="submit"
                className="survey-submit"
                disabled={submitting}
                onClick={(ev) => {
                  ev.preventDefault();
                  handleSubmit(ev);
                }}
              >
                {submitting ? 'Saving…' : isModal ? 'Save & update' : 'Save & go to dashboard'}
              </button>
              {showCancelSave && submitting && (
                <button
                  type="button"
                  className="survey-skip"
                  onClick={handleCancelSave}
                >
                  Cancel save
                </button>
              )}
              {!isModal && onSkip && (
                <button
                  type="button"
                  className="survey-skip"
                  onClick={handleSkip}
                  disabled={submitting}
                >
                  Skip for now
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SurveyInterests;
