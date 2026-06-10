"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import styles from "./login.module.css";
import { Mail } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

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
          <div className={styles.orbitRing} />
          <div className={`${styles.orbitRing} ${styles.r2}`} />
          <div className={styles.mascotDisc}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-guy.png" alt="Curly Sports Founder" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
          </div>
          <div className={`${styles.orbitItem} ${styles.orbit1}`}>SOC</div>
          <div className={`${styles.orbitItem} ${styles.orbit2}`}>NBA</div>
          <div className={`${styles.orbitItem} ${styles.orbit3}`}>TEN</div>
          <div className={`${styles.orbitItem} ${styles.orbit4}`}>NFL</div>
        </div>
      </div>

      <div className={`${styles.scribble} ${styles.sc1}`}>say hi to Curly →</div>
      <div className={`${styles.scribble} ${styles.sc2}`}>← he&#39;s been waiting</div>

      <div className={`${styles.statFloat} ${styles.sf1}`}>
        <div className={styles.statNum}>34k+</div>
        <div className={styles.statLbl}>FANS ON BOARD</div>
      </div>
      <div className={`${styles.statFloat} ${styles.sf2}`}>
        <div className={styles.statNum}>2.3k</div>
        <div className={styles.statLbl}>DEBATES TODAY</div>
      </div>

      <div className={styles.ribbon}>
        <span><span className={styles.lime}>●</span> Live · 14 matches happening right now</span>
        <span>v1.0 · made on a napkin</span>
      </div>
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

  const router = useRouter();
  const supabase = createClient();

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        setEmailSent(true);

      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          }),
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

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  /* ── "Check your email" screen ─────────────────────────────── */
  if (emailSent) {
    return (
      <div className={styles.layout}>
        <Stage />
        <div className={styles.formSide}>
          <div className={styles.formTag}>
            {mode === "signup" ? "almost there" : "check inbox"}
          </div>
          <h1 className={styles.formTitle}>
            {mode === "signup" ? (
              <>Check<br />your <em>email.</em></>
            ) : (
              <>Reset<br />link <em>sent.</em></>
            )}
          </h1>
          <p className={styles.formSub}>
            {mode === "signup"
              ? `We sent a verification link to ${email}. Click it to activate your account.`
              : `We sent a password reset link to ${email}. Check your inbox (and spam).`}
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
            ? "Free forever. Pick your sports, follow your teams, and join 34k+ fans who actually like sports analytics."
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
          <a href="#">Terms</a> and our actually-readable{" "}
          <a href="#">Privacy Policy</a>. Curly never sells your data — he&#39;s 17, he doesn&apos;t even know how.
        </p>
      </div>
    </div>
  );
}
