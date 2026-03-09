// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/public/PublicHeader';

const SPORTS_API_SITE_ROOT = 'https://site.api.espn.com/apis/site/v2/sports';
const FALLBACK_NEWS_IMAGE = 'https://via.placeholder.com/400x200?text=News';

const SPORTS_CONFIG = {
  soccer: { label: 'Soccer' },
  basketball: { label: 'Basketball' },
  football: { label: 'American Football' },
  baseball: { label: 'Baseball' },
  hockey: { label: 'Hockey' },
  cricket: { label: 'Cricket' },
  f1: { label: 'Formula 1' },
};

const HOME_AVATARS = {
  soccer: `/avatars/soccer.png`,
  cricket: `/avatars/cricket.png`,
  f1: `/avatars/f1.png`,
  'american-football': `/avatars/american-football.png`,
  tennis: `/avatars/tennis.png`,
  baseball: `/avatars/baseball.png`,
  rugby: `/avatars/rugby.png`,
  cycling: `/avatars/cycling.png`,
  golf: `/avatars/golf.png`,
  boxing: `/avatars/boxing.png`,
  mma: `/avatars/mma.png`,
  volleyball: `/avatars/volleyball.png`,
  basketball: `/avatars/basketball.png`,
  swimming: `/avatars/swimming.png`,
  badminton: `/avatars/badminton.png`,
};

