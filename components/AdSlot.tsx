"use client";

interface AdSlotProps {
  size?: "banner" | "square" | "strip" | "compact" | "card";
  label?: string;
}

export default function AdSlot({ size = "banner", label = "Advertisement" }: AdSlotProps) {
  // Hidden until real ad integration is configured
  if (!process.env.NEXT_PUBLIC_ADS_ENABLED) return null;

  return (
    <div className={`ad-slot ad-slot--${size}`} aria-label="Sponsored content">
      <div className="ad-slot__inner">
        <div className="ad-slot__tag">{label}</div>
        <div className="ad-slot__placeholder">
          <span className="ad-slot__icon">◈</span>
          <span className="ad-slot__text">Ad</span>
        </div>
      </div>
    </div>
  );
}
