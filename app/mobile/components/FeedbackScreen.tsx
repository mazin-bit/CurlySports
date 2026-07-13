'use client';
import { useState } from 'react';
import Topbar from './ui/Topbar';
import Icon from './ui/Icon';
import { Star, Bug, Lightbulb, Palette, Zap, HelpCircle, Send, CheckCircle, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { key: 'bug', label: 'Bug', icon: Bug },
  { key: 'feature', label: 'Feature', icon: Lightbulb },
  { key: 'ui', label: 'UI / Design', icon: Palette },
  { key: 'performance', label: 'Speed', icon: Zap },
  { key: 'other', label: 'Other', icon: HelpCircle },
];

interface FeedbackScreenProps {
  onBack: () => void;
}

export default function FeedbackScreen({ onBack }: FeedbackScreenProps) {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = category && subject.trim().length >= 3 && message.trim().length >= 10 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
          rating: rating || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCategory('');
    setSubject('');
    setMessage('');
    setEmail('');
    setRating(0);
    setSubmitted(false);
    setError('');
  };

  if (submitted) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)' }}>
          <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
            <ArrowLeft size={16} style={{ color: 'var(--ink)' }} />
          </button>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Feedback</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'var(--accent)', border: '2px solid var(--ink)', borderRadius: 14, display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <CheckCircle size={24} style={{ color: 'var(--ink)' }} />
          </div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Thanks!</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 280, lineHeight: 1.5 }}>
            We read every submission and use it to make Curly Sports better.
          </div>
          <button onClick={reset} className="cs-tap" style={{ marginTop: 12, padding: '10px 24px', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 10, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            Send another
          </button>
          <button onClick={onBack} className="cs-tap" style={{ padding: '8px 20px', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--text-mute)', cursor: 'pointer' }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
          <ArrowLeft size={16} style={{ color: 'var(--ink)' }} />
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Send Feedback</span>
      </div>

      {/* Scrollable form */}
      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Category chips */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Category</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              const active = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className="cs-tap"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: active ? 'var(--accent)' : 'var(--surface)',
                    border: `2px solid ${active ? 'var(--ink)' : 'var(--border-2)'}`,
                    borderRadius: 999,
                    fontSize: 12, fontWeight: active ? 700 : 600,
                    color: active ? 'var(--ink)' : 'var(--text-dim)',
                    cursor: 'pointer',
                    boxShadow: active ? '2px 2px 0 var(--ink)' : 'none',
                  }}
                >
                  <CatIcon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Subject</div>
          <input
            type="text"
            placeholder="Brief summary"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={120}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 10,
              fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Message */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Message</div>
          <textarea
            placeholder="Tell us more... (min 10 characters)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={2000}
            style={{
              width: '100%', minHeight: 120, padding: '10px 14px',
              background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 10,
              fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink)', outline: 'none',
              resize: 'vertical', lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 4, textAlign: 'right' }}>{message.length}/2000</div>
        </div>

        {/* Email */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Email (optional)</div>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 10,
              fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Rating */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Rate your experience</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const active = n <= rating;
              return (
                <button
                  key={n}
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className="cs-tap"
                  style={{
                    width: 38, height: 38,
                    display: 'grid', placeItems: 'center',
                    background: active ? '#f59e0b' : 'var(--surface)',
                    border: `2px solid ${active ? 'var(--ink)' : 'var(--border-2)'}`,
                    borderRadius: 8, cursor: 'pointer',
                    color: active ? 'var(--ink)' : 'var(--text-mute)',
                    boxShadow: active ? '2px 2px 0 var(--ink)' : 'none',
                  }}
                >
                  <Star size={16} fill={active ? 'currentColor' : 'none'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--coral)', fontWeight: 600 }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="cs-tap"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 24px',
            background: canSubmit ? 'var(--ink)' : 'var(--surface-3)',
            color: canSubmit ? 'var(--accent)' : 'var(--text-mute)',
            border: `2px solid ${canSubmit ? 'var(--ink)' : 'var(--border-2)'}`,
            borderRadius: 10,
            fontFamily: 'var(--display)', fontSize: 14, fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? 'var(--shadow-sm)' : 'none',
            width: '100%',
          }}
        >
          <Send size={15} />
          {submitting ? 'Sending...' : 'Submit Feedback'}
        </button>

        {/* Bottom spacer for safe area */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
