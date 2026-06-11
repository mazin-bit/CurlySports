'use client';
import React from 'react';

const MIN_H: Record<string, number> = { banner: 90, square: 200, strip: 72, compact: 62, card: 180 };

interface AdSlotProps {
  size?: 'banner' | 'square' | 'strip' | 'compact' | 'card';
  label?: string;
}

export default function AdSlot({ size = 'banner', label = 'Advertisement' }: AdSlotProps) {
  const compact = size === 'compact';
  const strip = size === 'strip';
  return (
    <div style={{ position: 'relative', width: '100%' }} aria-label="Sponsored content">
      <div style={{ background: 'var(--bg-3)', border: strip ? 'none' : `${compact ? 1.5 : 2}px dashed var(--border-2)`, borderTop: strip ? '2px solid var(--border-3)' : undefined, borderBottom: strip ? '2px solid var(--border-3)' : undefined, borderRadius: strip ? 0 : compact ? 'var(--r-sm)' : 'var(--r-md)', minHeight: MIN_H[size], display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        <span style={{ position: 'absolute', top: compact ? 5 : 8, left: compact ? 7 : 10, fontFamily: 'var(--mono)', fontSize: compact ? 8 : 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', background: 'var(--surface)', border: '1.5px solid var(--border-2)', padding: '3px 7px', borderRadius: 4 }}>{label}</span>
        <div style={{ display: 'flex', flexDirection: strip || compact ? 'row' : 'column', alignItems: 'center', gap: compact ? 8 : 6, padding: compact ? '10px 14px' : '24px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: compact ? 14 : 22, opacity: 0.35, color: 'var(--ink)', lineHeight: 1 }}>◈</span>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: compact ? 11 : 14, color: 'var(--text-mute)' }}>Your ad here</span>
          {!compact && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', opacity: 0.7, letterSpacing: '0.04em' }}>Premium sports audience · 2.1M+ fans</span>}
        </div>
      </div>
    </div>
  );
}
