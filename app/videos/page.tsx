"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import styles from "./videos.module.css";
import { Play, ExternalLink, RefreshCw, Tv2, PlayCircle } from "lucide-react";
import { useVideos } from "@/hooks/useVideos";
import { useActiveSport } from "@/contexts/SportContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VideoHighlight } from "@/app/api/espn/videos/route";

function FeaturedPlayer({
  video,
  onBlocked,
}: {
  video: VideoHighlight;
  onBlocked: () => void;
}) {
  const { t } = useLanguage();
  // Listen for YouTube postMessage errors (101/150 = embedding blocked, 100 = not found)
  // onBlocked is stable (empty useCallback deps), so this effect won't retrigger on re-renders
  useEffect(() => {
    if (!video.ytVideoId) return;
    const handler = (e: MessageEvent) => {
      if (!e.origin.includes("youtube.com")) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onError" && (data?.info === 150 || data?.info === 101 || data?.info === 100)) {
          onBlocked();
        }
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [video.ytVideoId, onBlocked]);

  if (video.ytVideoId) {
    return (
      <div className={styles.embedWrap}>
        <iframe
          src={`https://www.youtube.com/embed/${video.ytVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={styles.ytEmbed}
        />
      </div>
    );
  }

  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" className={styles.embedWrap}>
      <div className={styles.thumbFallback}>
        {video.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className={styles.thumbImg} />
        )}
        <div className={styles.fallbackOverlay}>
          <div className={styles.openBtn}>
            <ExternalLink size={18} strokeWidth={2} />
            <span>{t("videos.openOnYouTube")}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function PlaylistItem({
  video,
  active,
  index,
  onClick,
}: {
  video: VideoHighlight;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.playlistItem} ${active ? styles.playlistItemActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.itemThumb}>
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className={styles.thumbImg} />
        ) : (
          <div className={styles.thumbPlaceholder}>
            <Play size={16} strokeWidth={1.5} />
          </div>
        )}
        {active && (
          <div className={styles.activeOverlay}>
            <div className={styles.activePulse} />
          </div>
        )}
        {!active && (
          <div className={styles.itemHoverOverlay}>
            <Play size={14} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className={styles.itemInfo}>
        {video.matchLabel && <span className={styles.matchLabel}>{video.matchLabel}</span>}
        <p className={styles.itemTitle}>{video.title}</p>
        <span className={styles.itemNum}>{index + 1}</span>
      </div>
    </button>
  );
}

export default function VideosPage() {
  const { activeSport, activeSportConfig } = useActiveSport();
  const { t } = useLanguage();
  const { videos, isLoading, isValidating } = useVideos(activeSport);
  const [featured, setFeatured] = useState<VideoHighlight | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // Refs for stable handleBlocked without stale closures or infinite loops
  const featuredRef = useRef(featured);
  const videosRef = useRef(videos);
  const blockedIdsRef = useRef(blockedIds);
  useEffect(() => { featuredRef.current = featured; }, [featured]);
  useEffect(() => { videosRef.current = videos; }, [videos]);
  useEffect(() => { blockedIdsRef.current = blockedIds; }, [blockedIds]);

  // Reset when sport changes
  useEffect(() => {
    setFeatured(null);
    setBlockedIds(new Set());
  }, [activeSport]);

  // Set initial featured video once per sport load (guarded by ref flag)
  const initializedForSport = useRef<string | null>(null);
  useEffect(() => {
    if (videos.length > 0 && initializedForSport.current !== activeSport) {
      initializedForSport.current = activeSport;
      const best =
        videos.find((v) => v.ytVideoId && v.source === "CBS Sports Golazo") ??
        videos.find((v) => v.ytVideoId) ??
        videos[0];
      setFeatured(best);
    }
  }, [videos, activeSport]);

  // Stable callback — no state in deps, accesses everything via refs
  const handleBlocked = useCallback(() => {
    const cur = featuredRef.current;
    if (!cur) return;
    const newBlocked = new Set([...blockedIdsRef.current, cur.id]);
    setBlockedIds(newBlocked);
    const idx = videosRef.current.findIndex((v) => v.id === cur.id);
    const next = videosRef.current.find((v, i) => i > idx && !newBlocked.has(v.id));
    if (next) setFeatured(next);
  }, []);

  return (
    <AppShell active="videos" title="Videos" subtitle={`${activeSportConfig.label} highlights`}>
      <div className="stack">
        <div className="sec-head">
          <div className="title">
            <Tv2 size={17} className="title-icon" strokeWidth={2} />
            {activeSportConfig.icon} {t("videos.recentHighlights")} <span className="accent">{t("videos.highlightsAccent")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isValidating && !isLoading && (
              <RefreshCw
                size={12}
                strokeWidth={2}
                style={{ color: "var(--text-mute)", animation: "spin 1s linear infinite" }}
              />
            )}
            <span
              style={{
                fontSize: 12,
                color: "var(--text-mute)",
                fontFamily: "var(--mono)",
              }}
            >
              {isLoading ? t("videos.loading") : `${videos.length} ${t("videos.videosCount")}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingLayout}>
            <div className="skeleton-row" style={{ aspectRatio: "16/9", borderRadius: 12 }} />
            <div className={styles.loadingList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-row" style={{ height: 72, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className={styles.empty}>
            <PlayCircle size={48} strokeWidth={1} style={{ color: "var(--text-mute)", marginBottom: 16 }} />
            <p className={styles.emptyTitle}>{t("videos.noHighlights")}</p>
            <p className={styles.emptySub}>
              {t("videos.noRecentHighlights").replace("{sport}", activeSportConfig.label)}
              <br />
              {t("videos.checkBack")}
            </p>
          </div>
        ) : (
          <div className={styles.playerLayout}>
            {/* Left: featured player + meta */}
            <div className={styles.featuredSection}>
              {featured && (
                <>
                  <FeaturedPlayer video={featured} onBlocked={handleBlocked} />
                  <div className={styles.featuredMeta}>
                    {featured.matchLabel && (
                      <span className={styles.featuredMatch}>{featured.matchLabel}</span>
                    )}
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <a
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.ytOpenLink}
                    >
                      <PlayCircle size={14} strokeWidth={2} />
                      {t("videos.watchOnYouTube")}
                      <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Right: playlist */}
            <div className={styles.playlist}>
              <div className={styles.playlistHeader}>
                <Play size={12} strokeWidth={2.5} />
                {t("videos.upNext")}{videos.length} {t("videos.videos")}
              </div>
              <div className={styles.playlistScroll}>
                {videos.map((v, i) => (
                  <PlaylistItem
                    key={v.id}
                    video={v}
                    active={featured?.id === v.id}
                    index={i}
                    onClick={() => setFeatured(v)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
