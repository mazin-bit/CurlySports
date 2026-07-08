'use client';
import React from 'react';

/* ─── Shared shimmer style ──────────────────────────────────────────────────── */
const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
  backgroundSize: '600px 100%',
  animation: 'cs-shimmer 1.4s infinite linear',
};

/* ─── Primitives ────────────────────────────────────────────────────────────── */

export function SkeletonLine({ width = '100%', height = 12, radius = 6, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div style={{ ...shimmer, width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonCircle({ size = 36, style }: { size?: number; style?: React.CSSProperties }) {
  return <div style={{ ...shimmer, width: size, height: size, borderRadius: '50%', flexShrink: 0, ...style }} />;
}

/* ─── Composite skeletons ───────────────────────────────────────────────────── */

/** Score card skeleton — mimics two team rows with a score area */
export function SkeletonScoreCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="cs-stagger" style={{ '--i': 0, padding: 14, background: 'var(--surface)', border: '2px solid var(--border-3)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12, ...style } as React.CSSProperties}>
      {/* Team row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SkeletonCircle size={28} />
        <SkeletonLine width="55%" height={13} />
        <SkeletonLine width={24} height={16} style={{ marginInlineStart: 'auto' }} />
      </div>
      {/* Team row 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SkeletonCircle size={28} />
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width={24} height={16} style={{ marginInlineStart: 'auto' }} />
      </div>
      {/* Status */}
      <SkeletonLine width={80} height={9} style={{ alignSelf: 'center' }} />
    </div>
  );
}

/** News card skeleton — thumbnail + headline + meta */
export function SkeletonNewsCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="cs-stagger" style={{ '--i': 0, display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-3)', ...style } as React.CSSProperties}>
      <div style={{ ...shimmer, width: 80, height: 60, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        <SkeletonLine width="90%" height={13} />
        <SkeletonLine width="60%" height={10} />
        <SkeletonLine width="35%" height={8} />
      </div>
    </div>
  );
}

/** Table row skeleton — for standings/leaderboard */
export function SkeletonTableRow({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="cs-stagger" style={{ '--i': 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-3)', ...style } as React.CSSProperties}>
      <SkeletonLine width={18} height={14} />
      <SkeletonCircle size={24} />
      <SkeletonLine width="40%" height={12} />
      <SkeletonLine width={28} height={12} style={{ marginInlineStart: 'auto' }} />
      <SkeletonLine width={28} height={12} />
    </div>
  );
}

/** Generic card skeleton — for teams/players/videos */
export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="cs-stagger" style={{ '--i': 0, background: 'var(--surface)', border: '2px solid var(--border-3)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, ...style } as React.CSSProperties}>
      <div style={{ ...shimmer, width: '100%', height: 48, borderRadius: 10 }} />
      <SkeletonLine width="70%" height={13} />
      <SkeletonLine width="40%" height={9} />
    </div>
  );
}

/** Row skeleton — avatar + two text lines (for notifications, favorites) */
export function SkeletonRow({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="cs-stagger" style={{ '--i': 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-3)', ...style } as React.CSSProperties}>
      <SkeletonCircle size={36} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <SkeletonLine width="65%" height={12} />
        <SkeletonLine width="40%" height={9} />
      </div>
    </div>
  );
}

/** Player profile skeleton — big avatar + name + stat lines */
export function SkeletonPlayerProfile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 16px' }}>
      <SkeletonCircle size={72} />
      <SkeletonLine width={140} height={18} />
      <SkeletonLine width={100} height={11} />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <SkeletonLine width="100%" height={40} radius={10} />
        <SkeletonLine width="100%" height={40} radius={10} />
        <SkeletonLine width="100%" height={40} radius={10} />
        <SkeletonLine width="80%" height={40} radius={10} />
      </div>
    </div>
  );
}

/* ─── List helper ───────────────────────────────────────────────────────────── */

/** Renders N skeleton items with staggered entrance */
export function SkeletonList({ count = 5, children }: { count?: number; children: (index: number) => React.ReactNode }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cs-stagger" style={{ '--i': i } as React.CSSProperties}>
          {children(i)}
        </div>
      ))}
    </>
  );
}
