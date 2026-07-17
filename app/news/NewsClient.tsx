"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import AdSlot from "@/components/AdSlot";
import styles from "./news.module.css";
import { Trophy, CircleDot, ArrowRightLeft } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeDigits } from "@/lib/locale-utils";
import type { Locale } from "@/lib/i18n";
import type { NormalizedNews } from "@/lib/types";

const FILTERS = [
  { key: "news.allNews", id: "All News" },
  { key: "news.transfers", id: "Transfers" },
  { key: "news.matchReports", id: "Match Reports" },
  { key: "news.breaking", id: "Breaking" },
];

function stripHtml(str: string): string {
  return str
    .replace(/<\/(p|li|div|h[1-6]|br)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ArticleIcon({ article }: { article: NormalizedNews }) {
  const title = article.title.toLowerCase();
  if (title.includes("transfer") || title.includes("sign") || title.includes("move"))
    return <ArrowRightLeft size={22} strokeWidth={1.75} />;
  if (title.includes("champion") || title.includes("trophy") || title.includes("cup"))
    return <Trophy size={22} strokeWidth={1.75} />;
  return <CircleDot size={22} strokeWidth={1.75} />;
}

function tagIdForArticle(a: NormalizedNews): string {
  const title = a.title.toLowerCase();
  if (title.includes("transfer") || title.includes("sign") || title.includes("move"))
    return "TRANSFER";
  if (title.includes("breaking") || title.includes("confirmed") || title.includes("official"))
    return "BREAKING";
  if (title.includes("champion") || title.includes("ucl"))
    return "UCL";
  return "NEWS";
}

function tagForArticle(a: NormalizedNews, t: (key: string) => string): { label: string; color: string; id: string } {
  const id = tagIdForArticle(a);
  const labelMap: Record<string, string> = {
    TRANSFER: t("newsTag.transfer"),
    BREAKING: t("newsTag.breaking"),
    UCL: t("newsTag.ucl"),
    NEWS: t("newsTag.news"),
  };
  const colorMap: Record<string, string> = {
    TRANSFER: "var(--orange)",
    BREAKING: "var(--coral)",
    UCL: "var(--purple)",
    NEWS: "var(--accent)",
  };
  return { label: labelMap[id] ?? id, color: colorMap[id] ?? "var(--accent)", id };
}

function timeSince(iso: string, t: (key: string) => string, locale: Locale): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minsAgo").replace("{n}", localizeDigits(String(mins), locale));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hoursAgo").replace("{n}", localizeDigits(String(hrs), locale));
  return t("time.daysAgo").replace("{n}", localizeDigits(String(Math.floor(hrs / 24)), locale));
}

function readTime(text: string, t: (key: string) => string, locale: Locale): string {
  const words = text.trim().split(/\s+/).length;
  return `${localizeDigits(String(Math.max(1, Math.round(words / 200))), locale)} ${t("time.minRead")}`;
}

function ArticleImg({ article, sizes, priority }: { article: NormalizedNews; sizes: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false);
  const { t: tImg } = useLanguage();
  const { color } = tagForArticle(article, tImg);
  const cssColor = color === "var(--accent)" ? "#c8ff3d" : color === "var(--orange)" ? "#ff5b3d" : color === "var(--purple)" ? "#7c5cff" : "#ff4444";

  if (!article.imageUrl || errored) {
    return (
      <div className={styles.imgPlaceholder} style={{ background: `linear-gradient(135deg, ${cssColor}20 0%, var(--surface-2) 100%)` }}>
        <span style={{ color: cssColor, opacity: 0.7 }}><ArticleIcon article={article} /></span>
      </div>
    );
  }
  return (
    <Image
      src={article.imageUrl}
      alt={article.title}
      fill
      sizes={sizes}
      quality={90}
      priority={priority}
      style={{ objectFit: "cover" }}
      onError={() => setErrored(true)}
    />
  );
}

