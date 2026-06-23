import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Curly Sports",
  description:
    "How Curly Sports collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
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
        <div className={styles.heroTag}>legal stuff</div>
        <h1 className={styles.heroTitle}>
          Privacy<br />
          <em>Policy.</em>
        </h1>
        <p className={styles.heroSub}>
          We keep things simple. Here&apos;s exactly what data we collect, why
          we collect it, and what we do (and don&apos;t do) with it.
        </p>
        <span className={styles.updated}>Last updated: June 23, 2026</span>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {/* 1 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>1</div>
          <h2 className={styles.sectionTitle}>Who We Are</h2>
          <p>
            Curly Sports is a sports analytics and entertainment platform that
            provides live scores, news, debates, and mini-games. We are
            committed to protecting your privacy and being transparent about our
            data practices.
          </p>
        </div>

        {/* 2 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>2</div>
          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          <p>
            <strong>Account Information:</strong> When you sign up, we collect
            your email address, username, and password (securely hashed). If you
            use Google Sign-In, we receive your name, email, and profile photo
            from Google.
          </p>
          <p>
            <strong>Profile Data:</strong> Your favorite teams, notification
            preferences, and avatar image if you upload one.
          </p>
          <p>
            <strong>User Content:</strong> Posts, debate votes, poll responses,
            comments, and predictions you create on the platform.
          </p>
          <p>
            <strong>Usage Data:</strong> Pages visited, features used, and
            general interaction patterns to help us improve the product. We do
            not track you across other websites.
          </p>
          <p>
            <strong>Device Information:</strong> Browser type, operating system,
            and device type for compatibility and performance optimization.
          </p>
        </div>

        {/* 3 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>3</div>
          <h2 className={styles.sectionTitle}>How We Use Your Data</h2>
          <ul>
            <li>Providing and personalizing your sports experience</li>
            <li>Displaying live scores, news, and standings relevant to your interests</li>
            <li>Enabling debates, polls, and community features</li>
            <li>Sending push notifications you&apos;ve opted into (match alerts, etc.)</li>
            <li>Improving platform performance and fixing bugs</li>
            <li>Preventing spam, abuse, and unauthorized access</li>
          </ul>
        </div>

        {/* 4 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>4</div>
          <h2 className={styles.sectionTitle}>Data We Never Sell</h2>
          <div className={styles.highlight}>
            <p>
              Curly Sports does not sell, rent, or trade your personal data to
              third parties. Period. We never have and we never will.
            </p>
          </div>
          <p>
            We do not serve behavioral ads or share your data with advertising
            networks.
          </p>
        </div>

        {/* 5 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>5</div>
          <h2 className={styles.sectionTitle}>Third-Party Services</h2>
          <p>We use the following services to operate the platform:</p>
          <ul>
            <li>
              <strong>Supabase</strong> &mdash; Authentication and database
              hosting (your data is stored securely in their infrastructure)
            </li>
            <li>
              <strong>Vercel</strong> &mdash; Web hosting and serverless
              functions
            </li>
            <li>
              <strong>Upstash Redis</strong> &mdash; Caching layer for faster
              score delivery (no personal data stored)
            </li>
            <li>
              <strong>ESPN, OpenF1, NBA</strong> &mdash; Sports data APIs (we
              fetch data from them; they do not receive your personal information)
            </li>
          </ul>
          <p>
            Each service has its own privacy policy. We only share the minimum
            data required for them to function.
          </p>
        </div>

        {/* 6 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>6</div>
          <h2 className={styles.sectionTitle}>Cookies &amp; Local Storage</h2>
          <p>
            We use <strong>essential cookies</strong> for authentication (keeping
            you logged in) and session management. We do not use tracking
            cookies or third-party analytics cookies.
          </p>
          <p>
            On our mobile app, we use <strong>secure device storage</strong> to
            store your authentication token locally on your device.
          </p>
        </div>

        {/* 7 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>7</div>
          <h2 className={styles.sectionTitle}>Data Security</h2>
          <p>
            All data is transmitted over HTTPS. Passwords are hashed using
            industry-standard algorithms. We use row-level security policies on
            our database to ensure users can only access their own data.
          </p>
          <p>
            While no system is 100% secure, we follow best practices and
            regularly review our security measures.
          </p>
        </div>

        {/* 8 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>8</div>
          <h2 className={styles.sectionTitle}>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate information in your profile</li>
            <li>Delete your account and all associated data</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of non-essential notifications at any time</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@curlysports.com">privacy@curlysports.com</a>.
          </p>
        </div>

        {/* 9 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>9</div>
          <h2 className={styles.sectionTitle}>Children&apos;s Privacy</h2>
          <p>
            Curly Sports is not directed at children under 13. We do not
            knowingly collect personal information from children. If you believe
            a child has provided us with personal data, please contact us and we
            will promptly delete it.
          </p>
        </div>

        {/* 10 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>10</div>
          <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. When we do, we&apos;ll
            update the &quot;Last updated&quot; date at the top and, if the
            changes are significant, notify you via email or an in-app notice.
          </p>
        </div>

        {/* 11 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>11</div>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p>
            Got questions about your privacy? We&apos;re happy to help.
          </p>
          <ul>
            <li>
              Email: <a href="mailto:privacy@curlysports.com">privacy@curlysports.com</a>
            </li>
            <li>
              General: <a href="mailto:hello@curlysports.com">hello@curlysports.com</a>
            </li>
          </ul>
        </div>
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
