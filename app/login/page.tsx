"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";
import { Mail, Eye, EyeOff, Check, X, Loader2, Phone, Smartphone, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePhoneAuth } from "@/hooks/usePhoneAuth";
import { COUNTRY_CODES, DEFAULT_COUNTRY, type CountryCode } from "@/lib/country-codes";
import { createClient } from "@/utils/supabase/client";


type Mode = "login" | "signup" | "forgot" | "phone";

/* ── Stage panel — interactive holographic match card ──── */
function Stage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  /* Drag state */
  const dragRef = useRef({
    dragging: false,
    startX: 0, startY: 0,
    offsetX: 0, offsetY: 0,
    currentX: 0, currentY: 0,
    velX: 0, velY: 0,
    lastMoveX: 0, lastMoveY: 0,
    lastMoveTime: 0,
  });

  const phrases = [
    "The hot take was correct.",
    "That goal was offside, actually.",
    "Stats don\u2019t lie, fans do.",
    "Your bracket, your rules.",
    "Argue with data, not feelings.",
    "Every match has a story.",
  ];

  useEffect(() => {
    const iv = setInterval(() => setPhraseIdx((i) => (i + 1) % phrases.length), 3000);
    return () => clearInterval(iv);
  }, [phrases.length]);

  /* 3D tilt on mouse move (only when not dragging) */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (d.dragging) return;
    const inner = innerRef.current;
    const glare = glareRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 25;
    const rotX = (0.5 - y) * 25;
    inner.style.transform = `rotateX(${rotX}deg) rotateY(${flipped ? 180 + rotY : rotY}deg) scale(1.04)`;
    if (glare) {
      glare.style.opacity = "1";
      const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);
      glare.style.background = `
        radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(200,255,61,0.45) 0%, rgba(255,140,50,0.3) 25%, rgba(160,80,220,0.25) 50%, transparent 70%),
        linear-gradient(${angle}deg, rgba(200,255,61,0.2) 0%, rgba(255,140,50,0.15) 40%, rgba(160,80,220,0.2) 100%)
      `;
    }
  }, [flipped]);

  const handleMouseLeave = useCallback(() => {
    const d = dragRef.current;
    if (d.dragging) return;
    const inner = innerRef.current;
    const glare = glareRef.current;
    if (inner) inner.style.transform = `rotateX(0) rotateY(${flipped ? 180 : 0}deg) scale(1)`;
    if (glare) glare.style.opacity = "0";
  }, [flipped]);

  /* Double-click to flip */
  const handleDoubleClick = useCallback(() => {
    setFlipped(f => !f);
    const inner = innerRef.current;
    const glare = glareRef.current;
    if (inner) inner.style.transform = `rotateX(0) rotateY(${!flipped ? 180 : 0}deg) scale(1)`;
    if (glare) glare.style.opacity = "0";
  }, [flipped]);

  /* Drag handlers */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    const wrapper = (e.currentTarget as HTMLElement);
    wrapper.setPointerCapture(e.pointerId);
    d.dragging = true;
    d.startX = e.clientX - d.currentX;
    d.startY = e.clientY - d.currentY;
    d.lastMoveX = e.clientX;
    d.lastMoveY = e.clientY;
    d.lastMoveTime = Date.now();
    d.velX = 0;
    d.velY = 0;
    wrapper.style.cursor = "grabbing";
    wrapper.style.transition = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const now = Date.now();
    const dt = Math.max(now - d.lastMoveTime, 1);
    const newX = e.clientX - d.startX;
    const newY = e.clientY - d.startY;
    d.velX = (e.clientX - d.lastMoveX) / dt * 16;
    d.velY = (e.clientY - d.lastMoveY) / dt * 16;
    d.lastMoveX = e.clientX;
    d.lastMoveY = e.clientY;
    d.lastMoveTime = now;
    d.currentX = newX;
    d.currentY = newY;
    const wrapper = (e.currentTarget as HTMLElement);
    wrapper.style.transform = `translate(${newX}px, ${newY}px)`;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    const wrapper = (e.currentTarget as HTMLElement);
    wrapper.releasePointerCapture(e.pointerId);
    wrapper.style.cursor = "grab";

    /* Spring back with momentum */
    const spring = () => {
      d.velX *= 0.92;
      d.velY *= 0.92;
      d.currentX = d.currentX * 0.88 + d.velX;
      d.currentY = d.currentY * 0.88 + d.velY;
      wrapper.style.transform = `translate(${d.currentX}px, ${d.currentY}px)`;
      if (Math.abs(d.currentX) > 0.5 || Math.abs(d.currentY) > 0.5 || Math.abs(d.velX) > 0.3 || Math.abs(d.velY) > 0.3) {
        requestAnimationFrame(spring);
      } else {
        d.currentX = 0;
        d.currentY = 0;
        wrapper.style.transform = "translate(0, 0)";
        wrapper.style.transition = "";
      }
    };
    requestAnimationFrame(spring);
  }, []);

  return (
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.stageNoise} />

      {/* Brand */}
      <a href="/" className={styles.brand}>
        <div className={styles.brandMark}>C</div>
        <span>curly<span className={styles.dot}>.</span>sports</span>
      </a>

      {/* Interaction guide */}
      <div className={styles.guideBar}>
        <span className={styles.guideItem}>
          <kbd className={styles.guideKbd}>Hover</kbd> Tilt
        </span>
        <span className={styles.guideSep} />
        <span className={styles.guideItem}>
          <kbd className={styles.guideKbd}>Drag</kbd> Move
        </span>
        <span className={styles.guideSep} />
        <span className={styles.guideItem}>
          <kbd className={styles.guideKbd}>2x Click</kbd> Flip
        </span>
      </div>

      {/* Center — holographic match card */}
      <div className={styles.stageCenter}>
        <div
          className={styles.holoWrapper}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <div
            ref={innerRef}
            className={`${styles.holoInner} ${flipped ? styles.holoFlipped : ""}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* ─── FRONT FACE ─── */}
            <div className={styles.holoFront}>
              {/* Holographic glare overlay */}
              <div ref={glareRef} className={styles.holoGlare} />

              {/* LIVE badge */}
              <div className={styles.holoLive}>
                <span className={styles.holoLiveDot} />
                LIVE
              </div>

              {/* Curly Sports mascot logo */}
              <img
                src="/curly-mark.png"
                alt="Curly Sports"
                className={styles.holoMascot}
              />

              {/* League label */}
              <div className={styles.holoLeague}>LA LIGA</div>

              {/* Match score */}
              <div className={styles.holoMatch}>
                <div className={styles.holoTeam}>
                  <div className={styles.holoTeamIcon} style={{ background: "linear-gradient(135deg, #a50044, #004d98)" }}>
                    <span style={{ fontSize: 22 }}>B</span>
                  </div>
                  <span className={styles.holoTeamName}>Barcelona</span>
                </div>
                <div className={styles.holoScore}>
                  <span>3</span>
                  <span className={styles.holoScoreSep}>:</span>
                  <span>1</span>
                </div>
                <div className={styles.holoTeam}>
                  <div className={styles.holoTeamIcon} style={{ background: "linear-gradient(135deg, #febe10, #00529f)" }}>
                    <span style={{ fontSize: 22 }}>R</span>
                  </div>
                  <span className={styles.holoTeamName}>Real Madrid</span>
                </div>
              </div>

              {/* Match minute */}
              <div className={styles.holoMinute}>82&apos;</div>

              {/* Scorers */}
              <div className={styles.holoScorers}>
                <div className={styles.holoScorerSide}>
                  <span>Lamine Yamal 18&apos;</span>
                  <span>Lewandowski 45&apos;</span>
                  <span>Pedri 71&apos;</span>
                </div>
                <div className={styles.holoScorerSide}>
                  <span>Mbapp&eacute; 33&apos;</span>
                </div>
              </div>
            </div>

            {/* ─── BACK FACE ─── */}
            <div className={styles.holoBack}>
              <div className={styles.backTitle}>Match Stats</div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>62%</span>
                <span className={styles.statLabel}>Possession</span>
                <span className={styles.statVal}>38%</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "62%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>15</span>
                <span className={styles.statLabel}>Shots</span>
                <span className={styles.statVal}>8</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "65%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>7</span>
                <span className={styles.statLabel}>On Target</span>
                <span className={styles.statVal}>3</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "70%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>537</span>
                <span className={styles.statLabel}>Passes</span>
                <span className={styles.statVal}>328</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "62%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>89%</span>
                <span className={styles.statLabel}>Pass Acc.</span>
                <span className={styles.statVal}>82%</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "52%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.statRow}>
                <span className={styles.statVal}>11</span>
                <span className={styles.statLabel}>Corners</span>
                <span className={styles.statVal}>4</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "73%", background: "linear-gradient(90deg, #a50044, #004d98)" }} />
              </div>

              <div className={styles.backFlipHint}>Double-click to flip back</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom — phrase ticker */}
      <div className={styles.stageBottom}>
        <div className={styles.phraseTicker}>
          <span className={styles.phraseQuote}>&ldquo;</span>
          <p key={phraseIdx} className={styles.phraseText}>
            {phrases[phraseIdx]}
          </p>
          <span className={styles.phraseQuote}>&rdquo;</span>
        </div>
        <div className={styles.phraseDotsRow}>
          {phrases.map((_, i) => (
            <span
              key={i}
              className={`${styles.phraseDot} ${i === phraseIdx ? styles.phraseDotActive : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── OTP verification component ────────────────────────────── */
function OtpScreen({
  email, error, setError, onBack, onVerified,
}: {
  email: string;
  error: string | null;
  setError: (e: string | null) => void;
  onBack: () => void;
  onVerified: () => void;
}) {
  const { t } = useLanguage();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeLeft(600);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { otpRefs.current[0]?.focus(); }, []);

  function formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(null);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) return;
    setVerifying(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("auth.verificationFailed"));
      setOtpSuccess(true);
      setTimeout(onVerified, 1500);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : t("auth.verificationFailed"));
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("auth.failedToResend"));
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setTimeLeft(600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.failedToResend"));
    } finally {
      setResending(false);
    }
  }

  if (otpSuccess) {
    return (
      <div className={styles.formSide}>
        <div className={styles.formTag}>{t("auth.verified")}</div>
        <h1 className={styles.formTitle}>{t("auth.youreIn")}</h1>
        <p className={styles.formSub}>{t("auth.emailVerifiedRedirecting")}</p>
      </div>
    );
  }

  return (
    <div className={styles.formSide}>
      <a href="/" className={styles.mobileBrand}>
        <div className={styles.mobileBrandMark}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-guy.png" alt="Curly" />
        </div>
        <span>curly<span className={styles.dot}>.</span>sports</span>
      </a>
      <div className={styles.formTag}>{t("auth.verifyEmailTitle")}</div>
      <h1 className={styles.formTitle}>{t("auth.enterYourCodeWeb")}</h1>
      <p className={styles.formSub}>
        {t("auth.weSentCodeWeb").replace("{email}", email)}
      </p>

      <div className={styles.otpGroup}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            className={styles.otpInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            placeholder="-"
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            onPaste={handleOtpPaste}
          />
        ))}
      </div>

      <div className={styles.otpTimer}>
        {timeLeft > 0 ? <>{t("auth.codeExpiresIn")}<strong>{formatTimer(timeLeft)}</strong></> : <strong>{t("auth.codeExpired")}</strong>}
      </div>

      {(otpError || error) && <div className={styles.errorBanner}>{otpError || error}</div>}

      <button
        className={styles.btnPrimary}
        onClick={handleVerify}
        disabled={verifying || otp.join("").length < 6}
      >
        {verifying ? t("auth.verifying") : t("auth.verifyCode")}
      </button>

      <div className={styles.emailSentBox}>
        <div className={styles.emailSentIcon}><Mail size={24} strokeWidth={1.5} /></div>
        <p>{t("auth.didntGetCode")}{" "}
          <button className={styles.inlineLink} onClick={handleResend} disabled={resending}>
            {resending ? t("auth.sending") : t("auth.resendCodeAction")}
          </button>.
        </p>
      </div>

      <button
        className={styles.btnPrimary}
        style={{ marginTop: "1rem", background: "transparent", color: "#0c0a1d", boxShadow: "none" }}
        onClick={onBack}
      >
        {t("auth.backToLogin")}
      </button>
    </div>
  );
}

