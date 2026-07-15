'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Icon from './ui/Icon';

/* ── Types ───────────────────────────────────────────────── */

interface Referral {
  id: string;
  username: string;
  status: 'pending' | 'verified' | 'rejected';
  joinedAt: string;
}

interface ReferralData {
  code: string;
  link: string;
  referralEntries: number;
  maxEntries: number;
  referrals: Referral[];
}

interface ReferralScreenProps {
  onBack: () => void;
}

/* ── Toast ──────────────────────────────────────────────── */

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2000); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 20px', background: 'var(--ink)', color: 'var(--accent)',
      borderRadius: 999, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000,
      animation: 'cs-fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  );
}

/* ── Main Screen ────────────────────────────────────────── */

export default function ReferralScreen({ onBack }: ReferralScreenProps) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchReferrals = useCallback(async () => {
    try {
      const token = localStorage.getItem('cs_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/challenges/referrals', { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setToast('Copied!')).catch(() => {});
  };

  const shareWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTwitter = (text: string) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    if (status === 'verified') return 'var(--accent)';
    if (status === 'pending') return 'var(--orange)';
    return 'var(--coral)';
  };

  const getStatusBg = (status: string) => {
    if (status === 'verified') return 'rgba(200,255,61,0.12)';
    if (status === 'pending') return 'rgba(255,165,0,0.1)';
    return 'rgba(255,91,61,0.1)';
  };

  const referralLink = data?.link ?? '';
  const shareText = `Join CurlySports and earn rewards! Use my referral code: ${data?.code ?? ''} ${referralLink}`;
  const progress = data ? Math.min(data.referralEntries / data.maxEntries, 1) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '2.5px solid var(--ink)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <button onClick={onBack} className="cs-tap" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 8, cursor: 'pointer' }}>
          <Icon name="chevron-left" size={16} style={{ color: 'var(--ink)' }} />
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', flex: 1 }}>Referrals</span>
        <Icon name="users" size={18} style={{ color: 'var(--accent)' }} />
      </div>

      {/* Scrollable Content */}
      <div className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[180, 120, 200].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 14, background: 'var(--surface)', border: '2px solid var(--border-2)', animation: 'cs-pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : !data ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="link" size={32} style={{ color: 'var(--text-mute)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No referral data</div>
            <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-mute)' }}>Vote on a challenge first to get your referral code.</div>
          </div>
        ) : (
          <>
            {/* Your Code */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 12 }}>Your Referral Code</div>

              <div
                onClick={() => copyToClipboard(data.code)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '16px 28px', marginBottom: 14,
                  background: 'var(--surface-2)', border: '2.5px dashed var(--accent)',
                  borderRadius: 12, cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.18em' }}>
                  {data.code}
                </span>
                <Icon name="copy" size={20} style={{ color: 'var(--text-mute)' }} />
              </div>

              <div style={{ fontFamily: 'var(--body)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 2 }}>Tap code to copy</div>
            </div>

            {/* Referral Link */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Referral Link</div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 14,
                background: 'var(--surface-2)', border: '1.5px solid var(--border-2)',
                borderRadius: 10,
              }}>
                <Icon name="link" size={14} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {referralLink}
                </span>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="cs-tap"
                  style={{
                    padding: '6px 12px', background: 'var(--ink)', border: '1.5px solid var(--ink)',
                    borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                    color: 'var(--accent)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Share Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="cs-tap"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 12px', background: 'var(--surface)', border: '2px solid var(--ink)',
                    borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                    color: 'var(--ink)', cursor: 'pointer',
                  }}
                >
                  <Icon name="link" size={14} />
                  Copy Link
                </button>
                <button
                  onClick={() => shareWhatsApp(shareText)}
                  className="cs-tap"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 12px', background: '#25D366', border: '2px solid var(--ink)',
                    borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                    color: '#fff', cursor: 'pointer',
                  }}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => shareTwitter(shareText)}
                  className="cs-tap"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 12px', background: 'var(--ink)', border: '2px solid var(--ink)',
                    borderRadius: 10, fontFamily: 'var(--body)', fontSize: 12, fontWeight: 700,
                    color: '#fff', cursor: 'pointer',
                  }}
                >
                  Twitter/X
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase' }}>Referral Entries</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                  {data.referralEntries} of {data.maxEntries}
                </span>
              </div>

              <div style={{ width: '100%', height: 10, background: 'var(--surface-2)', borderRadius: 999, border: '1.5px solid var(--border-2)', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress * 100}%`, height: '100%',
                  background: 'var(--accent)', borderRadius: 999,
                  transition: 'width 0.5s ease',
                  minWidth: progress > 0 ? 8 : 0,
                }} />
              </div>
              <div style={{ fontFamily: 'var(--body)', fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
                Each verified referral earns you +1 entry. Maximum {data.maxEntries} referral entries.
              </div>
            </div>

            {/* Referral List */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--border-2)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 12 }}>
                Invited Friends ({data.referrals.length})
              </div>

              {data.referrals.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <Icon name="users" size={24} style={{ color: 'var(--text-mute)', margin: '0 auto 8px' }} />
                  <div style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'var(--text-mute)' }}>
                    No referrals yet. Share your code to get started!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.referrals.map((ref, idx) => (
                    <div key={ref.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      borderBottom: idx < data.referrals.length - 1 ? '1px solid var(--border-2)' : 'none',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'var(--surface-2)', border: '1.5px solid var(--border-2)',
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11, color: 'var(--text-dim)' }}>
                          {ref.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Name + date */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ref.username}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>
                          {new Date(ref.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div style={{
                        padding: '3px 10px', borderRadius: 999,
                        background: getStatusBg(ref.status),
                        border: `1.5px solid ${getStatusColor(ref.status)}`,
                      }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: getStatusColor(ref.status), textTransform: 'capitalize' }}>
                          {ref.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom spacer */}
            <div style={{ height: 16 }} />
          </>
        )}
      </div>

      {toast && <Toast message={toast} onHide={() => setToast('')} />}
      <style>{`@keyframes cs-fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
