'use client';
import React, { useState } from 'react';
import { useNews } from '@/hooks/useNews';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Chip from './ui/Chip';
import Icon from './ui/Icon';
import SportSelector from './ui/SportSelector';
import { SkeletonNewsCard, SkeletonList } from './ui/Skeletons';

const SPORT_LABELS: Record<string, string> = {
  football: 'Football', basketball: 'Basketball', nfl: 'NFL',
  tennis: 'Tennis', baseball: 'Baseball', f1: 'Formula 1', cricket: 'Cricket',
};

interface NewsProps {
  sport: string;
  setSport: (s: string) => void;
  onSearch: () => void;
  onBell: () => void;
  unread: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type NewsFilter = 'all' | 'sport' | 'transfers' | 'match-reports' | 'breaking';

const TRANSFER_KW = ['transfer', 'signing', 'signed', 'deal', 'fee', 'bid', 'swap', 'loan', 'release', 'free agent', 'departure'];
const REPORT_KW = ['match report', 'recap', 'result', 'highlights', 'final score', 'full-time', 'defeated', 'beat '];

function applyFilter(articles: ReturnType<typeof useNews>['articles'], filter: NewsFilter, sport: string) {
  if (filter === 'sport') return articles; // already sport-filtered
  if (filter === 'transfers') {
    return articles.filter(a => TRANSFER_KW.some(kw => a.title.toLowerCase().includes(kw)));
  }
  if (filter === 'match-reports') {
    return articles.filter(a => REPORT_KW.some(kw => a.title.toLowerCase().includes(kw)));
  }
  if (filter === 'breaking') {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return articles.filter(a => a.publishedAt && new Date(a.publishedAt).getTime() > twoHoursAgo);
  }
  return articles;
}

export default function NewsScreen({ sport, setSport, onSearch, onBell, unread }: NewsProps) {
  const [filter, setFilter] = useState<NewsFilter>('all');

  const { articles: sportArticles, isLoading: sportLoading } = useNews(50, sport);
  const { articles: allArticles, isLoading: allLoading } = useNews(50);

  const baseArticles = filter === 'sport' ? sportArticles : allArticles;
  const isLoading = filter === 'sport' ? sportLoading : allLoading;
  const articles = applyFilter(baseArticles, filter, sport);

  const openArticle = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Topbar
        title="News"
        subtitle="Latest headlines"
        logoSrc="/curly-guy.png"
        onSearch={onSearch}
        onBell={onBell}
        hasNotification={unread > 0}
      />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sport selector */}
        <SportSelector active={sport} onSelect={setSport} />

        {/* Filter chips — matching web news page */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} style={{ flexShrink: 0 }}>All</Chip>
          <Chip active={filter === 'sport'} onClick={() => setFilter('sport')} style={{ flexShrink: 0 }}>{SPORT_LABELS[sport] ?? sport}</Chip>
          <Chip active={filter === 'transfers'} onClick={() => setFilter('transfers')} style={{ flexShrink: 0 }}>Transfers</Chip>
          <Chip active={filter === 'match-reports'} onClick={() => setFilter('match-reports')} style={{ flexShrink: 0 }}>Match Reports</Chip>
          <Chip active={filter === 'breaking'} onClick={() => setFilter('breaking')} style={{ flexShrink: 0 }}>Breaking</Chip>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonList count={5}>{i => <SkeletonNewsCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="news" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>No news right now</div>
          </div>
        )}

        {!isLoading && articles.map((article, idx) => (
          <div key={article.id} className="cs-stagger" style={{ '--i': Math.min(idx, 8) } as React.CSSProperties}>
          <Card
            tappable
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            onClick={() => article.url && openArticle(article.url)}
          >
            {article.imageUrl && (
              <div style={{ height: 160, overflow: 'hidden', borderBottom: '2px solid var(--ink)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
              </div>
            )}
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Badge tone="mute">{article.source}</Badge>
                {article.sport && (
                  <Badge tone="accent">{SPORT_LABELS[article.sport] ?? article.sport}</Badge>
                )}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>
                  {article.publishedAt ? timeAgo(article.publishedAt) : ''}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                {article.title}
              </div>
              {article.excerpt && (
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {article.excerpt}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>
                Read more <Icon name="arrow-right" size={11} />
              </div>
            </div>
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
