import React from 'react';

interface MobilePageTransitionProps {
  tabKey: string;
  children: React.ReactNode;
}

export function MobilePageTransition({ tabKey, children }: MobilePageTransitionProps) {
  return (
    <div key={tabKey} className="mobile-page-transition">
      {children}
    </div>
  );
}
