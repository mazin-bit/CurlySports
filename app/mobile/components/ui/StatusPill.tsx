'use client';
import React from 'react';

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'live' | 'ft' | 'up';
}

export default function StatusPill({ status = 'live', children, className = '', ...rest }: StatusPillProps) {
  const cls = ['cs-status', `cs-status--${status}`, className].filter(Boolean).join(' ');
  const label = children ?? ({ live: 'LIVE', ft: 'FT', up: 'UPCOMING' }[status] ?? status.toUpperCase());
  return <span className={cls} {...rest}>{label}</span>;
}
