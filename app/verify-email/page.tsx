"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
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
      <div className={`${styles.scribble} ${styles.sc1}`}>your sports hub &rarr;</div>
      <div className={`${styles.scribble} ${styles.sc2}`}>&larr; built for fans</div>
      <div className={styles.ribbon}>
        <span><span className={styles.lime}>&bull;</span> Real-time scores &middot; 150+ leagues</span>
        <span>v1.0 &middot; made for fans</span>
      </div>
    </div>
  );
}

function VerifyEmailContent() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Verification failed.");
        setStatus("success");
        if (json.alreadyVerified) {
          setMessage("Your email was already verified.");
        } else {
          setMessage("Your email has been verified successfully!");
        }
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });
  }, [token, router]);

  if (status === "verifying") {
    return (
      <div className={styles.layout}>
        <Stage />
        <div className={styles.formSide}>
          <div className={styles.formTag}>hold on</div>
          <h1 className={styles.formTitle}>Verifying your <em>email...</em></h1>
          <p className={styles.formSub}>Just a moment while we confirm your address.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.layout}>
        <Stage />
        <div className={styles.formSide}>
          <div className={styles.formTag}>all done</div>
          <h1 className={styles.formTitle}>Email <em>verified!</em></h1>
          <p className={styles.formSub}>
            {message} Redirecting you to the dashboard...
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

        <div className={styles.formTag}>oops</div>
        <h1 className={styles.formTitle}>Verification <em>failed.</em></h1>
        <p className={styles.formSub}>{message}</p>

        {message.includes("expired") && (
          <p className={styles.formSub}>
            Log in to request a new verification email.
          </p>
        )}

        <a href="/login" className={styles.btnPrimary} style={{ display: "inline-block", textAlign: "center", textDecoration: "none", marginTop: "16px" }}>
          Back to login &rarr;
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
