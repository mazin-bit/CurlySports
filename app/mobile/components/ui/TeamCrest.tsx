'use client';
import React from 'react';

interface TeamCrestProps extends React.HTMLAttributes<HTMLDivElement> {
  code?: string;
  abbr?: string;
  size?: 'md' | 'lg';
  logoUrl?: string | null;
}

// Known CSS team classes (from mobile.css)
const KNOWN_CODES = new Set(['mun','ars','che','liv','cit','tot','rm','bar','bay','psg','juv','int','mil','atm','dor','por','ben','ajax','lei','eve','ful','bha','whu','wol','bur','new','cry','sou','nop','bos','gsw','lal','chi','mia','dal','hou','nor','okl','den','atl','pho','sac','mem','ind','tor','mia','mil','cle','det','cha','was','orl','sas','min','uta','nba']);

export default function TeamCrest({ code, abbr, size = 'md', logoUrl, className = '', style, ...rest }: TeamCrestProps) {
  const hasClass = code && KNOWN_CODES.has(code.toLowerCase());
  const dim = size === 'lg' ? 40 : 28;

  // If we have a real logo URL and no matching CSS class, use an image
  if (logoUrl && !hasClass) {
    return (
      <div
        className={['cs-crest', size === 'lg' && 'cs-crest--lg', className].filter(Boolean).join(' ')}
        style={{ background: 'var(--surface-2)', border: '2px solid var(--ink)', overflow: 'hidden', padding: 2, ...style }}
        {...rest}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={abbr ?? ''}
          width={dim - 6}
          height={dim - 6}
          style={{ objectFit: 'contain', display: 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }

  const cls = ['cs-crest', code && `c-${code}`, size === 'lg' && 'cs-crest--lg', className].filter(Boolean).join(' ');
  const fallback = !code ? { background: 'var(--ink)', color: 'var(--accent)' } : undefined;
  return (
    <div className={cls} style={{ ...fallback, ...style }} {...rest}>
      {!hasClass && abbr}
    </div>
  );
}
