import React, { useRef, useEffect } from 'react';

const SPORT_ICONS: Record<string, string> = {
  soccer: 'sports_soccer',
  basketball: 'sports_basketball',
  football: 'sports_football',
  baseball: 'sports_baseball',
  hockey: 'sports_hockey',
  cricket: 'sports_cricket',
  f1: 'emoji_events',
};

const SPORT_LABELS: Record<string, string> = {
  soccer: 'Soccer',
  basketball: 'Basketball',
  football: 'Football',
  baseball: 'Baseball',
  hockey: 'Hockey',
  cricket: 'Cricket',
  f1: 'F1',
};

interface MobileSportBarProps {
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  enabledSportKeys: string[];
}

export function MobileSportBar({ selectedSport, setSelectedSport, enabledSportKeys }: MobileSportBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active chip into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('.mobile-sport-chip.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedSport]);

  if (enabledSportKeys.length <= 1) return null;

  return (
    <div className="mobile-sport-bar" ref={scrollRef}>
      {enabledSportKeys.map((key) => (
        <button
          key={key}
          className={`mobile-sport-chip${selectedSport === key ? ' active' : ''}`}
          onClick={() => setSelectedSport(key)}
        >
          <span className="material-icons-round" aria-hidden="true">
            {SPORT_ICONS[key] || 'sports'}
          </span>
          {SPORT_LABELS[key] || key}
        </button>
      ))}
    </div>
  );
}
