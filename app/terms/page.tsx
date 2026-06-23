import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./terms.module.css";

export const metadata: Metadata = {
  title: "Terms of Service | Curly Sports",
  description:
    "Terms and conditions for using the Curly Sports platform.",
};

export default function TermsPage() {
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
        <div className={styles.heroTag}>the fine print</div>
        <h1 className={styles.heroTitle}>
          Terms of<br />
          <em>Service.</em>
        </h1>
        <p className={styles.heroSub}>
          The rules of the game. By using Curly Sports, you agree to these
          terms. We&apos;ve kept them as human-readable as possible.
        </p>
        <span className={styles.updated}>Last updated: June 23, 2026</span>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {/* 1 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>1</div>
          <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
          <p>
            By accessing or using Curly Sports (&quot;the Platform&quot;), you
            agree to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use the Platform.
          </p>
          <p>
            We may update these terms from time to time. Continued use of the
            Platform after changes constitutes acceptance of the updated terms.
          </p>
        </div>

        {/* 2 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>2</div>
          <h2 className={styles.sectionTitle}>Eligibility</h2>
          <p>
            You must be at least <strong>13 years old</strong> to create an
            account and use Curly Sports. If you are under 18, you confirm that
            you have your parent or guardian&apos;s permission to use the
            Platform.
          </p>
          <p>
            By creating an account, you represent that the information you
            provide is accurate and that you will keep it up to date.
          </p>
        </div>

        {/* 3 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>3</div>
          <h2 className={styles.sectionTitle}>Your Account</h2>
          <ul>
            <li>You are responsible for maintaining the security of your account and password</li>
            <li>You must not share your account credentials with others</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>You must notify us immediately if you suspect unauthorized access</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </p>
        </div>

        {/* 4 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>4</div>
          <h2 className={styles.sectionTitle}>Acceptable Use</h2>
          <p>When using Curly Sports, you agree <strong>not</strong> to:</p>
          <ul>
            <li>Post offensive, hateful, abusive, or harassing content</li>
            <li>Spam, flood, or disrupt debates and community features</li>
            <li>Impersonate other users or public figures</li>
            <li>Share misleading or intentionally false sports information</li>
            <li>Attempt to exploit, hack, or reverse-engineer the Platform</li>
            <li>Use bots or automated tools to interact with the Platform without permission</li>
            <li>Scrape, copy, or redistribute our content without authorization</li>
          </ul>
          <div className={styles.warning}>
            <p>
              Violations may result in content removal, temporary suspension, or
              permanent ban at our discretion.
            </p>
          </div>
        </div>

        {/* 5 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>5</div>
          <h2 className={styles.sectionTitle}>User Content</h2>
          <p>
            &quot;User Content&quot; includes posts, debate responses, poll
            votes, comments, predictions, and any other content you create on
            the Platform.
          </p>
          <ul>
            <li>You retain ownership of the content you create</li>
            <li>By posting, you grant Curly Sports a non-exclusive, royalty-free license to display, distribute, and promote your content on the Platform</li>
            <li>You can delete your own content at any time</li>
            <li>We may remove content that violates these terms or applicable law</li>
          </ul>
        </div>

        {/* 6 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>6</div>
          <h2 className={styles.sectionTitle}>Sports Data &amp; Scores</h2>
          <p>
            Curly Sports provides live scores, statistics, and sports data
            sourced from third-party providers (ESPN, OpenF1, NBA, and others).
          </p>
          <ul>
            <li>We strive for accuracy but do not guarantee that all data is complete, current, or error-free</li>
            <li>Scores and statistics are provided for informational and entertainment purposes only</li>
            <li>Do not rely on our data for gambling, financial decisions, or any purpose where accuracy is critical</li>
          </ul>
        </div>

        {/* 7 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>7</div>
          <h2 className={styles.sectionTitle}>Intellectual Property</h2>
          <p>
            The Curly Sports name, logo, mascot (&quot;Curly&quot;), design,
            and original content are owned by Curly Sports. You may not use our
            branding without written permission.
          </p>
          <p>
            Third-party trademarks (team logos, league names, etc.) belong to
            their respective owners and are used on the Platform for
            informational purposes under fair use.
          </p>
        </div>

        {/* 8 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>8</div>
          <h2 className={styles.sectionTitle}>Availability &amp; Changes</h2>
          <p>
            We aim to keep Curly Sports available 24/7, but we do not guarantee
            uninterrupted access. The Platform may be temporarily unavailable
            for maintenance, updates, or due to circumstances beyond our
            control.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature
            of the Platform at any time without prior notice.
          </p>
        </div>

        {/* 9 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>9</div>
          <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
          <p>
            Curly Sports is provided &quot;as is&quot; without warranties of any
            kind, express or implied. To the fullest extent permitted by law:
          </p>
          <ul>
            <li>We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform</li>
            <li>We are not responsible for actions taken based on sports data displayed on the Platform</li>
            <li>Our total liability to you shall not exceed the amount you have paid us (which is zero &mdash; the Platform is free)</li>
          </ul>
        </div>

        {/* 10 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>10</div>
          <h2 className={styles.sectionTitle}>Privacy</h2>
          <p>
            Your privacy matters to us. Our{" "}
            <Link href="/privacy">Privacy Policy</Link> explains what data we
            collect and how we use it. By using the Platform, you also agree to
            our Privacy Policy.
          </p>
          <div className={styles.highlight}>
            <p>
              TL;DR: We never sell your data. We only collect what&apos;s
              needed to make the Platform work for you.
            </p>
          </div>
        </div>

        {/* 11 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>11</div>
          <h2 className={styles.sectionTitle}>Termination</h2>
          <p>
            You can delete your account at any time. Upon deletion, your
            personal data will be removed in accordance with our Privacy Policy.
          </p>
          <p>
            We may terminate or suspend your access to the Platform
            immediately, without prior notice, if you breach these Terms of
            Service.
          </p>
        </div>

        {/* 12 */}
        <div className={styles.section}>
          <div className={styles.sectionNumber}>12</div>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p>
            Questions about these terms? Reach out to us.
          </p>
          <ul>
            <li>
              Email: <a href="mailto:legal@curlysports.com">legal@curlysports.com</a>
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
