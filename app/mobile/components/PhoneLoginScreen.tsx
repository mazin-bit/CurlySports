'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Icon from './ui/Icon';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { COUNTRY_CODES, DEFAULT_COUNTRY, type CountryCode } from '@/lib/country-codes';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: 'var(--surface)',
  border: '2px solid var(--ink)',
  borderRadius: 10,
  fontFamily: 'var(--body)',
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block',
};

export default function PhoneLoginScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { sendOtp, verifyOtp, reset, loading, error, codeSent } = usePhoneAuth();
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [phoneNum, setPhoneNum] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (codeSent) otpRefs.current[0]?.focus();
  }, [codeSent]);

  const fullNumber = `${country.dial}${phoneNum.replace(/\s/g, '')}`;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNum.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 4) {
      setOtpError(t('auth.invalidPhone'));
      return;
    }
    setOtpError(null);
    await sendOtp(fullNumber);
  };

  const handleOtpChange = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next); setOtpError(null);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!p) return;
    const next = [...otp]; for (let i = 0; i < 6; i++) next[i] = p[i] || '';
    setOtp(next);
    otpRefs.current[next.findIndex(d => !d) >= 0 ? next.findIndex(d => !d) : 5]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setOtpError(null);
    const result = await verifyOtp(code);
    if (!result) {
      setOtpError(error || t('auth.verificationFailed'));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    // On success, usePhoneAuth sets JWT cookies — AuthContext will pick up the user
  };

  const filteredCountries = search
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRY_CODES;

  const otpInputStyle: React.CSSProperties = {
    width: 44, height: 52, background: 'var(--surface)', border: '2px solid var(--ink)',
    borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800,
    textAlign: 'center', color: 'var(--ink)', outline: 'none', caretColor: 'var(--orange)',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '0 24px', overflowY: 'auto' }}>
      <div style={{ paddingTop: 60, paddingBottom: 20 }}>
        <div style={{ width: 72, height: 72, background: 'var(--lime)', borderRadius: 18, border: '2.5px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', transform: 'rotate(-6deg)', display: 'grid', placeItems: 'center', overflow: 'hidden', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-guy.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)' }}>curlysports.com</div>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '6px 0 8px', lineHeight: 1.1 }}>
          {codeSent ? t('auth.enterPhoneOtp') : t('auth.signInWithPhone')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
          {codeSent
            ? `${t('auth.weSentPhoneCode').replace('{phone}', fullNumber)}`
            : 'Enter your phone number to receive a verification code via SMS.'}
        </p>
      </div>

      {!codeSent ? (
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)', display: 'block', marginBottom: 6 }}>
              {t('auth.phoneNumber')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: '13px 10px', background: 'var(--surface)', border: '2px solid var(--ink)',
                  borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                  color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {country.code} {country.dial}
                <svg width="10" height="6" viewBox="0 0 10 6" style={{ marginLeft: 2 }}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
              <input
                type="tel"
                value={phoneNum}
                onChange={e => setPhoneNum(e.target.value)}
                placeholder="50 123 4567"
                required
                autoComplete="tel"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
            </div>

            {showDropdown && (
              <div style={{
                marginTop: 8, background: 'var(--surface)', border: '2px solid var(--ink)',
                borderRadius: 12, maxHeight: 240, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  style={{
                    padding: '10px 12px', border: 'none', borderBottom: '2px solid var(--ink)',
                    fontFamily: 'var(--body)', fontSize: 13, color: 'var(--ink)',
                    background: 'var(--surface)', outline: 'none',
                  }}
                />
                <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                  {filteredCountries.map(c => (
                    <button
                      key={c.code + c.dial}
                      type="button"
                      onClick={() => { setCountry(c); setShowDropdown(false); setSearch(''); }}
                      style={{
                        width: '100%', padding: '10px 12px', background: country.code === c.code ? 'var(--accent)' : 'transparent',
                        border: 'none', fontFamily: 'var(--body)', fontSize: 13, color: 'var(--ink)',
                        cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-3)',
                      }}
                    >
                      <span>{c.name}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-dim)' }}>{c.dial}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(otpError || error) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', border: '2px solid var(--coral)', borderRadius: 10, padding: '10px 12px' }}>
              <Icon name="close" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--coral)', lineHeight: 1.4 }}>{otpError || error}</span>
            </div>
          )}

          <button
            id="send-otp-btn"
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 0', background: loading ? 'var(--surface-3)' : 'var(--ink)',
              border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
              color: loading ? 'var(--text-mute)' : 'var(--accent)',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '3px 3px 0 var(--accent)', transition: 'all .12s',
            }}
          >
            {loading ? t('auth.sendingOtp') : t('auth.sendOtp')}
          </button>
        </form>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0 12px' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el; }}
                style={otpInputStyle}
                type="text" inputMode="numeric" pattern="[0-9]" maxLength={1}
                value={digit} placeholder="-"
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKey(i, e)}
                onPaste={handleOtpPaste}
              />
            ))}
          </div>

          {(otpError || error) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--surface)', border: '2px solid var(--coral)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
              <Icon name="close" size={14} style={{ flexShrink: 0, color: 'var(--coral)', marginTop: 1 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--coral)', lineHeight: 1.4 }}>{otpError || error}</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length < 6}
            style={{
              padding: '14px 0', background: (loading || otp.join('').length < 6) ? 'var(--surface-3)' : 'var(--ink)',
              border: '2px solid var(--ink)', borderRadius: 12, fontFamily: 'var(--mono)',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
              color: (loading || otp.join('').length < 6) ? 'var(--text-mute)' : 'var(--accent)',
              cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || otp.join('').length < 6) ? 'none' : '3px 3px 0 var(--accent)', transition: 'all .12s',
            }}
          >
            {loading ? t('auth.verifying') : t('auth.verifyCode')}
          </button>

          <button
            onClick={() => { reset(); setOtp(['', '', '', '', '', '']); }}
            style={{
              marginTop: 12, padding: '12px 0', background: 'transparent', border: '2px solid var(--ink)',
              borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
              color: 'var(--text-mute)', cursor: 'pointer',
            }}
          >
            {t('auth.tryAgain')}
          </button>
        </>
      )}


      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {t('auth.backToSignIn')}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 32 }} />
      <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '0.06em', paddingBottom: 32 }}>
        CURLYSPORTS.COM · MADE IN A BEDROOM
      </div>
    </div>
  );
}
