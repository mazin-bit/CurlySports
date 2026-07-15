"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Gift,
  Zap,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import styles from "./invite.module.css";

/* ── Apple Icon (inline SVG) ─────────────────────────────────────── */

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/* ── Google Play Icon (inline SVG) ───────────────────────────────── */

function PlayStoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.04l2.651 1.535a1 1 0 010 1.732l-2.651 1.535-2.535-2.535 2.535-2.267zM5.864 3.455L16.8 9.788l-2.302 2.302L5.864 3.455z" />
    </svg>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function InvitePage() {
  const params = useParams();
  const code = params.code as string;

  return (
    <div className={styles.layout}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={styles.header}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandMark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curly-mark.png" alt="CurlySports" />
          </div>
          <span>
            curly<span className={styles.dot}>.</span>sports
          </span>
        </Link>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <h1 className={styles.heroHeading}>
          Your friend invited you to CurlySports!
        </h1>
        <p className={styles.heroSub}>
          CurlySports is the ultimate sports companion -- live scores, predictions,
          debates, and mystery prize challenges. Join for free and never miss a moment.
        </p>
        <Link
          href={`/login?ref=${encodeURIComponent(code)}`}
          className={styles.ctaBtn}
        >
          Create Free Account
          <ChevronRight size={20} />
        </Link>
      </div>

      {/* ── Benefits Grid ───────────────────────────────────── */}
      <div className={styles.benefitsGrid}>
        <div className={styles.benefitCard}>
          <div className={styles.benefitIcon}>
            <Zap size={20} />
          </div>
          <div>
            <div className={styles.benefitTitle}>Live Scores</div>
            <div className={styles.benefitDesc}>
              Real-time scores for football, basketball, cricket, F1, and more.
            </div>
          </div>
        </div>

        <div className={styles.benefitCard}>
          <div className={styles.benefitIcon}>
            <Trophy size={20} />
          </div>
          <div>
            <div className={styles.benefitTitle}>Predictions</div>
            <div className={styles.benefitDesc}>
              Predict match outcomes and compete on the leaderboard.
            </div>
          </div>
        </div>

        <div className={styles.benefitCard}>
          <div className={styles.benefitIcon}>
            <Gift size={20} />
          </div>
          <div>
            <div className={styles.benefitTitle}>Mystery Prizes</div>
            <div className={styles.benefitDesc}>
              Win mystery prizes by making correct predictions and inviting friends.
            </div>
          </div>
        </div>
      </div>

      {/* ── App Store Buttons ───────────────────────────────── */}
      <div className={styles.storeRow}>
        <a href="#" className={styles.storeBtn}>
          <AppleIcon />
          <div className={styles.storeBtnText}>
            <span className={styles.storeBtnSmall}>Download on the</span>
            <span className={styles.storeBtnName}>App Store</span>
          </div>
        </a>

        <a href="#" className={styles.storeBtn}>
          <PlayStoreIcon />
          <div className={styles.storeBtnText}>
            <span className={styles.storeBtnSmall}>Get it on</span>
            <span className={styles.storeBtnName}>Google Play</span>
          </div>
        </a>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className={styles.footer}>
        curlysports.com -- built for fans
      </div>
    </div>
  );
}
