"use client";
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../login/login.module.css";

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
      <div className={styles.ribbon}>
        <span><span className={styles.lime}>●</span> Real-time scores · 150+ leagues</span>
        <span>v1.0.19 · made for fans</span>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isMobile = searchParams.get("mobile") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDone(true);
      setTimeout(() => router.push(isMobile ? "/mobile" : "/dashboard"), 2200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.layout}>
        <Stage />
        <div className={styles.formSide}>
          <div className={styles.formTag}>all done</div>
          <h1 className={styles.formTitle}>Password <em>updated!</em></h1>
          <p className={styles.formSub}>
            Your password has been changed successfully. Redirecting you now…
          </p>
        </div>
      </div>
    );
  }

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

        <div className={styles.formTag}>new password</div>
        <h1 className={styles.formTitle}>
          Set your<br /><em>password.</em>
        </h1>
        <p className={styles.formSub}>
          Choose a strong new password for your Curly account.
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="new-password">New password</label>
            <div className={styles.passwordWrap}>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className={styles.fieldHelper}>At least 8 characters.</div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm-password">Confirm password</label>
            <div className={styles.passwordWrap}>
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Same again"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? "Updating…" : "Set new password →"}
          </button>
        </form>

        <p className={styles.below}>
          <a href={isMobile ? "/mobile" : "/login"}>← Back to login</a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
