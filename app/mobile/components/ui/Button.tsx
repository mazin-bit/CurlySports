'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent' | 'orange' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  block?: boolean;
}

export default function Button({ variant = 'default', size = 'md', block = false, children, className = '', ...rest }: ButtonProps) {
  const cls = [
    'cs-btn',
    variant !== 'default' && `cs-btn--${variant}`,
    size !== 'md' && `cs-btn--${size}`,
    block && 'cs-btn--block',
    className,
  ].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}
