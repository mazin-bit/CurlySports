// @ts-nocheck
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';

const SPORTS_CONFIG = {
  soccer: { label: 'Soccer', icon: 'sports_soccer', path: 'soccer' },
  basketball: { label: 'Basketball', icon: 'sports_basketball', path: 'basketball' },
  football: { label: 'American Football', icon: 'sports_football', path: 'football' },
  baseball: { label: 'Baseball', icon: 'sports_baseball', path: 'baseball' },
  hockey: { label: 'Hockey', icon: 'sports_hockey', path: 'hockey' },
  cricket: { label: 'Cricket', icon: 'sports_cricket', path: 'cricket' },
  f1: { label: 'Formula 1', icon: 'sports_motorsports', path: 'racing' },
};

/** Label/icon for a sport key; use when sport may have been added in Super Admin but not yet in SPORTS_CONFIG. */
function getSportConfig(sportKey) {
  const c = SPORTS_CONFIG[sportKey];
  if (c) return c;
  const label = (sportKey || '').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { label: label || sportKey, icon: 'sports', path: sportKey };
}

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

export { SportDropdown };
export default SportDropdown;
