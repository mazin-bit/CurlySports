'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  slot: string;
}

const MIN_H: Record<string, number> = { banner: 90, square: 200, strip: 72, compact: 62, card: 180, feed: 80, match: 90, sidebar: 200 };

interface AdSlotProps {
  size?: 'banner' | 'square' | 'strip' | 'compact' | 'card' | 'feed' | 'match' | 'sidebar';
  label?: string;
  interval?: number;
}

export default function AdSlot({ size = 'banner', label = 'Advertisement', interval = 5000 }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliding, setSliding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/ads/active?slot=${size}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ads?.length > 0) setAds(data.ads);
      })
      .catch(() => {});
  }, [size]);

  const trackImpression = useCallback((ad: Ad) => {
    if (trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, type: 'impression' }),
    }).catch(() => {});
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % ads.length);
        setSliding(false);
      }, 400);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [ads.length, interval]);

  useEffect(() => {
    if (ads[activeIdx]) trackImpression(ads[activeIdx]);
  }, [activeIdx, ads, trackImpression]);

  if (ads.length === 0) return null;

  const ad = ads[activeIdx];
  const compact = size === 'compact';
  const strip = size === 'strip';

  const handleClick = () => {
    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, type: 'click' }),
    }).catch(() => {});
    window.open(ad.linkUrl, '_blank', 'noopener');
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', cursor: 'pointer', overflow: 'hidden' }}
      aria-label="Sponsored content"
      onClick={handleClick}
    >
      <div style={{
        background: 'var(--bg-3)',
        border: strip ? 'none' : `${compact ? 1.5 : 2}px solid var(--border-2)`,
        borderTop: strip ? '2px solid var(--border-3)' : undefined,
        borderBottom: strip ? '2px solid var(--border-3)' : undefined,
        borderRadius: strip ? 0 : compact ? 'var(--r-sm)' : 'var(--r-md)',
        minHeight: MIN_H[size],
        overflow: 'hidden',
        position: 'relative',
        transform: sliding ? 'translateX(-100%)' : 'translateX(0)',
        opacity: sliding ? 0 : 1,
        transition: sliding ? 'transform 0.4s ease-in-out, opacity 0.3s ease-in-out' : 'none',
      }}>
        <span style={{
          position: 'absolute', top: compact ? 5 : 8, left: compact ? 7 : 10, zIndex: 2,
          fontFamily: 'var(--mono)', fontSize: compact ? 8 : 9, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: 'var(--text-mute)', background: 'rgba(0,0,0,0.6)',
          border: '1.5px solid var(--border-2)', padding: '3px 7px', borderRadius: 4,
        }}>{label}</span>
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: MIN_H[size] }}
            loading="lazy"
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: strip || compact ? 'row' : 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: compact ? 8 : 12, padding: compact ? '10px 14px' : '24px 20px',
            textAlign: 'center' as const, minHeight: MIN_H[size],
          }}>
            <span style={{
              fontFamily: 'var(--display)', fontWeight: 700,
              fontSize: compact ? 13 : 16, color: 'var(--accent)',
            }}>{ad.title}</span>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          padding: '6px 0', position: 'absolute', bottom: 6,
          left: 0, right: 0,
        }}>
          {ads.map((_, i) => (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                clearInterval(timerRef.current);
                setActiveIdx(i);
              }}
              style={{
                width: i === activeIdx ? 16 : 6, height: 6,
                borderRadius: 3,
                background: i === activeIdx ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
