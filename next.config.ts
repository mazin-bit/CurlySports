import type { NextConfig } from "next";
import path from "path";

const sharedPath = path.join(__dirname, "shared");

const nextConfig: NextConfig = {
  // Required for Docker standalone deployment
  output: "standalone",

  // Allow external image CDNs
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "a2.espncdn.com" },
      { protocol: "https", hostname: "a3.espncdn.com" },
      { protocol: "https", hostname: "cdn.nba.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // BBC Sport
      { protocol: "https", hostname: "ichef.bbci.co.uk" },
      // The Guardian
      { protocol: "https", hostname: "media.guim.co.uk" },
      // Sky Sports
      { protocol: "https", hostname: "e0.365dm.com" },
      { protocol: "https", hostname: "e1.365dm.com" },
      { protocol: "https", hostname: "e2.365dm.com" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90, 100],
    minimumCacheTTL: 3600,
  },

  // @curly/shared is resolved via tsconfig.json paths (Turbopack reads these natively)
  turbopack: {},

  // Webpack fallback (used when running with --webpack flag)
  webpack(config) {
    config.resolve.alias["@curly/shared"] = sharedPath;
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Enable experimental features for SSE streaming
  experimental: {
    // Required for proper SSE response streaming in App Router
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "localhost:3000",
        "curlysports.com",
        "www.curlysports.com",
        // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.x.x.x)
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")]
          : []),
      ],
      // Allow all origins in development for IP-based mobile testing
      ...(process.env.NODE_ENV === "development" ? { allowedForwardedHosts: ["*"] } : {}),
    },
  },
};

export default nextConfig;
