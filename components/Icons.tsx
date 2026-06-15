/* SVG icon library — matches app-shell.js symbols */
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="s-soccer" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6"/>
          <polygon points="12,7 15.5,10 14,14 10,14 8.5,10" fill="currentColor" opacity="0.85"/>
          <path d="M12 3v4M3.5 9 8 10M20.5 9 16 10M15 19l-1-5M9 19l1-5" fill="none" stroke="currentColor" strokeWidth="1.6"/>
        </symbol>
        <symbol id="s-cricket" viewBox="0 0 24 24">
          <path d="M4 20 17 7l3 3-13 13z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 4l3 3M3 21l4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <circle cx="6" cy="6" r="2.2" fill="currentColor" opacity="0.7"/>
        </symbol>
        <symbol id="s-basket" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M12 3v18M3 12h18M5.6 5.6Q12 12 5.6 18.4M18.4 5.6Q12 12 18.4 18.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </symbol>
        <symbol id="s-f1" viewBox="0 0 24 24">
          <path d="M2 14h3l1-3h4l-1-3h6l2 3h5v3l-2 1h-2l-1 2h-3l-1-2H8l-1 2H4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="7" cy="17" r="1.4" fill="currentColor"/>
          <circle cx="17" cy="17" r="1.4" fill="currentColor"/>
        </symbol>
        <symbol id="s-tennis" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M3 8 Q12 14 3 19M21 5 Q12 11 21 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </symbol>
        <symbol id="s-mma" viewBox="0 0 24 24">
          <path d="M7 4h8a3 3 0 0 1 3 3v3a4 4 0 0 1-1 2.5l-1 1.5v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6L5 13a4 4 0 0 1-1-3V7a3 3 0 0 1 3-3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 4v6M14 4v6M11 14h3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </symbol>
        <symbol id="s-nfl" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-15 12 12)" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M8 12h8M10 10v4M12 10v4M14 10v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </symbol>
        <symbol id="s-baseball" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M3 8 Q12 14 3 19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="1.5,2"/>
          <path d="M21 5 Q12 11 21 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="1.5,2"/>
        </symbol>
        <symbol id="s-golf" viewBox="0 0 24 24">
          <path d="M8 21V3l8 4-8 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <ellipse cx="10" cy="21" rx="6" ry="1.3" fill="none" stroke="currentColor" strokeWidth="1.8"/>
        </symbol>
        <symbol id="s-boxing" viewBox="0 0 24 24">
          <path d="M9 3h6a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4l-2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a4 4 0 0 1 1-2.5L7 9z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        {/* UI icons */}
        <symbol id="i-home" viewBox="0 0 24 24">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-live" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M5.6 5.6l-2-2M20.4 5.6l2-2M5.6 18.4l-2 2M20.4 18.4l2 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24">
          <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2v6zm12 0h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2v6zM6 3h12v8a6 6 0 0 1-12 0V3zM8 21h8M12 17v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-team" viewBox="0 0 24 24">
          <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 21v-1a8 8 0 0 1 16 0v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-news" viewBox="0 0 24 24">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8V6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-video" viewBox="0 0 24 24">
          <polygon points="23 7 16 12 23 17 23 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="1" y="5" width="15" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
        </symbol>
        <symbol id="i-game" viewBox="0 0 24 24">
          <line x1="6" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="8" y1="9" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="15" y1="12" x2="15.01" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="18" y1="10" x2="18.01" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M17.3 5H6.7a4 4 0 0 0-4 3.6c-.1 1-.7 6-.7 7.4a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.3a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.3A4 4 0 0 0 17.3 5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-debate" viewBox="0 0 24 24">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.4-.8L3 21l1.9-5.6a8.4 8.4 0 1 1 16.1-3.9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-spark" viewBox="0 0 24 24">
          <path d="M12 3l2.2 6L20 11l-5.8 2L12 19l-2.2-6L4 11l5.8-2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-heart" viewBox="0 0 24 24">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 21l-4.3-4.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-chevron-down" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-star" viewBox="0 0 24 24">
          <path d="M12 2l2.85 6.9 7.4.7-5.6 5 1.7 7.3L12 18l-6.35 3.9 1.7-7.3-5.6-5 7.4-.7z" fill="currentColor"/>
        </symbol>
        <symbol id="i-flame" viewBox="0 0 24 24">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24">
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-cog" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-close" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-bars" viewBox="0 0 24 24">
          <path d="M3 21V3M3 21h18M7 14v4M12 9v9M17 5v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-arrow-right" viewBox="0 0 24 24">
          <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-play" viewBox="0 0 24 24">
          <polygon points="6,4 22,12 6,20" fill="currentColor"/>
        </symbol>
        <symbol id="i-share" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-bookmark" viewBox="0 0 24 24">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
        <symbol id="i-globe" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </symbol>
        <symbol id="i-logout" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
      </defs>
    </svg>
  );
}

export function Ico({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}
