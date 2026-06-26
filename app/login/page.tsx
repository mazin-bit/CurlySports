"use client";
export const dynamic = "force-dynamic";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { Mail } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/* ── Shared mascot left-panel ──────────────────────────────── */
function Stage() {
  return (
    <div className={styles.stage}>
      <a href="/" className={styles.brand}>
        <div className={styles.brandMark}>C</div>
        <span>curly<span className={styles.dot}>.</span>sports</span>
      </a>

      <div className={styles.mascotStage}>
        <div className={styles.mascotFrame}>
          <div className={styles.mascotDisc}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="Curly" className={styles.mascotImg} />
          </div>
        </div>
      </div>

      <div className={`${styles.scribble} ${styles.sc1}`}>your sports hub →</div>
      <div className={`${styles.scribble} ${styles.sc2}`}>← built for fans</div>

      <div className={`${styles.statFloat} ${styles.sf1}`}>
        <div className={styles.statNum}>150+</div>
        <div className={styles.statLbl}>LEAGUES COVERED</div>
      </div>
      <div className={`${styles.statFloat} ${styles.sf2}`}>
        <div className={styles.statNum}>Live</div>
        <div className={styles.statLbl}>SCORES NOW</div>
      </div>

      <div className={styles.ribbon}>
        <span><span className={styles.lime}>●</span> Real-time scores · 150+ leagues</span>
        <span>v1.0.14 · made for fans</span>
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
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
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
      if (!res.ok) throw new Error(json.error ?? "Verification failed.");
      setOtpSuccess(true);
      setTimeout(onVerified, 1500);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.");
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
      if (!res.ok) throw new Error(json.error ?? "Failed to resend.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setTimeLeft(600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend.");
    } finally {
      setResending(false);
    }
  }

  if (otpSuccess) {
    return (
      <div className={styles.formSide}>
        <div className={styles.formTag}>verified</div>
        <h1 className={styles.formTitle}>You&apos;re <em>in.</em></h1>
        <p className={styles.formSub}>Email verified successfully. Redirecting to your dashboard...</p>
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
      <div className={styles.formTag}>verify email</div>
      <h1 className={styles.formTitle}>Enter your<br /><em>code.</em></h1>
      <p className={styles.formSub}>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
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
        {timeLeft > 0 ? <>Code expires in <strong>{formatTimer(timeLeft)}</strong></> : <strong>Code expired</strong>}
      </div>

      {(otpError || error) && <div className={styles.errorBanner}>{otpError || error}</div>}

      <button
        className={styles.btnPrimary}
        onClick={handleVerify}
        disabled={verifying || otp.join("").length < 6}
      >
        {verifying ? "Verifying..." : "Verify code"}
      </button>

      <div className={styles.emailSentBox}>
        <div className={styles.emailSentIcon}><Mail size={24} strokeWidth={1.5} /></div>
        <p>Didn&apos;t get the code? Check your spam folder, or{" "}
          <button className={styles.inlineLink} onClick={handleResend} disabled={resending}>
            {resending ? "sending..." : "resend code"}
          </button>.
        </p>
      </div>

      <button
        className={styles.btnPrimary}
        style={{ marginTop: "1rem", background: "transparent", color: "#0c0a1d", boxShadow: "none" }}
        onClick={onBack}
      >
        Back to login
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const router = useRouter();

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
          throw new Error(json.error ?? "Login failed.");
        }
        router.push("/dashboard");
        router.refresh();

      } else if (mode === "signup") {
        if (!username.trim()) throw new Error("Please pick a username.");
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username: username.trim() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Signup failed.");
        if (json.needsVerification) {
          setVerificationEmail(email);
          setNeedsVerification(true);
          return;
        }
        router.push("/dashboard");
        router.refresh();

      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to send reset link.");
        setEmailSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google login is not configured.");
      return;
    }
    const origin = window.location.origin.replace("://0.0.0.0", "://localhost");
    const redirectUri = `${origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state: "/dashboard",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
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
          onVerified={() => { router.push("/dashboard"); router.refresh(); }}
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
          <div className={styles.formTag}>check inbox</div>
          <h1 className={styles.formTitle}>
            <>Reset<br />link <em>sent.</em></>
          </h1>
          <p className={styles.formSub}>
            {`We sent a password reset link to ${email}. Check your inbox (and spam).`}
          </p>
          <div className={styles.emailSentBox}>
            <div className={styles.emailSentIcon}><Mail size={24} strokeWidth={1.5} /></div>
            <p>Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                className={styles.inlineLink}
                onClick={() => { setEmailSent(false); setError(null); }}
              >
                try again
              </button>.
            </p>
          </div>
          <button
            className={styles.btnPrimary}
            style={{ marginTop: "2rem" }}
            onClick={() => switchMode("login")}
          >
            Back to login
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
          {mode === "login" ? "welcome back" : mode === "signup" ? "join curly" : "reset password"}
        </div>

        <h1 className={styles.formTitle}>
          {mode === "login" ? (
            <>Argue<br />with <em>actual</em><br />data.</>
          ) : mode === "signup" ? (
            <>Make an<br />account.<br /><em>Get loud.</em></>
          ) : (
            <>Forgot<br />your <em>password?</em></>
          )}
        </h1>

        <p className={styles.formSub}>
          {mode === "login"
            ? "Log in to see your personal dashboard, jump back into open debates, and check on your saved teams."
            : mode === "signup"
            ? "Free forever. Pick your sports, follow your teams, and join fans who actually like sports analytics."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>

        {mode !== "forgot" && (
          <div className={styles.toggle}>
            <button
              type="button"
              className={mode === "login" ? styles.toggleActive : ""}
              onClick={() => switchMode("login")}
            >Log in</button>
            <button
              type="button"
              className={mode === "signup" ? styles.toggleActive : ""}
              onClick={() => switchMode("signup")}
            >Sign up</button>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className={styles.field}>
              <label htmlFor="username">Pick a username</label>
              <input
                id="username"
                type="text"
                placeholder="e.g. footynerd_03"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className={styles.fieldHelper}>This is what everyone sees when you debate. Choose wisely.</div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className={styles.field}>
              <div className={styles.fieldRow}>
                <label htmlFor="password">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    className={styles.forgot}
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "signup" ? 8 : undefined}
              />
              {mode === "signup" && (
                <div className={styles.fieldHelper}>At least 8 characters.</div>
              )}
            </div>
          )}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Log in →" : mode === "signup" ? "Create my account →" : "Send reset link →"}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className={styles.divider}>or continue with</div>

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
                Google
              </button>
            </div>
          </>
        )}

        <p className={styles.below}>
          {mode === "login" ? (
            <>New to Curly?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("signup"); }}>
                Make an account →
              </a>
            </>
          ) : mode === "signup" ? (
            <>Already on Curly?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }}>
                Log in →
              </a>
            </>
          ) : (
            <>Remember it?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }}>
                Back to login →
              </a>
            </>
          )}
        </p>

        <p className={styles.terms}>
          By continuing you agree to our slightly-too-long{" "}
          <a href="/terms">Terms</a> and our actually-readable{" "}
          <a href="/privacy">Privacy Policy</a>. Curly never sells your data — he&#39;s 14, he doesn&apos;t even know how.
        </p>
      </div>
    </div>
  );
}
