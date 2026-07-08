'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useDebatesList } from './api';
import { useAuth } from './AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';
import { SkeletonCard, SkeletonRow, SkeletonList } from './ui/Skeletons';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  author_name: string;
  content: string;
  sport: string;
  tag: string | null;
  likes_count: number;
  comments_count: number;
  liked: boolean;
  voted_option: number | null;
  poll: { options: string[]; votes: number[] } | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  likes_count: number;
  liked: boolean;
  created_at: string;
}

interface DebatesProps {
  sport: string;
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(r => r.json());

function timeAgo(iso: string, t: (key: string, fallback?: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return t('time.justNow', 'just now');
  if (m < 60) return t('time.minsAgo', `${m}m ago`).replace('{n}', String(m));
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hoursAgo', `${h}h ago`).replace('{n}', String(h));
  const d = Math.floor(h / 24);
  return t('time.daysAgo', `${d}d ago`).replace('{n}', String(d));
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────
function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, mutate, isLoading } = useSWR<{ comments: Comment[] }>(
    `/api/posts/${postId}/comments`,
    fetcher,
    { refreshInterval: 15_000 }
  );
  const comments = data?.comments ?? [];

  const submit = async () => {
    const content = text.trim();
    if (!content || !user) return;
    setPosting(true);
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setText('');
      mutate();
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;
    mutate(prev => {
      if (!prev) return prev;
      return {
        comments: prev.comments.map(c =>
          c.id === commentId
            ? { ...c, liked: !c.liked, likes_count: c.likes_count + (c.liked ? -1 : 1) }
            : c
        ),
      };
    }, false);
    await fetch(`/api/posts/${postId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    mutate();
  };

  const avatarChar = profile?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      {/* Sheet */}
      <div style={{ position: 'relative', background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '2.5px solid var(--ink)', borderBottom: 'none', maxHeight: '70vh', display: 'flex', flexDirection: 'column', animation: 'cs-slideUp 0.22s var(--ease-pop)' }}>
        {/* Handle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--border-3)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
            Comments {comments.length > 0 && <span style={{ color: 'var(--text-mute)', fontWeight: 500, fontSize: 14 }}>({comments.length})</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', display: 'grid', placeItems: 'center' }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLoading && (
            <SkeletonList count={3}>{i => <SkeletonRow style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          )}
          {!isLoading && comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{t('debates.noCommentsYetShort', 'No comments yet. Be first.')}</div>
          )}
          {comments.map(c => {
            const AV_COLORS = ['var(--orange)', 'var(--ink)', 'var(--purple)', 'var(--sky)', 'var(--coral)'];
            const avaBg = AV_COLORS[(c.author_name?.charCodeAt(0) ?? 0) % AV_COLORS.length];
            const avaColor = avaBg === 'var(--ink)' ? 'var(--accent)' : 'var(--paper)';
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: avaBg, color: avaColor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, border: '2px solid var(--ink)', flexShrink: 0 }}>
                  {c.author_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>{c.author_name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>{timeAgo(c.created_at, t)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 2 }}>{c.content}</div>
                  <span
                    onClick={() => toggleLike(c.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 700, color: c.liked ? 'var(--orange)' : 'var(--text-mute)', cursor: 'pointer', marginTop: 4 }}
                  >
                    <Icon name="heart" size={12} /> {c.likes_count > 0 ? c.likes_count : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        {user && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 24px', borderTop: '1px solid var(--border-3)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--lime)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, color: 'var(--ink)', flexShrink: 0 }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                : avatarChar}
            </div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder={t('debates.addComment', 'Add a comment...')}
              style={{ flex: 1, border: '2px solid var(--border-2)', borderRadius: 10, padding: '8px 12px', fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--body)' }}
            />
            <button
              onClick={submit}
              disabled={posting || !text.trim()}
              style={{ background: posting || !text.trim() ? 'var(--surface-3)' : 'var(--orange)', color: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: posting || !text.trim() ? 'not-allowed' : 'pointer' }}
            >
              {posting ? '...' : t('common.send', 'Send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DebatesScreen({ sport, onSearch, onBell, unread }: DebatesProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Collapsible composer ──
  const [composerOpen, setComposerOpen] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      if (!composerText.trim()) setComposerOpen(false);
    }, 4000);
  }, [composerText]);

  // Start collapse timer on mount
  useEffect(() => {
    resetCollapseTimer();
    return () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); };
  }, [resetCollapseTimer]);

  const expandComposer = () => {
    setComposerOpen(true);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const onComposerBlur = () => {
    if (!composerText.trim()) resetCollapseTimer();
  };

  const onComposerFocus = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  };

  const loadPosts = React.useCallback(async (replace = true) => {
    if (replace) setFeedLoading(true);
    try {
      const res = await fetch(`/api/posts?sport=${sport}&limit=20`);
      if (res.ok) {
        const data = await res.json() as { posts: Post[]; nextCursor?: string };
        setAllPosts(prev => replace ? (data.posts ?? []) : [...prev, ...(data.posts ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setFeedLoading(false);
    }
  }, [sport]);

  React.useEffect(() => { loadPosts(true); }, [loadPosts]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?sport=${sport}&cursor=${encodeURIComponent(nextCursor)}&limit=20`);
      if (res.ok) {
        const data = await res.json() as { posts: Post[]; nextCursor?: string };
        setAllPosts(prev => [...prev, ...(data.posts ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const posts: Post[] = sort === 'hot'
    ? [...allPosts].sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    : [...allPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const { debates: realDebates, mutate: mutateDebates } = useDebatesList();
  const liveDebate = realDebates.find(d => d.isLive) ?? realDebates[0] ?? null;

  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [localVotesA, setLocalVotesA] = useState<number | null>(null);
  const [localVotesB, setLocalVotesB] = useState<number | null>(null);
  const [votingDebate, setVotingDebate] = useState(false);

  const votesA = localVotesA ?? liveDebate?.votesA ?? 0;
  const votesB = localVotesB ?? liveDebate?.votesB ?? 0;
  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const castVote = async (option: 'A' | 'B') => {
    if (!user || !liveDebate || votingDebate || userVote) return;
    setVotingDebate(true);
    try {
      const res = await fetch(`/api/debates/${liveDebate.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserVote(option);
        setLocalVotesA(data.votesA);
        setLocalVotesB(data.votesB);
        mutateDebates();
      }
    } finally {
      setVotingDebate(false);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;
    setAllPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) } : p
    ));
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  };

  const votePoll = async (postId: string, optionIndex: number) => {
    if (!user) return;
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIndex }),
    });
    if (res.ok) {
      const data = await res.json() as { poll: Post['poll']; voted_option: number };
      setAllPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, poll: data.poll, voted_option: data.voted_option } : p
      ));
    }
  };

  const submitPost = async () => {
    const text = composerText.trim();
    if (!text || !user) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, sport, tag: 'DEBATE' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setPostError(err.error || t('debates.failedToPost', 'Failed to post.'));
        return;
      }
      const newPost = await res.json() as Post;
      setComposerText('');
      setAllPosts(prev => [newPost, ...prev]);
    } finally {
      setPosting(false);
    }
  };

  const [copiedToast, setCopiedToast] = useState(false);
  const [showCreateDebate, setShowCreateDebate] = useState(false);
  const [debateQuestion, setDebateQuestion] = useState('');
  const [debateOptA, setDebateOptA] = useState('');
  const [debateOptB, setDebateOptB] = useState('');
  const [creatingDebate, setCreatingDebate] = useState(false);
  const [debateError, setDebateError] = useState<string | null>(null);

  const submitDebate = async () => {
    if (!debateQuestion.trim() || !debateOptA.trim() || !debateOptB.trim() || creatingDebate) return;
    setCreatingDebate(true);
    setDebateError(null);
    try {
      const res = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: debateQuestion.trim(),
          optionA: debateOptA.trim(),
          optionB: debateOptB.trim(),
          sport: sport.toUpperCase(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setDebateError(res.status === 401 ? t('debates.mustBeLoggedInCreate', 'You must be logged in to create a debate.') : (data.error || t('debates.failedToCreate', 'Failed to create debate.')));
        return;
      }
      setDebateQuestion('');
      setDebateOptA('');
      setDebateOptB('');
      setShowCreateDebate(false);
      mutateDebates();
    } finally {
      setCreatingDebate(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm(t('debates.deleteConfirm', 'Delete this post? This cannot be undone.'))) return;
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setAllPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const sharePost = async (post: Post) => {
    const shareText = `${post.author_name}: ${post.content}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.author_name, text: shareText }); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      } catch { /* clipboard not available */ }
    }
  };

  const question = liveDebate?.question ?? 'What\'s the biggest debate in football today?';
  const labelA   = liveDebate?.optionA ?? 'YES';
  const labelB   = liveDebate?.optionB ?? 'NO';
  const avatarChar = profile?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      <Topbar title={t('debates.title', 'Debates')} subtitle={t('debates.bringReceipts', 'Bring receipts')} logoSrc="/curly-guy.png" onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Sort toggle (matches web Hot/New) ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSort('hot')} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '2px solid var(--ink)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, cursor: 'pointer', background: sort === 'hot' ? 'var(--ink)' : 'var(--surface)', color: sort === 'hot' ? 'var(--accent)' : 'var(--ink)' }}>
            <Icon name="flame" size={12} /> {t('debates.hot', 'Hot')}
          </button>
          <button onClick={() => setSort('new')} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '2px solid var(--ink)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, cursor: 'pointer', background: sort === 'new' ? 'var(--ink)' : 'var(--surface)', color: sort === 'new' ? 'var(--accent)' : 'var(--ink)' }}>
            <Icon name="bolt" size={12} /> {t('debates.new', 'New')}
          </button>
        </div>

        {/* ── Posts feed ── */}
        {feedLoading && allPosts.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonList count={3}>{i => <SkeletonCard style={{ '--i': i } as React.CSSProperties} />}</SkeletonList>
          </div>
        )}

        {!feedLoading && allPosts.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>{t('debates.noTakesYet', 'No takes yet')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{t('debates.beFirstToDrop', 'Be the first to drop a take. Use the composer below.')}</div>
            </div>
          </Card>
        )}

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => toggleLike(post.id, post.liked)}
            onVote={(i) => votePoll(post.id, i)}
            onComment={() => setOpenComments(post.id)}
            onDelete={() => deletePost(post.id)}
            onShare={() => sharePost(post)}
          />
        ))}

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{ width: '100%', padding: '12px 0', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: 'var(--ink)', cursor: loadingMore ? 'not-allowed' : 'pointer', letterSpacing: '0.05em' }}
          >
            {loadingMore ? '...' : t('common.loadMoreUpper', 'LOAD MORE')}
          </button>
        )}
      </div>

      {/* ── Composer (collapsible) ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, padding: '0 14px', pointerEvents: 'none', display: 'flex', justifyContent: composerOpen ? 'stretch' : 'flex-end' }}>
        {composerOpen ? (
          <div
            style={{
              pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 999,
              padding: 6, boxShadow: 'var(--shadow-md)', width: '100%',
              animation: 'cs-composerExpand 0.32s cubic-bezier(.22,1,.36,1) both',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--lime)', border: '2px solid var(--ink)', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : avatarChar}
            </div>
            <input
              ref={inputRef}
              value={composerText}
              onChange={e => { setComposerText(e.target.value); setPostError(null); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPost(); } }}
              onFocus={onComposerFocus}
              onBlur={onComposerBlur}
              placeholder={t('debates.dropYourTake', 'Drop your take...')}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--body)' }}
            />
            <button
              onClick={submitPost}
              disabled={posting || !composerText.trim()}
              style={{ background: posting || !composerText.trim() ? 'var(--surface-3)' : 'var(--orange)', color: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 999, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: posting || !composerText.trim() ? 'not-allowed' : 'pointer' }}
            >
              {posting ? '...' : t('common.post', 'Post')}
            </button>
          </div>
        ) : (
          <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, animation: 'cs-composerCollapse 0.35s cubic-bezier(.22,1,.36,1) both' }}>
            {/* Speech bubble — above the circle */}
            {bubbleVisible && (
              <div
                onClick={expandComposer}
                style={{
                  position: 'relative', background: 'var(--ink)', color: 'var(--paper)',
                  borderRadius: 14, padding: '9px 14px', cursor: 'pointer',
                  fontFamily: 'var(--body)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                  animation: 'cs-fadeIn 0.3s cubic-bezier(.22,1,.36,1) 0.2s both',
                  display: 'flex', alignItems: 'center', gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name="pen" size={13} />
                {t('debates.dropYourTake', 'Drop your take...')}
                {/* Tail arrow pointing down */}
                <span style={{
                  position: 'absolute', bottom: -7, right: 18,
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid var(--ink)',
                }} />
                {/* Dismiss X */}
                <span
                  onClick={e => { e.stopPropagation(); setBubbleVisible(false); }}
                  style={{
                    position: 'absolute', top: -6, left: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--surface)', border: '1.5px solid var(--ink)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 10, fontWeight: 800, color: 'var(--text-mute)',
                    cursor: 'pointer', lineHeight: 1,
                  }}
                >
                  <Icon name="close" size={10} />
                </span>
              </div>
            )}
            {/* FAB circle */}
            <button
              onClick={expandComposer}
              className="cs-tap"
              style={{
                position: 'relative', flexShrink: 0,
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--lime)', border: '2.5px solid var(--ink)',
                boxShadow: '4px 4px 0 var(--ink)',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)',
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                {profile?.avatar
                  ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarChar}
              </div>
              <span style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--orange)', border: '2px solid var(--ink)',
                display: 'grid', placeItems: 'center',
                fontSize: 13, fontWeight: 800, color: 'var(--paper)', lineHeight: 1,
                animation: 'cs-pulseGlow 1.8s infinite',
                zIndex: 1,
              }}>
                +
              </span>
            </button>
          </div>
        )}
        {postError && composerOpen && (
          <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--coral)', textAlign: 'center' }}>{postError}</div>
        )}
      </div>

      {/* ── Comments sheet ── */}
      {openComments && <CommentsSheet postId={openComments} onClose={() => setOpenComments(null)} />}

      {/* ── Copied toast ── */}
      {copiedToast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--accent)', padding: '8px 18px',
          borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
          boxShadow: 'var(--shadow-md)', zIndex: 300,
          animation: 'cs-fadeIn 0.2s var(--ease-pop)',
        }}>
          {t('debates.copiedToClipboard', 'Copied to clipboard')}
        </div>
      )}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onVote, onComment, onDelete, onShare }: { post: Post; onLike: () => void; onVote: (i: number) => void; onComment: () => void; onDelete?: () => void; onShare: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isOwner = user && post.user_id === user.id;
  const AV_COLORS = ['var(--orange)', 'var(--ink)', 'var(--purple)', 'var(--sky)', 'var(--coral)'];
  const colorIdx  = (post.author_name?.charCodeAt(0) ?? 0) % AV_COLORS.length;
  const avaBg     = AV_COLORS[colorIdx];
  const avaColor  = avaBg === 'var(--ink)' ? 'var(--accent)' : 'var(--paper)';
  const initials  = post.author_name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: avaBg, color: avaColor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, border: '2px solid var(--ink)', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author_name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{timeAgo(post.created_at, t)} · {post.sport}</div>
        </div>
        {post.tag && <Badge tone={post.tag === 'DEBATE' ? 'accent' : 'mute'}>{post.tag}</Badge>}
      </div>

      <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>{post.content}</div>

      {/* Image attachment */}
      {post.image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 10, border: '2px solid var(--ink)', marginBottom: 12, display: 'block', maxHeight: 300, objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      )}

      {/* Poll */}
      {post.poll && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {post.poll.options.map((opt, i) => {
            const total = post.poll!.votes.reduce((a, b) => a + b, 0) || 1;
            const pct   = Math.round((post.poll!.votes[i] / total) * 100);
            const voted = post.voted_option === i;
            const hasVoted = post.voted_option !== null;
            return (
              <div
                key={i}
                onClick={() => !hasVoted && user && onVote(i)}
                style={{ position: 'relative', height: 32, borderRadius: 8, overflow: 'hidden', border: `2px solid ${voted ? 'var(--ink)' : 'var(--border-2)'}`, cursor: !hasVoted && user ? 'pointer' : 'default' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: hasVoted ? `${pct}%` : '0%', background: voted ? 'var(--accent)' : 'var(--surface-2)', transition: 'width .3s' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', height: '100%' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{opt}</span>
                  {hasVoted && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', alignItems: 'center' }}>
        <span onClick={onLike} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: post.liked ? 'var(--orange)' : 'var(--text-mute)' }}>
          <Icon name="heart" size={14} /> {post.likes_count > 0 ? post.likes_count : ''}
        </span>
        <span onClick={onComment} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Icon name="chat" size={14} /> {post.comments_count > 0 ? post.comments_count : ''}
        </span>
        <span onClick={onShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Icon name="share" size={14} />
        </span>
        {isOwner && onDelete && (
          <span onClick={onDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginInlineStart: 'auto' }}>
            <Icon name="trash" size={14} />
          </span>
        )}
      </div>
    </Card>
  );
}

function voteBtn(primary: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
    border: '2px solid var(--ink)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
    background: primary ? 'var(--ink)' : 'var(--surface)',
    color:      primary ? 'var(--accent)' : 'var(--ink)',
    boxShadow: 'var(--shadow-sm)',
  };
}
