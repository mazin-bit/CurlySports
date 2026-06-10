"use client";

interface AdSlotProps {
  size?: "banner" | "square" | "strip" | "compact" | "card";
  label?: string;
}

export default function AdSlot({ size = "banner", label = "Advertisement" }: AdSlotProps) {
  return (
    <div className={`ad-slot ad-slot--${size}`} aria-label="Sponsored content">
      <div className="ad-slot__inner">
        <div className="ad-slot__tag">{label}</div>
        <div className="ad-slot__placeholder">
          <span className="ad-slot__icon">◈</span>
          <span className="ad-slot__text">Your ad here</span>
          {size !== "compact" && (
            <span className="ad-slot__sub">Premium sports audience · 2.1M+ fans</span>
          )}
        </div>
      </div>
    </div>
  );
}
