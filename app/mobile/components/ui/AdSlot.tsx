'use client';
import React, { useEffect, useState } from 'react';

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  slot: string;
}

const MIN_H: Record<string, number> = { banner: 90, square: 200, strip: 72, compact: 62, card: 180 };

interface AdSlotProps {
  size?: 'banner' | 'square' | 'strip' | 'compact' | 'card';
  label?: string;
}

export default function AdSlot({ size = 'banner', label = 'Advertisement' }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    fetch(`/api/ads/active?slot=${size}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ads?.length > 0) setAd(data.ads[0]);
      })
      .catch(() => {});
  }, [size]);

  if (!ad) return null;

  const handleClick = () => {
    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, type: 'click' }),
    }).catch(() => {});
    window.open(ad.linkUrl, '_blank', 'noopener');
  };

  const compact = size === 'compact';
  const strip = size === 'strip';

  return (
    <div
      style={{ position: 'relative', width: '100%', cursor: 'pointer' }}
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
    </div>
  );
}
