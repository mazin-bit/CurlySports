"use client";

import { useState } from "react";
import Image from "next/image";
import AdSlot from "@/components/AdSlot";
import styles from "./news.module.css";
import { Trophy, CircleDot, ArrowRightLeft } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { useActiveSport } from "@/contexts/SportContext";
import type { NormalizedNews } from "@/lib/types";

const FILTERS = ["All News", "Transfers", "Match Reports", "Breaking"];

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

function tagForArticle(a: NormalizedNews): { label: string; color: string } {
  const title = a.title.toLowerCase();
  if (title.includes("transfer") || title.includes("sign") || title.includes("move"))
    return { label: "TRANSFER", color: "var(--orange)" };
  if (title.includes("breaking") || title.includes("confirmed") || title.includes("official"))
    return { label: "BREAKING", color: "var(--coral)" };
  if (title.includes("champion") || title.includes("ucl"))
    return { label: "UCL", color: "var(--purple)" };
  return { label: "NEWS", color: "var(--accent)" };
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function readTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function ArticleImg({ article, sizes, priority }: { article: NormalizedNews; sizes: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false);
  const { color } = tagForArticle(article);
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
  const [activeFilter, setActiveFilter] = useState("All News");
  const { articles, isLoading, isValidating } = useNews(50, activeSport);

  const filtered = articles.filter((a) => {
    if (activeFilter === "All News") return true;
    const tag = tagForArticle(a).label;
    if (activeFilter === "Transfers") return tag === "TRANSFER";
    if (activeFilter === "Breaking") return tag === "BREAKING";
    if (activeFilter === "Match Reports") {
      const t = a.title.toLowerCase();
      return t.includes("match") || t.includes("beat") || t.includes("win") || t.includes("draw") || t.includes("vs");
    }
    return true;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <div className={styles.filterRow}>
        {FILTERS.map((f) => (
          <button key={f} className={`chip${activeFilter === f ? " active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
        {isValidating && !isLoading && (
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontFamily: "var(--mono)", alignSelf: "center", marginLeft: 4 }}>● syncing</span>
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
                style={{ background: tagForArticle(featured).color, color: tagForArticle(featured).color === "var(--accent)" ? "#0a0e0d" : "#fff" }}
              >
                {activeSportConfig.icon} {tagForArticle(featured).label}
              </span>
            </div>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.excerpt}>{stripHtml(featured.excerpt ?? "")}</p>
            <div className={styles.featuredMeta}>
              <span>{featured.source}</span>
              <div className={styles.featuredMetaDot} />
              <span>{timeSince(featured.publishedAt)}</span>
              <div className={styles.featuredMetaDot} />
              <span>{readTime(featured.title + " " + (featured.excerpt ?? ""))}</span>
            </div>
          </div>
        </a>
      )}

      {!isLoading && rest.length > 0 && (
        <div>
          <div className="sec-head">
            <div className="title">{activeSportConfig.icon} Latest <span className="accent">Articles</span></div>
          </div>
          <div className={styles.newsGrid}>
            {rest.map((a, idx) => {
              const { label, color } = tagForArticle(a);
              const isAccent = color === "var(--accent)";
              const rt = readTime(a.title + " " + (a.excerpt ?? ""));
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
                        <span>{timeSince(a.publishedAt)}</span>
                        <div className={styles.newsMetaDot} />
                        <span className={styles.newsReadTime}>{rt}</span>
                      </div>
                    </div>
                  </a>
                  {idx === 1 && <AdSlot size="card" label="Sponsored" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: "var(--text-mute)", textAlign: "center", padding: "40px 0", fontFamily: "var(--mono)", fontSize: 13 }}>
          {activeSportConfig.icon} No {activeSportConfig.label} articles found.
        </p>
      )}
    </>
  );
}
