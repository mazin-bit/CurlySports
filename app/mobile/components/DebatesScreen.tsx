'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { useDebatesList } from './api';
import { useAuth } from './AuthContext';
import Topbar from './ui/Topbar';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';

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
  onSearch: () => void;
  onBell: () => void;
  onOpenPlayer: (playerId?: string, leagueId?: string) => void;
  unread: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) => {
  console.log(`[mobile] GET ${url}`);
  return fetch(url).then(async r => {
    const data = await r.json();
    console.log(`[mobile] ${url} → status=${r.status} posts=${data?.posts?.length ?? data?.comments?.length ?? JSON.stringify(data).slice(0, 80)}`);
    return data;
  });
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────
function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user, profile } = useAuth();
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
            <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>Loading…</div>
          )}
          {!isLoading && comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>No comments yet. Be first.</div>
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
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)' }}>{timeAgo(c.created_at)}</span>
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
              placeholder="Add a comment…"
              style={{ flex: 1, border: '2px solid var(--border-2)', borderRadius: 10, padding: '8px 12px', fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--body)' }}
            />
            <button
              onClick={submit}
              disabled={posting || !text.trim()}
              style={{ background: posting || !text.trim() ? 'var(--surface-3)' : 'var(--orange)', color: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: posting || !text.trim() ? 'not-allowed' : 'pointer' }}
            >
              {posting ? '…' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DebatesScreen({ onSearch, onBell, unread }: DebatesProps) {
  const { user, profile } = useAuth();
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);

  // No sport filter — show debates from all sports so mobile sees the same data as web
  const { data: feedData, mutate: mutateFeed, isLoading: feedLoading } = useSWR<{ posts: Post[] }>(
    '/api/posts?limit=20',
    fetcher,
    { refreshInterval: 30_000 }
  );
  const posts = feedData?.posts ?? [];

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
    console.log(`[mobile] POST /api/posts/${postId}/like user_id=${user.id} currently_liked=${currentlyLiked}`);
    mutateFeed(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map(p =>
          p.id === postId
            ? { ...p, liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) }
            : p
        ),
      };
    }, false);
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    mutateFeed();
  };

  const votePoll = async (postId: string, optionIndex: number) => {
    if (!user) return;
    console.log(`[mobile] POST /api/posts/${postId}/vote user_id=${user.id} option=${optionIndex} table=post_votes`);
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIndex }),
    });
    if (res.ok) mutateFeed();
  };

  const submitPost = async () => {
    const text = composerText.trim();
    if (!text || !user) return;
    console.log(`[mobile] POST /api/posts INSERT user_id=${user.id} table=posts sport=football tag=DEBATE`);
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, sport: 'football', tag: 'DEBATE' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        console.error(`[mobile] POST /api/posts FAILED`, err.error);
        setPostError(err.error || 'Failed to post. Try again.');
        return;
      }
      const newPost = await res.json().catch(() => null);
      console.log(`[mobile] POST /api/posts OK id=${newPost?.id} author=${newPost?.author_name}`);
      setComposerText('');
      mutateFeed();
    } finally {
      setPosting(false);
    }
  };

  const question = liveDebate?.question ?? 'What\'s the biggest debate in football today?';
  const labelA   = liveDebate?.optionA ?? 'YES';
  const labelB   = liveDebate?.optionB ?? 'NO';
  const avatarChar = profile?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      <Topbar title="Debates" subtitle="Bring receipts" logoSrc="/curly-mark.png" onSearch={onSearch} onBell={onBell} hasNotification={unread > 0} />

      <div className="cs-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Today's debate poll ── */}
        {liveDebate && (
          <Card style={{ background: 'var(--accent)', borderColor: 'var(--ink)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)', opacity: 0.7 }}>Today&apos;s debate</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '6px 0 12px', lineHeight: 1.1 }}>{question}</div>

            {userVote ? (
              <>
                <div style={{ display: 'flex', height: 30, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--ink)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: `${pctA}%`, background: 'var(--ink)', color: 'var(--accent)', display: 'flex', alignItems: 'center', paddingLeft: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>{labelA} {pctA}%</div>
                  <div style={{ flex: 1, background: 'var(--surface)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>{labelB} {pctB}%</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink)', opacity: 0.6, marginTop: 8 }}>
                  You voted {userVote === 'A' ? labelA : labelB} · {totalVotes.toLocaleString()} votes
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => castVote('A')} disabled={votingDebate} style={voteBtn(true)}>{votingDebate ? '…' : `Vote ${labelA}`}</button>
                <button onClick={() => castVote('B')} disabled={votingDebate} style={voteBtn(false)}>{votingDebate ? '…' : `Vote ${labelB}`}</button>
              </div>
            )}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', opacity: 0.5, marginTop: 8 }}>{totalVotes.toLocaleString()} votes cast</div>
          </Card>
        )}

        {/* ── Posts feed ── */}
        {feedLoading && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>Loading takes…</div>
        )}

        {!feedLoading && posts.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>No takes yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Be the first to drop a take. Use the composer below.</div>
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
          />
        ))}
      </div>

      {/* ── Composer ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 78, padding: '0 14px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 999, padding: 6, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--lime)', border: '2px solid var(--ink)', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
            {profile?.avatar
              ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : avatarChar}
          </div>
          <input
            value={composerText}
            onChange={e => { setComposerText(e.target.value); setPostError(null); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPost(); } }}
            placeholder="Drop your take…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--body)' }}
          />
          <button
            onClick={submitPost}
            disabled={posting || !composerText.trim()}
            style={{ background: posting || !composerText.trim() ? 'var(--surface-3)' : 'var(--orange)', color: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 999, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: posting || !composerText.trim() ? 'not-allowed' : 'pointer' }}
          >
            {posting ? '…' : 'Post'}
          </button>
        </div>
        {postError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--coral)', textAlign: 'center' }}>{postError}</div>
        )}
      </div>

      {/* ── Comments sheet ── */}
      {openComments && <CommentsSheet postId={openComments} onClose={() => setOpenComments(null)} />}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onVote, onComment }: { post: Post; onLike: () => void; onVote: (i: number) => void; onComment: () => void }) {
  const { user } = useAuth();
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
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{timeAgo(post.created_at)} · {post.sport}</div>
        </div>
        {post.tag && <Badge tone={post.tag === 'DEBATE' ? 'accent' : 'mute'}>{post.tag}</Badge>}
      </div>

      <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>{post.content}</div>

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
      <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)' }}>
        <span onClick={onLike} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: post.liked ? 'var(--orange)' : 'var(--text-mute)' }}>
          <Icon name="heart" size={14} /> {post.likes_count > 0 ? post.likes_count : ''}
        </span>
        <span onClick={onComment} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Icon name="chat" size={14} /> {post.comments_count > 0 ? post.comments_count : ''}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="share" size={14} /></span>
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
