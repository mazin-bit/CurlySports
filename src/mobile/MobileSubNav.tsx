import React, { useRef, useEffect } from 'react';

interface MobileSubNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  items: { id: string; label: string; logo?: string }[];
}

export function MobileSubNav({ currentTab, setTab, items }: MobileSubNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('.mobile-sub-nav__item.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentTab]);

  if (items.length === 0) return null;

  return (
    <div className="mobile-sub-nav" ref={scrollRef}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-sub-nav__item${currentTab === item.id ? ' active' : ''}`}
          onClick={() => setTab(item.id)}
        >
          {item.logo && (
            <img src={item.logo} alt="" onError={(e: any) => { e.target.style.display = 'none'; }} />
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}