/* ── Phone OTP flow ────────────────────────────────────── */
function PhoneOtpScreen({ onBack, onVerified }: { onBack: () => void; onVerified: () => void }) {
  const { t } = useLanguage();
  const { sendOtp, verifyOtp, reset, loading, error, codeSent } = usePhoneAuth();
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullNumber = `${country.dial}${phoneNumber.replace(/\s/g, "")}`;

  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRY_CODES;

  useEffect(() => {
    if (codeSent) otpRefs.current[0]?.focus();
  }, [codeSent]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 4) {
      setOtpError(t("auth.invalidPhone"));
      return;
    }
    setOtpError(null);
    await sendOtp(fullNumber);
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(null);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) return;
    setOtpError(null);
    const result = await verifyOtp(code);
    if (result) {
      setSuccess(true);
      setTimeout(onVerified, 1500);
    } else {
      setOtpError(error || t("auth.verificationFailed"));
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  }

  if (success) {
    return (
      <div className={styles.formSide}>
        <div className={styles.formTag}>{t("auth.verified")}</div>
        <h1 className={styles.formTitle}>{t("auth.youreIn")}</h1>
        <p className={styles.formSub}>{t("auth.phoneVerified")}</p>
      </div>
    );
  }

  return (
    <div className={styles.formSide}>
      <a href="/" className={styles.mobileBrand}>
        <div className={styles.mobileBrandMark}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curly-guy.png" alt="Curly" />
        </div>
        <span>curly<span className={styles.dot}>.</span>sports</span>
      </a>

      <div className={styles.formTag}>{t("auth.signInWithPhone")}</div>
      <h1 className={styles.formTitle}>
        {codeSent ? t("auth.enterPhoneOtp") : t("auth.signInWithPhone")}
      </h1>
      <p className={styles.formSub}>
        {codeSent
          ? t("auth.weSentPhoneCode").replace("{phone}", phoneNumber)
          : t("auth.invalidPhone").replace("Enter a valid phone number with country code (e.g. +1234567890)", "Enter your phone number with country code to receive a verification SMS.")}
      </p>

      {!codeSent ? (
        <form onSubmit={handleSendOtp}>
          <div className={styles.field}>
            <label htmlFor="phone">{t("auth.phoneNumber")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={styles.btnSocial}
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                style={{
                  padding: "12px 10px", width: "auto", flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", boxShadow: "none", borderRadius: 14,
                }}
              >
                {country.code} {country.dial}
                <ChevronDown size={14} />
              </button>
              <input
                id="phone"
                type="tel"
                placeholder="50 123 4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                autoComplete="tel"
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>

            {showCountryDropdown && (
              <div style={{
                marginTop: 8, background: "#fffdf7", border: "2px solid #0c0a1d",
                borderRadius: 12, maxHeight: 260, overflow: "hidden", display: "flex", flexDirection: "column",
              }}>
                <input
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  style={{
                    padding: "10px 14px", border: "none", borderBottom: "2px solid #0c0a1d",
                    fontFamily: "var(--body)", fontSize: 13, color: "#0c0a1d",
                    background: "#fffdf7", outline: "none",
                  }}
                />
                <div style={{ overflowY: "auto", maxHeight: 210 }}>
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code + c.dial}
                      type="button"
                      onClick={() => { setCountry(c); setShowCountryDropdown(false); setCountrySearch(""); }}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: country.code === c.code ? "var(--accent, #c8ff3d)" : "transparent",
                        border: "none", fontFamily: "var(--body)", fontSize: 13, color: "#0c0a1d",
                        cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between",
                        borderBottom: "1px solid rgba(12,10,29,0.1)",
                      }}
                    >
                      <span>{c.name}</span>
                      <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "rgba(12,10,29,0.5)" }}>{c.dial}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(otpError || error) && <div className={styles.errorBanner}>{otpError || error}</div>}

          <button id="send-otp-btn" className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? t("auth.sendingOtp") : t("auth.sendOtp")}
          </button>
        </form>
      ) : (
        <>
          <div className={styles.otpGroup}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                className={styles.otpInput}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                placeholder="-"
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
              />
            ))}
          </div>

          {(otpError || error) && <div className={styles.errorBanner}>{otpError || error}</div>}

          <button
            className={styles.btnPrimary}
            onClick={handleVerify}
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? t("auth.verifying") : t("auth.verifyCode")}
          </button>

          <button
            className={styles.btnPrimary}
            style={{ marginTop: "0.75rem", background: "transparent", color: "#0c0a1d", boxShadow: "none" }}
            onClick={() => { reset(); setOtp(["", "", "", "", "", ""]); }}
          >
            {t("auth.tryAgain")}
          </button>
        </>
      )}


      <button
        className={styles.btnPrimary}
        style={{ marginTop: "1.5rem", background: "transparent", color: "#0c0a1d", boxShadow: "none" }}
        onClick={onBack}
      >
        {t("auth.backToLogin")}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralCode] = useState(() => searchParams.get("ref") ?? "");
  const redirectAfterLogin = searchParams.get("redirect") || "/dashboard";

  // Show Google OAuth error from callback redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        no_code: "Google sign-in was cancelled",
        google_not_configured: "Google sign-in is not configured",
        google_token_failed: "Google sign-in failed. Please try again.",
        google_userinfo_failed: "Could not get your Google account info",
        account_suspended: "This account has been suspended",
        auth_callback_failed: `Sign-in failed: ${searchParams.get("debug") || "unknown error"}`,
      };
      setError(errorMessages[oauthError] || `Sign-in error: ${oauthError}`);
    }
  }, [searchParams]);

  const checkUsername = useCallback((value: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) { setUsernameStatus("idle"); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setEmailSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.needsVerification) {
            setVerificationEmail(json.email || email);
            setNeedsVerification(true);
            return;
          }
          throw new Error(json.error ?? t("auth.loginFailed"));
        }
        router.push(redirectAfterLogin);
        router.refresh();

      } else if (mode === "signup") {
        if (!username.trim()) throw new Error(t("auth.pickUsernameError"));
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username: username.trim(), ...(referralCode && { referralCode }) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("auth.signupFailed"));
        if (json.needsVerification) {
          setVerificationEmail(email);
          setNeedsVerification(true);
          return;
        }
        router.push(redirectAfterLogin);
        router.refresh();

      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("auth.failedToSendReset"));
        setEmailSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin.replace(/\/$/, "").replace("://0.0.0.0", "://localhost");
      const callbackUrl = `${origin}/auth/callback`;

      // Store redirect info in a cookie (Supabase may reject redirectTo with query params)
      const authState = JSON.stringify({ next: redirectAfterLogin, ref: referralCode || "" });
      document.cookie = `oauth_state=${encodeURIComponent(authState)};path=/;max-age=600;samesite=lax`;

      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        console.error("Google OAuth error:", oauthError);
        setError(oauthError.message);
        setLoading(false);
      }
      // If no error, browser will redirect — don't setLoading(false)
    } catch (err) {
      console.error("Google OAuth exception:", err);
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  /* ── Phone OTP screen ─────────────────────────────────────── */
  if (mode === "phone") {
    return (
      <div className={styles.layout}>
        <Stage />
        <PhoneOtpScreen
          onBack={() => switchMode("login")}
          onVerified={() => { router.replace(redirectAfterLogin); router.refresh(); }}
        />
      </div>
    );
  }

  /* ── OTP verification screen ───────────────────────────────── */
  if (needsVerification) {
    return (
      <div className={styles.layout}>
        <Stage />
        <OtpScreen
          email={verificationEmail}
          error={error}
          setError={setError}
          onBack={() => { setNeedsVerification(false); setError(null); switchMode("login"); }}
          onVerified={() => { router.replace("/dashboard"); }}
        />
      </div>
    );
  }

  /* ── "Check your email" screen ─────────────────────────────── */
  if (emailSent) {
    return (
      <div className={styles.layout}>
        <Stage />
        <div className={styles.formSide}>
          <a href="/" className={styles.mobileBrand}>
            <div className={styles.mobileBrandMark}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/curly-guy.png" alt="Curly" />
            </div>
            <span>curly<span className={styles.dot}>.</span>sports</span>
          </a>
          <div className={styles.formTag}>{t("auth.checkInboxTag")}</div>
          <h1 className={styles.formTitle}>
            {t("auth.resetLinkSent")}
          </h1>
          <p className={styles.formSub}>
            {t("auth.weSentResetLinkWeb").replace("{email}", email)}
          </p>
          <div className={styles.emailSentBox}>
            <div className={styles.emailSentIcon}><Mail size={24} strokeWidth={1.5} /></div>
            <p>{t("auth.didntGetItWeb")}{" "}
              <button
                className={styles.inlineLink}
                onClick={() => { setEmailSent(false); setError(null); }}
              >
                {t("auth.tryAgain")}
              </button>.
            </p>
          </div>
          <button
            className={styles.btnPrimary}
            style={{ marginTop: "2rem" }}
            onClick={() => switchMode("login")}
          >
            {t("auth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────────── */
  return (
    <div className={styles.layout}>
      <Stage />

      <div className={styles.formSide}>
        <a href="/" className={styles.mobileBrand}>
          <div className={styles.mobileBrandMark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="Curly" />
          </div>
          <span>curly<span className={styles.dot}>.</span>sports</span>
        </a>
        <div className={styles.formTag}>
          {mode === "login" ? t("auth.welcomeBackTag") : mode === "signup" ? t("auth.joinCurlyTag") : t("auth.resetPasswordTag")}
        </div>

        <h1 className={styles.formTitle}>
          {mode === "login" ? t("auth.argueWithData")
            : mode === "signup" ? t("auth.makeAnAccount")
            : t("auth.forgotYourPassword")}
        </h1>

        <p className={styles.formSub}>
          {mode === "login"
            ? t("auth.loginSubtitle")
            : mode === "signup"
            ? t("auth.signupSubtitle")
            : t("auth.forgotSubtitle")}
        </p>

        {mode !== "forgot" && (
          <div className={styles.toggle}>
            <button
              type="button"
              className={mode === "login" ? styles.toggleActive : ""}
              onClick={() => switchMode("login")}
            >{t("auth.login")}</button>
            <button
              type="button"
              className={mode === "signup" ? styles.toggleActive : ""}
              onClick={() => switchMode("signup")}
            >{t("auth.signup")}</button>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className={styles.field}>
              <label htmlFor="username">{t("auth.pickUsername")}</label>
              <input
                id="username"
                type="text"
                placeholder={t("auth.usernamePlaceholder")}
                value={username}
                onChange={(e) => { setUsername(e.target.value); checkUsername(e.target.value); }}
                required
              />
              <div className={styles.fieldHelper}>
                {usernameStatus === "checking" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#999" }}>
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> {t("auth.checking")}
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#22c55e" }}>
                    <Check size={12} /> {t("auth.available")}
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#ef4444" }}>
                    <X size={12} /> {t("auth.usernameTaken")}
                  </span>
                )}
                {usernameStatus === "invalid" && (
                  <span style={{ color: "#ef4444" }}>{t("auth.usernameRules")}</span>
                )}
                {usernameStatus === "idle" && t("auth.usernameHint")}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className={styles.field}>
              <div className={styles.fieldRow}>
                <label htmlFor="password">{t("auth.password")}</label>
                {mode === "login" && (
                  <button
                    type="button"
                    className={styles.forgot}
                    onClick={() => switchMode("forgot")}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "signup" ? 8 : undefined}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === "signup" && (
                <div className={styles.fieldHelper}>{t("auth.atLeast8Chars")}</div>
              )}
            </div>
          )}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? t("auth.pleaseWait") : mode === "login" ? t("auth.logInArrow") : mode === "signup" ? t("auth.createMyAccountArrow") : t("auth.sendResetLinkArrowWeb")}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className={styles.divider}>{t("auth.orContinueWith")}</div>

            <div className={styles.socialRow}>
              <button
                type="button"
                className={styles.btnSocial}
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.93c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.21-4.74 3.21-8.32z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.99 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.85 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18a10.99 10.99 0 0 0 0 9.87l3.67-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                {t("auth.google")}
              </button>
              <button
                type="button"
                className={styles.btnSocial}
                onClick={() => switchMode("phone")}
                disabled={loading}
              >
                <Smartphone size={18} />
                {t("auth.phone")}
              </button>
            </div>
          </>
        )}

  
        <p className={styles.below}>
          {mode === "login" ? (
            <>{t("auth.newToCurly")}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("signup"); }}>
                {t("auth.makeAnAccountLink")}
              </a>
            </>
          ) : mode === "signup" ? (
            <>{t("auth.alreadyOnCurly")}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }}>
                {t("auth.logInLink")}
              </a>
            </>
          ) : (
            <>{t("auth.rememberIt")}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }}>
                {t("auth.backToLoginLink")}
              </a>
            </>
          )}
        </p>

        <p className={styles.terms}>
          {t("auth.termsText")}
        </p>
      </div>
    </div>
  );
}
