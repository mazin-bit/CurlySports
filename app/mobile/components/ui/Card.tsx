'use client';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: string;
  tappable?: boolean;
}

export default function Card({ title, subtitle, action, tappable = false, children, className = '', style, ...rest }: CardProps) {
  const cls = ['cs-card', tappable && 'is-tappable', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style} {...rest}>
      {(title || subtitle || action) && (
        <div className="cs-card-head">
          <div>
            {subtitle && <div className="cs-card-sub">{subtitle}</div>}
            {title && <div className="cs-card-title">{title}</div>}
          </div>
          {action && <div className="cs-card-action">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
