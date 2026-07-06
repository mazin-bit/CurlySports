"use client";

import AppShell from "@/components/AppShell";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./fun-zone.module.css";
import {
  Flame, Zap, MessageCircle, ThumbsUp, Share2,
  TrendingUp, BarChart2, Clock, Plus, X, Image as ImageIcon,
  ChevronUp, AlertCircle, Send, Loader2, Trash2, Check, Vote,
} from "lucide-react";
import { useActiveSport } from "@/contexts/SportContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Poll {
  options: string[];
  votes: number[];
}

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  content: string;
  sport: string;
  tag: string;
  image_url: string | null;
  poll: Poll | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // enriched by API
  liked: boolean;
  voted_option: number | null;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  liked: boolean;
}

interface Debate {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  sport: string | null;
  votesA: number;
  votesB: number;
  isLive: boolean;
  createdAt: string;
}

const TAGS = ["DEBATE", "GOAT DEBATE", "HOT TAKE", "TRANSFERS", "PREDICTIONS", "QUESTION", "NEWS"];

// ─── Create Debate Modal ────────────────────────────────────────────────────

function CreateDebateModal({
  onClose,
  onCreated,
  sport,
}: {
  onClose: () => void;
  onCreated: (debate: Debate) => void;
  sport: string;
}) {
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = question.trim().length > 0 && optionA.trim().length > 0 && optionB.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          sport: sport.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setError("You must be logged in to create a debate.");
        } else {
          setError(data.error ?? "Failed to create debate.");
        }
        return;
      }

      const debate = await res.json();
      onCreated(debate);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.composeOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.composeModal}>
        <div className={styles.composeHead}>
          <span className={styles.composeTitle}>New Debate</span>
          <button className={styles.composeClose} onClick={onClose}><X size={15} /></button>
        </div>

        <div className={styles.composeBody}>
          <textarea
            className={styles.composeContentInput}
            placeholder="Ask a debate question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            maxLength={200}
            autoFocus
          />

          <div className={styles.pollSection}>
            <div className={styles.composeOptsLabel}>Options</div>
            <div className={styles.composeOptRow}>
              <input
                className={styles.composeOptInput}
                placeholder="Option A (e.g. Messi)"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className={styles.composeOptRow}>
              <input
                className={styles.composeOptInput}
                placeholder="Option B (e.g. Ronaldo)"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>

          {error && <div className={styles.composeError}><AlertCircle size={13} /> {error}</div>}
        </div>

        <div className={styles.composeFoot}>
          <div />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={styles.composeCancelBtn} onClick={onClose}>Cancel</button>
            <button
              className={styles.composePostBtn}
              disabled={!canSubmit || submitting}
              onClick={submit}
            >
              {submitting ? <Loader2 size={13} className={styles.spin} /> : <Vote size={13} />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function avatarColor(name: string) {
  const h = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `hsl(${(h * 37) % 360}, 55%, 48%)`;
}

// ─── Compose Modal ─────────────────────────────────────────────────────────────

function ComposeModal({
  onClose,
  onPost,
  sport,
}: {
  onClose: () => void;
  onPost: (post: Post) => void;
  sport: string;
}) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("DEBATE");
  const [hasPoll, setHasPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = content.trim().length > 0 && (!hasPoll || (pollOptions[0].trim() && pollOptions[1].trim()));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      let imageUrl: string | null = null;

      // Upload image via API route
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        }
        // If upload fails, continue without image
      }

      const poll = hasPoll
        ? { options: pollOptions.filter((o) => o.trim()), votes: [] }
        : null;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), sport, tag, image_url: imageUrl, poll }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setError("You must be logged in to post.");
        } else {
          setError(data.error ?? "Failed to post.");
        }
        return;
      }

      const post = await res.json();
      onPost(post);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.composeOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.composeModal}>
        <div className={styles.composeHead}>
          <span className={styles.composeTitle}>New Post</span>
          <button className={styles.composeClose} onClick={onClose}><X size={15} /></button>
        </div>

        <div className={styles.composeBody}>
          <div className={styles.composeRow}>
            <select className={styles.composeTag} value={tag} onChange={(e) => setTag(e.target.value)}>
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <textarea
            className={styles.composeContentInput}
            placeholder={`What's on your mind about ${sport}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={500}
            autoFocus
          />

          {/* Image preview */}
          {imagePreview && (
            <div className={styles.imagePreviewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className={styles.imagePreview} />
              <button className={styles.imageRemove} onClick={() => { setImageFile(null); setImagePreview(null); }}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Poll section */}
          {hasPoll && (
            <div className={styles.pollSection}>
              <div className={styles.composeOptsLabel}>Poll options</div>
              {pollOptions.map((o, i) => (
                <div key={i} className={styles.composeOptRow}>
                  <input
                    className={styles.composeOptInput}
                    placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                    value={o}
                    onChange={(e) => setPollOptions((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                  />
                  {i >= 2 && (
                    <button className={styles.composeOptRemove} onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button className={styles.composeAddOpt} onClick={() => setPollOptions((prev) => [...prev, ""])}>
                  <Plus size={12} /> Add option
                </button>
              )}
            </div>
          )}

          {error && <div className={styles.composeError}><AlertCircle size={13} /> {error}</div>}
        </div>

        <div className={styles.composeFoot}>
          <div className={styles.composeToolbar}>
            {/* Image upload */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            <button
              className={`${styles.toolbarBtn}${imageFile ? " " + styles.toolbarBtnActive : ""}`}
              onClick={() => fileRef.current?.click()}
              title="Add image"
            >
              <ImageIcon size={15} />
            </button>
            {/* Poll toggle */}
            <button
              className={`${styles.toolbarBtn}${hasPoll ? " " + styles.toolbarBtnActive : ""}`}
              onClick={() => setHasPoll((v) => !v)}
              title="Add poll"
            >
              <BarChart2 size={15} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.composeChars}>{content.length}/500</span>
            <button className={styles.composeCancelBtn} onClick={onClose}>Cancel</button>
            <button
              className={styles.composePostBtn}
              disabled={!canPost || submitting}
              onClick={submit}
            >
              {submitting ? <Loader2 size={13} className={styles.spin} /> : <Send size={13} />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post: initialPost, currentUserId, onDelete }: { post: Post; currentUserId: string | null; onDelete: (id: string) => void }) {
  const [post, setPost] = useState(initialPost);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [likingPost, setLikingPost] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const isOwner = currentUserId && post.user_id === currentUserId;

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(post.id);
      }
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = async () => {
    setExpanded((v) => !v);
    if (!commentsLoaded) {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
      setCommentsLoaded(true);
    }
  };

  const toggleLike = async () => {
    if (likingPost) return;
    setLikingPost(true);
    // Optimistic update
    setPost((p) => ({ ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 }));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPost((p) => ({ ...p, liked: data.liked, likes_count: data.likes_count }));
      } else if (res.status === 401) {
        // Revert optimistic update
        setPost((p) => ({ ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 }));
      }
    } finally {
      setLikingPost(false);
    }
  };

  const castVote = async (optionIndex: number) => {
    if (post.voted_option !== null) return;
    // Optimistic update
    const newVotes = [...(post.poll?.votes ?? [])];
    newVotes[optionIndex] = (newVotes[optionIndex] ?? 0) + 1;
    setPost((p) => ({
      ...p,
      voted_option: optionIndex,
      poll: p.poll ? { ...p.poll, votes: newVotes } : null,
    }));

    const res = await fetch(`/api/posts/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIndex }),
    });
    if (res.ok) {
      const data = await res.json();
      setPost((p) => ({ ...p, poll: data.poll, voted_option: data.voted_option }));
    } else {
      // Revert
      setPost((p) => ({
        ...p,
        voted_option: null,
        poll: p.poll ? { ...p.poll, votes: p.poll.votes.map((v, i) => i === optionIndex ? Math.max(0, v - 1) : v) } : null,
      }));
    }
  };

  const sendComment = async () => {
    const text = newComment.trim();
    if (!text || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }));
        setNewComment("");
      }
    } finally {
      setSendingComment(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, liked: data.liked, likes_count: data.likes_count } : c
      ));
    }
  };

  const sharePost = async () => {
    const shareText = `${post.author_name}: ${post.content}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.author_name, text: shareText }); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch { /* clipboard not available */ }
    }
  };

  const totalVotes = post.poll ? post.poll.votes.reduce((s, v) => s + v, 0) : 0;

  return (
    <article className={styles.thread}>
      {/* Header */}
      <div className={styles.threadHead}>
        <div className={styles.avatar} style={{ background: avatarColor(post.author_name) }}>
          {initials(post.author_name)}
        </div>
        <div className={styles.authorInfo}>
          <span className={styles.authorName}>{post.author_name}</span>
          <span className={styles.threadTime}><Clock size={11} strokeWidth={2} /> {timeAgo(post.created_at)}</span>
        </div>
        <span className={styles.threadTag}>{post.tag}</span>
      </div>

      {/* Content */}
      <p className={styles.threadBody}>{post.content}</p>

      {/* Image */}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt="post image" className={styles.postImage} />
      )}

      {/* Poll */}
      {post.poll && (
        <div className={styles.pollWrap}>
          {post.poll.options.map((opt, i) => {
            const count = post.poll!.votes[i] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isVoted = post.voted_option === i;
            const isWinner = post.voted_option !== null && count === Math.max(...post.poll!.votes);
            return (
              <button
                key={i}
                className={`${styles.pollOpt}${isVoted ? " " + styles.pollOptVoted : ""}${post.voted_option !== null && isWinner ? " " + styles.pollOptWinner : ""}`}
                onClick={() => castVote(i)}
                disabled={post.voted_option !== null}
              >
                <div className={styles.pollFill} style={{ width: post.voted_option !== null ? `${pct}%` : "0%" }} />
                <span className={styles.pollLabel}>{opt}</span>
                {post.voted_option !== null && <span className={styles.pollPct}>{pct}%</span>}
              </button>
            );
          })}
          <div className={styles.pollMeta}>
            <BarChart2 size={12} strokeWidth={2} />
            {totalVotes.toLocaleString()} votes
            {post.voted_option === null && <span> · tap to vote</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.threadActions}>
        <button
          className={`${styles.actionBtn}${post.liked ? " " + styles.actionBtnActive : ""}`}
          onClick={toggleLike}
        >
          <ChevronUp size={15} strokeWidth={2} />
          {post.likes_count}
        </button>
        <button className={styles.actionBtn} onClick={toggleExpand}>
          <MessageCircle size={15} strokeWidth={2} />
          {post.comments_count}
        </button>
        <button className={`${styles.actionBtn}${showCopied ? " " + styles.actionBtnActive : ""}`} onClick={sharePost}>
          {showCopied ? <Check size={15} strokeWidth={2} /> : <Share2 size={15} strokeWidth={2} />}
          {showCopied ? "Copied!" : "Share"}
        </button>
        {isOwner && (
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} strokeWidth={2} />}
          </button>
        )}
      </div>

      {/* Comments */}
      {expanded && (
        <div className={styles.commentsWrap}>
          <div className={styles.commentInput}>
            <div className={styles.avatar} style={{ background: "var(--surface-3)", width: 28, height: 28, fontSize: 10 }}>ME</div>
            <input
              className={styles.commentBox}
              placeholder="Add your take…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendComment()}
            />
            <button className={styles.sendBtn} onClick={sendComment} disabled={sendingComment}>
              {sendingComment ? <Loader2 size={13} className={styles.spin} /> : "Post"}
            </button>
          </div>

          {!commentsLoaded && <div className={styles.commentsLoading}><Loader2 size={16} className={styles.spin} /></div>}

          {comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.avatar} style={{ background: avatarColor(c.author_name), width: 28, height: 28, fontSize: 10 }}>
                {initials(c.author_name)}
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{c.author_name}</span>
                  <span className={styles.commentTime}>{timeAgo(c.created_at)}</span>
                </div>
                <p className={styles.commentText}>{c.content}</p>
                <button
                  className={`${styles.likeBtn}${c.liked ? " " + styles.liked : ""}`}
                  onClick={() => toggleCommentLike(c.id)}
                >
                  <ThumbsUp size={11} strokeWidth={2} />
                  {c.likes_count}
                </button>
              </div>
            </div>
          ))}

          {commentsLoaded && comments.length === 0 && (
            <p className={styles.noComments}>No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DebatesPage() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const [filter, setFilter] = useState<"hot" | "new">("hot");
  const [showCompose, setShowCompose] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [debateVotes, setDebateVotes] = useState<Record<string, string>>({});
  const [votingDebate, setVotingDebate] = useState<string | null>(null);
  const [showCreateDebate, setShowCreateDebate] = useState(false);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user?.id) setCurrentUserId(d.user.id);
    }).catch(() => {});
  }, []);

  // Fetch featured debates
  useEffect(() => {
    fetch("/api/debates").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setDebates(d);
    }).catch(() => {});
  }, []);

  const voteDebate = async (debateId: string, option: "A" | "B") => {
    if (votingDebate || debateVotes[debateId]) return;
    setVotingDebate(debateId);
    try {
      const res = await fetch(`/api/debates/${debateId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      if (res.ok) {
        const data = await res.json();
        setDebateVotes((prev) => ({ ...prev, [debateId]: data.userVote ?? option }));
        setDebates((prev) => prev.map((d) =>
          d.id === debateId ? { ...d, votesA: data.votesA, votesB: data.votesB } : d
        ));
      }
    } finally {
      setVotingDebate(null);
    }
  };

  const fetchPosts = useCallback(async (sport: string, replace = true) => {
    if (replace) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts?sport=${sport}&limit=20`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      if (replace) {
        setPosts(data.posts ?? []);
      } else {
        setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      }
      setNextCursor(data.nextCursor);
    } catch {
      setError("Could not load posts. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeSport);
  }, [activeSport, fetchPosts]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?sport=${activeSport}&cursor=${encodeURIComponent(nextCursor)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [...prev, ...(data.posts ?? [])]);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
    setShowCompose(false);
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // Filtered posts
  const displayed = filter === "hot"
    ? [...posts].sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    : [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <AppShell active="funzone" title="Debates" subtitle="Post · Vote · React">
      <div className="stack">
        {/* Compose bar */}
        <div className={styles.composeTrigger} onClick={() => setShowCompose(true)}>
          <div className={styles.composeTriggerAvatar}>ME</div>
          <span className={styles.composeTriggerText}>
            Share a hot take on {activeSportConfig.label}…
          </span>
          <button className={styles.composeTriggerBtn} onClick={(e) => { e.stopPropagation(); setShowCompose(true); }}>
            <Plus size={13} /> Post
          </button>
        </div>

        {/* Header + filters */}
        <div className={styles.feedHeader}>
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <div className="title">
              <Flame size={17} className="title-icon" strokeWidth={2} />
              <span className="accent">Debates</span>
            </div>
          </div>
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab}${filter === "hot" ? " " + styles.filterTabActive : ""}`}
              onClick={() => setFilter("hot")}
            >
              <TrendingUp size={13} strokeWidth={2} /> Hot
            </button>
            <button
              className={`${styles.filterTab}${filter === "new" ? " " + styles.filterTabActive : ""}`}
              onClick={() => setFilter("new")}
            >
              <Zap size={13} strokeWidth={2} /> New
            </button>
          </div>
        </div>


        {/* Feed */}
        {loading ? (
          <div className={styles.feedLoading}>
            <Loader2 size={24} className={styles.spin} />
            <span>Loading debates…</span>
          </div>
        ) : error ? (
          <div className={styles.feedError}>
            <AlertCircle size={20} />
            <p>{error}</p>
            <button className={styles.feedEmptyBtn} onClick={() => fetchPosts(activeSport)}>
              Retry
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className={styles.feedEmpty}>
            <MessageCircle size={40} strokeWidth={1.5} style={{ color: "var(--text-mute)" }} />
            <p>No debates yet for {activeSportConfig.label}.</p>
            <button className={styles.feedEmptyBtn} onClick={() => setShowCompose(true)}>
              <Plus size={13} /> Start the first debate
            </button>
          </div>
        ) : (
          <div className={styles.feed}>
            {displayed.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} />
            ))}

            {nextCursor && (
              <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={14} className={styles.spin} /> : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onPost={handleNewPost}
          sport={activeSport}
        />
      )}

      {showCreateDebate && (
        <CreateDebateModal
          onClose={() => setShowCreateDebate(false)}
          onCreated={(debate) => {
            setDebates((prev) => [debate, ...prev]);
            setShowCreateDebate(false);
          }}
          sport={activeSport}
        />
      )}
    </AppShell>
  );
}
