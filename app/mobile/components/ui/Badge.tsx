'use client';
import React from 'react';

const TONES = {
  mute:   { background: 'var(--surface-3)', color: 'var(--text-mute)', border: '1px solid var(--border-2)' },
  ink:    { background: 'var(--ink)', color: 'var(--accent)', border: '1px solid var(--ink)' },
  accent: { background: 'var(--accent)', color: 'var(--ink)', border: '1px solid var(--ink)' },
  orange: { background: 'var(--orange)', color: 'var(--paper)', border: '1px solid var(--ink)' },
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONES;
}

export default function Badge({ tone = 'mute', children, className = '', style, ...rest }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
        padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', lineHeight: 1.4,
        ...TONES[tone], ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
