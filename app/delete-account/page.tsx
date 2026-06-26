"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";
import styles from "./delete-account.module.css";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "confirm" | "deleting" | "done">("info");
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  async function handleDelete() {
    setStep("deleting");
    setError("");

    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStep("confirm");
        return;
      }

      setStep("done");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStep("confirm");
    }
  }

  return (
    <div className={styles.layout}>
      {/* ── Top bar ── */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandMark}>C</div>
          <span>
            curly<span className={styles.dot}>.</span>sports
          </span>
        </Link>
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={14} strokeWidth={2.5} />
          <span>Back</span>
        </Link>
      </header>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroTag}>account management</div>
        <h1 className={styles.heroTitle}>
          Delete<br />
          <em>Account.</em>
        </h1>
        <p className={styles.heroSub}>
          We&apos;re sorry to see you go. This page allows you to permanently
          delete your Curly Sports account and all associated data.
        </p>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {step === "done" ? (
          <div className={styles.section}>
            <div className={styles.successBox}>
              <h2 className={styles.sectionTitle}>Account Deleted</h2>
              <p>
                Your account and all associated data have been permanently
                deleted. You will be redirected to the login page shortly.
              </p>
              <p>
                If you ever want to come back, you can create a new account
                at any time.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* What gets deleted */}
            <div className={styles.section}>
              <div className={styles.sectionNumber}>1</div>
              <h2 className={styles.sectionTitle}>What Gets Deleted</h2>
              <p>
                When you delete your account, the following data is
                <strong> permanently removed</strong> from our servers:
              </p>
              <ul>
                <li>Your profile information (name, email, avatar, username)</li>
                <li>All posts, comments, and reactions you&apos;ve created</li>
                <li>Your debate votes and poll responses</li>
                <li>Your predictions and mini-game scores</li>
                <li>Your favorite teams and players</li>
                <li>Your notification preferences and settings</li>
              </ul>
              <div className={styles.warning}>
                <AlertTriangle size={18} strokeWidth={2.5} />
                <p>
                  This action is <strong>irreversible</strong>. Once deleted,
                  your data cannot be recovered.
                </p>
              </div>
            </div>

            {/* How to delete */}
            <div className={styles.section}>
              <div className={styles.sectionNumber}>2</div>
              <h2 className={styles.sectionTitle}>How to Delete Your Account</h2>
              {step === "info" ? (
                <>
                  <p>
                    You must be logged in to delete your account. If you&apos;re
                    currently logged in, click the button below to proceed.
                  </p>
                  <p>
                    If you&apos;re unable to log in or need assistance with
                    account deletion, contact us at{" "}
                    <a href="mailto:privacy@curlysports.com">
                      privacy@curlysports.com
                    </a>{" "}
                    and we will process your request within 48 hours.
                  </p>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setStep("confirm")}
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                    I want to delete my account
                  </button>
                </>
              ) : (
                <>
                  <p>
                    To confirm, type <strong>DELETE</strong> in the box below
                    and click the delete button.
                  </p>
                  <input
                    type="text"
                    className={styles.confirmInput}
                    placeholder='Type "DELETE" to confirm'
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoFocus
                  />
                  {error && <p className={styles.error}>{error}</p>}
                  <div className={styles.btnRow}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => {
                        setStep("info");
                        setConfirmText("");
                        setError("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.confirmDeleteBtn}
                      disabled={confirmText !== "DELETE" || step === "deleting"}
                      onClick={handleDelete}
                    >
                      {step === "deleting" ? "Deleting..." : "Permanently Delete Account"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Alternative */}
            <div className={styles.section}>
              <div className={styles.sectionNumber}>3</div>
              <h2 className={styles.sectionTitle}>Contact Us</h2>
              <p>
                If you have concerns or would prefer to request account
                deletion via email, reach out to us:
              </p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:privacy@curlysports.com">
                    privacy@curlysports.com
                  </a>
                </li>
                <li>
                  General:{" "}
                  <a href="mailto:hello@curlysports.com">
                    hello@curlysports.com
                  </a>
                </li>
              </ul>
              <p>
                We will process all deletion requests within 48 hours of
                receiving your email.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} Curly Sports. All rights reserved.
          &nbsp;&middot;&nbsp;{" "}
          <Link href="/terms">Terms of Service</Link>
          &nbsp;&middot;&nbsp;{" "}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}
