"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  slot: string;
}

interface AdSlotProps {
  size?: "banner" | "square" | "strip" | "compact" | "card" | "feed" | "match" | "sidebar";
  label?: string;
  interval?: number; // rotation interval in ms, default 5000
}

export default function AdSlot({ size = "banner", label = "Advertisement", interval = 5000 }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliding, setSliding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const trackedRef = useRef<Set<string>>(new Set());

  // Fetch all ads for this slot
  useEffect(() => {
    const loadAds = () => {
      fetch(`/api/ads/active?slot=${size}&t=${Date.now()}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ads?.length > 0) setAds(data.ads);
        })
        .catch(() => {});
    };
    loadAds();
    const refresh = setInterval(loadAds, 120_000); // refresh ad pool every 2 min
    return () => clearInterval(refresh);
  }, [size]);

  // Track impression when a new ad becomes visible
  const trackImpression = useCallback((ad: Ad) => {
    if (trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id, type: "impression" }),
    }).catch(() => {});
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % ads.length);
        setSliding(false);
      }, 400); // match CSS transition duration
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [ads.length, interval]);

  // Track impression for current ad
  useEffect(() => {
    if (ads[activeIdx]) trackImpression(ads[activeIdx]);
  }, [activeIdx, ads, trackImpression]);

  if (ads.length === 0) return null;

  const ad = ads[activeIdx];

  const handleClick = () => {
    fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id, type: "click" }),
    }).catch(() => {});
    window.open(ad.linkUrl, "_blank", "noopener");
  };

  return (
    <div
      className={`ad-slot ad-slot--${size}`}
      aria-label="Sponsored content"
      onClick={handleClick}
      style={{ cursor: "pointer", overflow: "hidden" }}
    >
      <div
        className="ad-slot__inner"
        style={{
          transform: sliding ? "translateX(-100%)" : "translateX(0)",
          opacity: sliding ? 0 : 1,
          transition: sliding
            ? "transform 0.4s ease-in-out, opacity 0.3s ease-in-out"
            : "none",
        }}
      >
        <span className="ad-slot__tag">{label}</span>
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="ad-slot__img"
            loading="lazy"
          />
        ) : (
          <div className="ad-slot__text-ad">
            <span className="ad-slot__title">{ad.title}</span>
          </div>
        )}
      </div>

      {/* Dot indicators for multiple ads */}
      {ads.length > 1 && (
        <div className="ad-slot__dots">
          {ads.map((_, i) => (
            <span
              key={i}
              className={`ad-slot__dot${i === activeIdx ? " ad-slot__dot--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                clearInterval(timerRef.current);
                setActiveIdx(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