/** Fix mojibake when API returns UTF-8 (e.g. Hindi/Urdu) interpreted as Latin-1 */
function fixTextEncoding(str) {
  if (str == null || typeof str !== 'string') return str;
  if (!str) return str;
  const likelyMojibake = /à¤|à¥|à¤®|à¤¬|à¤²|à¤à¥|à¤°|à¤¸|à¤®à¥|à¤«|à¤¨à¤²|à¤¦à¥|à¤¡|ἀ|ά|κ|για/i.test(str);
  if (!likelyMojibake) return str;
  try {
    const bytes = new Uint8Array([...str].map(c => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch (_) {
    return str;
  }
}

const HomePage = ({ isAuthenticated = false, homeTheme = 'light', setHomeTheme }) => {
  const sportKeys = ['soccer', 'cricket', 'f1', 'basketball', 'tennis', 'american-football', 'baseball', 'rugby', 'volleyball', 'badminton', 'mma', 'boxing', 'golf', 'swimming', 'cycling'];
  const homeSportLabels = {
    soccer: 'Football',
    cricket: 'Cricket',
    f1: 'F1 Racing',
    'american-football': 'American Football',
    tennis: 'Tennis',
    baseball: 'Baseball',
    rugby: 'Rugby',
    cycling: 'Cycling',
    golf: 'Golf',
    boxing: 'Boxing',
    mma: 'MMA',
    volleyball: 'Volleyball',
    basketball: 'Basketball',
    swimming: 'Swimming',
    badminton: 'Badminton',
  };
  const sportDescriptions = {
    f1: 'Track races, standings & driver stats. Follow the season with live timing and results.',
    soccer: 'Scores, tables & fixtures for top leagues. Your hub for football stats and news.',
    cricket: 'Scores, rankings & series. Tests, ODIs, T20s and IPL at a glance.',
    'american-football': 'NFL scores, standings & stats. Follow your team through the season.',
    tennis: 'Tournaments, rankings & live scores. Grand Slams and ATP/WTA at a glance.',
    baseball: 'Scores, standings & stats. MLB and leagues at a glance.',
    rugby: 'Fixtures, standings & results. Union and league coverage in one place.',
    cycling: 'Races, classifications & rider stats. Grand Tours and classics coverage.',
    golf: 'Leaderboards, tournaments & player stats. Majors and PGA Tour updates.',
    boxing: 'Fight schedules, rankings & results. Follow the biggest bouts.',
    mma: 'Fight cards, rankings & results. UFC and major promotions coverage.',
    volleyball: 'Scores, standings & tournaments. Indoor and beach coverage.',
    basketball: 'NBA & leagues: scores, standings & stats. Follow the game.',
    swimming: 'Events, times & rankings. Pools and open water at a glance.',
    badminton: 'Rankings, tournaments & results. BWF and major events coverage.',
  };
  const comingSoonKeys = new Set(['tennis', 'american-football', 'baseball', 'rugby', 'volleyball', 'badminton', 'mma', 'boxing', 'golf', 'swimming', 'cycling']);
  const sportsForCards = sportKeys.map((key) => ({
    key,
    label: homeSportLabels[key] || SPORTS_CONFIG[key]?.label || key,
    description: sportDescriptions[key] || '',
    avatar: HOME_AVATARS[key] || null,
    gradient: key,
    comingSoon: comingSoonKeys.has(key),
  }));

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);
  const cardsGridRef = useRef(null);
  const cardsSectionRef = useRef(null);
  const [scrollDirection, setScrollDirection] = useState(null); // 'left' | 'right' | null
  const cardsHoveredRef = useRef(false);

  /* Infinite slow auto-scroll to the right; pause when mouse is over the cards section */
  useEffect(() => {
    const el = cardsGridRef.current;
    if (!el) return;
    const speed = 1;
    let rafId = null;
    const tick = () => {
      if (cardsHoveredRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      let next = el.scrollLeft + speed;
      /* Seamless loop: content is duplicated, so when we pass the first half reset to 0 */
      if (next >= el.scrollWidth / 2) next = 0;
      el.scrollLeft = next;
      rafId = requestAnimationFrame(tick);
    };
    /* Start after layout so scrollWidth/clientWidth are correct */
    const start = () => {
      rafId = requestAnimationFrame(tick);
    };
    const t = setTimeout(start, 300);
    return () => {
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const sources = [
      { path: 'soccer', code: 'eng.1', label: 'Football', count: 2 },
      { path: 'cricket', code: '8048', label: 'Cricket', count: 2 },
      { path: 'racing', code: 'f1', label: 'F1', count: 2 },
    ];
    let cancelled = false;
    Promise.allSettled(
      sources.map(({ path, code, label, count }) =>
        fetch(`${SPORTS_API_SITE_ROOT}/${path}/${code}/news?limit=${count}`)
          .then((r) => r.json())
          .then((data) => ({ articles: (data.articles || []).slice(0, count), label }))
      )
    ).then((results) => {
      if (cancelled) return;
      const combined = [];
      results.forEach((outcome) => {
        if (outcome.status !== 'fulfilled' || !outcome.value) return;
        const { articles, label } = outcome.value;
        (articles || []).forEach((a) => {
          combined.push({
            tag: fixTextEncoding(a.categories?.[0]?.description) || label,
            title: fixTextEncoding(a.headline) || '',
            excerpt: fixTextEncoding(a.description) || '',
            image: a.images?.[0]?.url || FALLBACK_NEWS_IMAGE,
            link: a.links?.web?.href,
            source: label,
          });
        });
      });
      const seen = new Set();
      const deduped = combined.filter((a) => {
        const id = (a.link || a.title || '').trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setHomeNews(deduped.slice(0, 6));
      setHomeNewsLoading(false);
    }).catch(() => {
      if (!cancelled) setHomeNewsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!scrollDirection || !cardsGridRef.current) return;
    const el = cardsGridRef.current;
    const firstCard = el.querySelector('.home-scard');
    const computed = el && window.getComputedStyle(el);
    const gap = computed ? parseInt(computed.gap || '20', 10) : 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 300;
    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (scrollDirection === 'right') {
        const next = Math.min(el.scrollLeft + step, maxScroll);
        el.scrollTo({ left: next, behavior: 'smooth' });
        if (next >= maxScroll) setScrollDirection(null);
      } else {
        const next = Math.max(el.scrollLeft - step, 0);
        el.scrollTo({ left: next, behavior: 'smooth' });
        if (next <= 0) setScrollDirection(null);
      }
    }, 550);
    return () => clearInterval(interval);
  }, [scrollDirection]);

  const scrollRightActive = scrollDirection === 'right';
  const scrollLeftActive = scrollDirection === 'left';

  return (
    <div className={`public-home public-home--curly ${homeTheme === 'dark' ? 'public-home--dark' : ''}`}>
      {/* Background waves -- single continuous SVG, no tile seam */}
      <div className="home-waves-bg" aria-hidden="true">
        <div className="home-waves-bg-track">
          <svg className="home-waves-bg-svg" viewBox="0 0 2400 800" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="home-wave-deep" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="home-wave-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="home-wave-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="home-wave-foam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Two full periods so 0-1200 and 1200-2400 match; no visible cut */}
            <path fill="url(#home-wave-deep)" className="home-wave-layer home-wave-layer--1" d="M0,400 Q300,350 600,400 T1200,400 T1800,400 T2400,400 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-deep)" className="home-wave-layer home-wave-layer--1b" d="M0,450 Q300,500 600,450 T1200,450 T1800,450 T2400,450 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-mid)" className="home-wave-layer home-wave-layer--2" d="M0,500 Q200,440 400,500 T800,500 T1200,500 T1600,500 T2000,500 T2400,500 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-mid)" className="home-wave-layer home-wave-layer--2b" d="M0,550 Q200,610 400,550 T800,550 T1200,550 T1600,550 T2000,550 T2400,550 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-light)" className="home-wave-layer home-wave-layer--3" d="M0,600 Q150,550 300,600 T600,600 T900,600 T1200,600 T1500,600 T1800,600 T2100,600 T2400,600 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-light)" className="home-wave-layer home-wave-layer--3b" d="M0,650 Q150,700 300,650 T600,650 T900,650 T1200,650 T1500,650 T1800,650 T2100,650 T2400,650 L2400,800 L0,800 Z" />
            <path fill="url(#home-wave-foam)" className="home-wave-layer home-wave-layer--4" d="M0,350 Q400,280 800,350 T1200,350 T2000,350 T2400,350 L2400,800 L0,800 Z" />
          </svg>
        </div>
      </div>

      <PublicHeader isAuthenticated={isAuthenticated} homeTheme={homeTheme} setHomeTheme={setHomeTheme} />
      <main>
        {/* Hero */}
        <section className="home-hero home-hero--curly">
          <div className="home-hero-content">
            <h1 className="home-hero-title--split">
              <span className="home-hero-title-curly">Curly</span>
              <span className="home-hero-title-sports">Sports</span>
            </h1>
            <p className="home-hero-tagline">real-time analytics tailored just for you.</p>
          </div>
        </section>

        {/* Sport cards -- flip on hover */}
        <section
          className="home-sports-section"
          ref={cardsSectionRef}
          onMouseEnter={() => { cardsHoveredRef.current = true; }}
          onMouseLeave={() => { cardsHoveredRef.current = false; }}
        >
          <div className="home-sports-grid-wrap">
            {scrollRightActive && (
              <div className="home-sports-scroll-zone-hint home-sports-scroll-zone-hint--right" aria-hidden="true">
                <span className="home-sports-scroll-zone-arrow">→</span>
              </div>
            )}
            {scrollLeftActive && (
              <div className="home-sports-scroll-zone-hint home-sports-scroll-zone-hint--left" aria-hidden="true">
                <span className="home-sports-scroll-zone-arrow">←</span>
              </div>
            )}
            <div className="home-sports-grid--ref" ref={cardsGridRef}>
            {[...sportsForCards, ...sportsForCards].map((sport, i) => (
              <Link to="/signup" key={`${sport.key}-${i}`} className={`home-scard home-scard--ref home-scard--${sport.gradient}${sport.comingSoon ? ' home-scard--coming-soon' : ''}`}>
                <div className="home-scard-flip">
                  <div className="home-scard-face home-scard-front">
                    {sport.avatar && (
                      <div className="home-scard-figure-wrap">
                        <img src={sport.avatar} alt="" className="home-scard-figure" loading="lazy" />
                      </div>
                    )}
                    <span className="home-scard-label home-scard-label--pill">{sport.label}</span>
                    {sport.comingSoon && <span className="home-scard-coming-soon">Coming soon</span>}
                  </div>
                  <div className="home-scard-face home-scard-back">
                    <div className="home-scard-back-bg" aria-hidden="true" />
                    <p className="home-scard-back-desc">{sport.description}</p>
                    {sport.comingSoon ? (
                      <span className="home-scard-label home-scard-label--pill home-scard-coming-soon-pill">Coming soon</span>
                    ) : (
                      <span className="home-scard-label home-scard-label--pill">Learn more</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            </div>
          </div>
        </section>

        <section className="home-section home-section--features" id="features">
          <h2>Platform Features</h2>
          <div className="home-feature-grid home-feature-grid--curly">
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">dashboard</span>
              <h3>Personalized Sports Dashboard</h3>
              <p>Configure your feed around your sports, teams, and players with adaptive insights.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">analytics</span>
              <h3>Real-Time Match Analytics</h3>
              <p>Track live matches, momentum shifts, and key moments as they happen.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">bar_chart</span>
              <h3>Player Performance Insights</h3>
              <p>Compare player metrics, form trends, and role impact across competitions.</p>
            </article>
            <article className="home-card">
              <span className="home-card-icon material-icons-round" aria-hidden="true">new_releases</span>
              <h3>Transfer & News Intelligence</h3>
              <p>Get curated transfer updates, reports, and context in one unified stream.</p>
            </article>
          </div>
        </section>

        <section className="home-section home-founder">
          <h2>Meet the Founder</h2>
          <div className="home-founder-wrap">
            <div>
              <p>
                Mazin, Founder of Curly Sports, is a competitive football captain and tournament MVP, recognized with a Golden Boot.
                As a team leader, he understands the value of data and performance analytics. Curly Sports was built from firsthand
                experience - combining football passion with modern sports intelligence.
              </p>
              <div className="home-founder-tags">
                <span>Football captain</span><span>Golden Boot</span><span>Tournament MVP</span><span>Analytics passion</span><span>Founder-led vision</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-section--compare">
          <h2>Why Curly Sports</h2>
          <div className="home-table-wrap">
            <table className="home-compare-table">
              <thead><tr><th>Category</th><th>Other Apps</th><th>Curly Sports</th></tr></thead>
              <tbody>
                <tr><td>Personalization</td><td>Generic feeds</td><td>Survey-driven and role-based</td></tr>
                <tr><td>Analytics depth</td><td>Basic stats only</td><td>Performance, context, and trends</td></tr>
                <tr><td>Coverage</td><td>Single-purpose experience</td><td>Dashboard, analytics, news, and insights</td></tr>
                <tr><td>Product direction</td><td>Slow roadmap cycles</td><td>Founder-led and athlete-focused iteration</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="home-section home-section--preview">
          <h2>Platform Preview</h2>
          <div className="home-preview-grid">
            <div className="home-preview-placeholder">Dashboard & personalization</div>
            <div className="home-preview-placeholder">Live scores & analytics</div>
          </div>
        </section>

        <section className="home-section home-proof">
          <h2>Built with Authority</h2>
          <div className="home-proof-grid">
            <p>Built for competitive athletes</p>
            <p>Founder-led innovation</p>
            <p>Designed for performance decisions</p>
          </div>
        </section>

        <section className="home-section home-news-section" id="sports-news">
          <h2>Sports News</h2>
          <p className="home-news-intro">Two football, two cricket and two F1 headlines — powered by ESPN.</p>
          {homeNewsLoading ? (
            <div className="home-news-loading">
              <div className="loader" aria-hidden="true" />
              <span>Loading headlines…</span>
            </div>
          ) : homeNews.length > 0 ? (
            <div className="home-news-grid">
              {homeNews.map((article, idx) => (
                <a
                  key={idx}
                  className="home-news-card"
                  href={article.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="home-news-card-image-wrap">
                    <img src={article.image} alt="" className="home-news-card-image" loading="lazy" />
                    <span className="home-news-card-tag">{article.tag}</span>
                  </div>
                  <div className="home-news-card-body">
                    <h3 className="home-news-card-title">{article.title}</h3>
                    {article.excerpt && <p className="home-news-card-excerpt">{article.excerpt.slice(0, 120)}{article.excerpt.length > 120 ? '...' : ''}</p>}
                    <span className="home-news-card-source">{article.source}</span>
                    <span className="home-news-card-link">Read more →</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="home-news-empty">No headlines available right now. Check back soon.</p>
          )}
        </section>

        <section className="home-section home-final-cta">
          <h2>Join the Next Generation of Sports Intelligence</h2>
          <Link to="/signup" className="public-btn-primary">Create Your Account</Link>
        </section>
      </main>
      <footer className="public-footer public-footer--curly">
        <div className="public-footer-tagline">Real-time analytics tailored just for you.</div>
        <div className="public-footer-links">
          <a href="#features">About</a><a href="mailto:hello@curlysports.com">Contact</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a>
        </div>
        <div className="public-footer-socials">
          <a href="https://instagram.com/CurlySportsOfficial" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://x.com/CurlySportsOfficial" target="_blank" rel="noreferrer">X</a>
          <a href="https://youtube.com/@CurlySportsOfficial" target="_blank" rel="noreferrer">YouTube</a>
          <a href="https://linkedin.com/company/curlysports" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <p>Copyright © Curly Sports.</p>
      </footer>
    </div>
  );
};

export { HomePage };
export default HomePage;
