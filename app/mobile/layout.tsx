import type { Metadata, Viewport } from 'next';
import './mobile.css';

export const metadata: Metadata = {
  title: 'Curly Sports Mobile',
  description: 'Live scores. Deep stats. Real debates.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cs-mobile" style={{ height: '100dvh', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
