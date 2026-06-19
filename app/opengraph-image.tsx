import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Curly Sports — Live Scores, Teams, Players & News";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a1d",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent circle glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,255,61,0.12) 0%, transparent 70%)",
            top: -100,
            right: -100,
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#1a1830",
              border: "2px solid rgba(200,255,61,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://curlysports.com/curly-guy.png"
              width={72}
              height={72}
              alt="Curly"
              style={{ display: "block" }}
            />
          </div>
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#fffdf7",
              letterSpacing: "-1px",
            }}
          >
            curly
            <span style={{ color: "#c8ff3d" }}>.</span>
            sports
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "rgba(255,253,247,0.5)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Your Ultimate Sports Hub
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Live Scores", "Teams", "Debates", "News", "Mini Games"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(200,255,61,0.1)",
                border: "1px solid rgba(200,255,61,0.3)",
                borderRadius: 100,
                padding: "8px 18px",
                fontSize: 15,
                fontWeight: 700,
                color: "#c8ff3d",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
