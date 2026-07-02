'use client';
import React from 'react';
import useSWR from 'swr';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonCard, SkeletonList } from './ui/Skeletons';
import { openExternal } from '@/lib/native';

interface VideoHighlight {
  id: string;
  title: string;
  thumbnail: string | null;
  url: string;
  source: string;
  publishedAt: string;
  sport: string;
  isYouTube: boolean;
  ytVideoId: string | null;
}

interface VideosProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function VideosScreen({ sport, setSport, onSearch, onBell, unread }: VideosProps) {
  const { data, isLoading } = useSWR<{ videos: VideoHighlight[] }>(
    `/api/espn/videos?sport=${sport}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const videos = data?.videos ?? [];

  const openVideo = (url: string) => {
    openExternal(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="Videos"
        subtitle="Highlights & clips"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SportSelector active={sport} onSelect={setSport} />

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonList count={4}>{i => <SkeletonCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {!isLoading && videos.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="live" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>No videos available right now</div>
          </div>
        )}

        {!isLoading && videos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {videos.map(video => (
              <Card
                key={video.id}
                tappable
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => openVideo(video.url)}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', height: 180, background: 'var(--ink)', overflow: 'hidden', borderBottom: '2px solid var(--ink)' }}>
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).parentElement!.style.background = 'var(--surface-3)';
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--surface-3)' }}>
                      <Icon name="live" size={36} style={{ color: 'var(--text-mute)' }} />
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink)" style={{ marginLeft: 2 }}>
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                  {/* YouTube badge */}
                  {video.isYouTube && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#FF0000', color: '#fff', borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>YT</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Badge tone="mute">{video.source}</Badge>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>{timeAgo(video.publishedAt)}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                    {video.title}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
