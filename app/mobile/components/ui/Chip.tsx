'use client';
import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  live?: boolean;
}

export default function Chip({ active = false, live = false, children, className = '', ...rest }: ChipProps) {
  const cls = ['cs-chip', active && 'is-active', live && 'is-live', className].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}