export default function NewsClient() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const { t, locale } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("All News");
  const { articles, isLoading, isValidating } = useNews(30, activeSport);

  const filtered = useMemo(() => articles.filter((a) => {
    if (activeFilter === "All News") return true;
    const tag = tagIdForArticle(a);
    if (activeFilter === "Transfers") return tag === "TRANSFER";
    if (activeFilter === "Breaking") return tag === "BREAKING";
    if (activeFilter === "Match Reports") {
      const titleLc = a.title.toLowerCase();
      return titleLc.includes("match") || titleLc.includes("beat") || titleLc.includes("win") || titleLc.includes("draw") || titleLc.includes("vs");
    }
    return true;
  }), [articles, activeFilter]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <div className={styles.filterRow}>
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip${activeFilter === f.id ? " active" : ""}`} onClick={() => setActiveFilter(f.id)}>{t(f.key)}</button>
        ))}
        {isValidating && !isLoading && (
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontFamily: "var(--mono)", alignSelf: "center", marginInlineStart: 4 }}>{t("news.syncing")}</span>
        )}
      </div>

      {isLoading && (
        <>
          <div className="skeleton-row" style={{ height: 340, borderRadius: 16, marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-row" style={{ height: 280, borderRadius: 12 }} />
            ))}
          </div>
        </>
      )}

      {/* Magazine-style featured hero — text overlaid on image */}
      {!isLoading && featured && (
        <a href={featured.url ?? "#"} target="_blank" rel="noopener noreferrer" className={styles.featured}>
          <div className={styles.featuredImage}>
            <ArticleImg article={featured} sizes="(max-width: 700px) 100vw, 90vw" priority />
          </div>
          <div className={styles.featuredContent}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className={styles.tag}
                style={{ background: tagForArticle(featured, t).color, color: tagForArticle(featured, t).color === "var(--accent)" ? "#0a0e0d" : "#fff" }}
              >
                {activeSportConfig.icon} {tagForArticle(featured, t).label}
              </span>
            </div>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.excerpt}>{stripHtml(featured.excerpt ?? "")}</p>
            <div className={styles.featuredMeta}>
              <span>{featured.source}</span>
              <div className={styles.featuredMetaDot} />
              <span>{timeSince(featured.publishedAt, t, locale)}</span>
              <div className={styles.featuredMetaDot} />
              <span>{readTime(featured.title + " " + (featured.excerpt ?? ""), t, locale)}</span>
            </div>
          </div>
        </a>
      )}

      {!isLoading && rest.length > 0 && (
        <div>
          <div className="sec-head">
            <div className="title">{activeSportConfig.icon} {t("news.latestArticles")} <span className="accent">{t("news.articlesAccent")}</span></div>
          </div>
          <div className={styles.newsGrid}>
            {rest.map((a, idx) => {
              const { label, color } = tagForArticle(a, t);
              const isAccent = color === "var(--accent)";
              const rt = readTime(a.title + " " + (a.excerpt ?? ""), t, locale);
              return (
                <div key={`${a.id}-${idx}`}>
                  <a href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" className={styles.newsCard}>
                    <div className={styles.newsImg}>
                      <ArticleImg article={a} sizes="(max-width: 700px) 100vw, (max-width: 1400px) 50vw, 420px" />
                    </div>
                    <div className={styles.newsBody}>
                      <span className={styles.tag} style={{ background: color, color: isAccent ? "#0a0e0d" : "#fff" }}>{label}</span>
                      <h3 className={styles.newsTitle}>{a.title}</h3>
                      <p className={styles.newsExcerpt}>{stripHtml(a.excerpt ?? "")}</p>
                      <div className={styles.newsMeta}>
                        <span>{a.source}</span>
                        <div className={styles.newsMetaDot} />
                        <span>{timeSince(a.publishedAt, t, locale)}</span>
                        <div className={styles.newsMetaDot} />
                        <span className={styles.newsReadTime}>{rt}</span>
                      </div>
                    </div>
                  </a>
                  {idx === 1 && <AdSlot size="card" label={t("common.sponsored")} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: "var(--text-mute)", textAlign: "center", padding: "40px 0", fontFamily: "var(--mono)", fontSize: 13 }}>
          {activeSportConfig.icon} {t("news.noArticlesFound").replace("{sport}", activeSportConfig.label)}
        </p>
      )}
    </>
  );
}
