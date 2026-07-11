"use client";
import Image from "next/image";
import { ArrowLeft, Zap, Shield, Globe, Trophy, ChevronRight } from "lucide-react";
import styles from "./download.module.css";

export default function DownloadPage() {
  return (
    <div className={styles.root}>
      {/* Nav */}
      <nav className={styles.nav}>
        <a href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back
        </a>
        <div className={styles.navCenter}>
          <a href="/" className={styles.logo}>
            <div className={styles.logoMark}>
              <Image src="/curly-guy.png" alt="Curly" width={32} height={32} quality={100} />
            </div>
            <span>curly<em>.</em>sports</span>
          </a>
        </div>
        <div />
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        {/* Announcement badge */}
        <div className={styles.announceBadge}>
          <span className={styles.badgeTag}>NEW</span>
          <span>Mini Games & Predictions are here</span>
          <ChevronRight size={14} />
        </div>

        <h1 className={styles.heroTitle}>
          Your sports companion,
          <br />
          <span className={styles.heroFaded}>always in your pocket.</span>
        </h1>

        <p className={styles.heroSub}>
          Live scores, deep stats, 150+ leagues, and hot debates —
          <br className={styles.brDesktop} />
          all in one beautifully crafted app you&#39;ll love.
        </p>

        {/* Action buttons */}
        <div className={styles.actions}>
          <a
            href="https://apps.apple.com/ae/app/curlysports/id6782400396"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download for iOS
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.curlysports.mobile&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-3.492zM5.864 2.658L16.8 9.99l-2.302 2.302L5.864 2.658z" />
            </svg>
            Download for Android
          </a>
        </div>

      </section>

      {/* App preview */}
      <section className={styles.preview}>
        <div className={styles.previewWindow}>
          <div className={styles.windowBar}>
            <div className={styles.windowDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <div className={styles.windowTabs}>
              <span className={styles.tabActive}>Dashboard</span>
              <span className={styles.tab}>Live Scores</span>
              <span className={styles.tab}>Leagues</span>
            </div>
          </div>
          <div className={styles.previewImage}>
            <Image
              src="/dashboard-v2.png"
              alt="Curly Sports Dashboard"
              width={1200}
              height={700}
              quality={90}
              className={styles.previewImg}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need, nothing you don&#39;t</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Zap size={20} /></div>
            <div>
              <h3>Instant Notifications</h3>
              <p>Goals, wickets, and buzzer-beaters the second they happen.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Shield size={20} /></div>
            <div>
              <h3>Ad-Free Experience</h3>
              <p>Clean, fast interface with zero distracting ads.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Globe size={20} /></div>
            <div>
              <h3>150+ Leagues</h3>
              <p>Football, cricket, NBA, F1, NFL, tennis, baseball — all in one place.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Trophy size={20} /></div>
            <div>
              <h3>Mini Games</h3>
              <p>Predictions, trivia, and debates to compete with friends.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2026 Curly Sports. All rights reserved.</p>
      </footer>
    </div>
  );
}
