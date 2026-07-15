"use client";

import { useEffect, useState } from "react";

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
}

export default function AdSlot({ size = "banner", label = "Advertisement" }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const loadAd = () => {
      fetch(`/api/ads/active?slot=${size}&t=${Date.now()}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ads?.length > 0) setAd(data.ads[0]);
        })
        .catch(() => {});
    };
    loadAd();
    const interval = setInterval(loadAd, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [size]);

  if (!ad) return null;

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
      style={{ cursor: "pointer" }}
    >
      <div className="ad-slot__inner">
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
    </div>
  );
}
