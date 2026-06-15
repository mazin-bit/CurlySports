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
      // General fallback (any https image source)
      { protocol: "https", hostname: "**" },
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

  // Enable experimental features for SSE streaming
  experimental: {
    // Required for proper SSE response streaming in App Router
    serverActions: {
      allowedOrigins: ["localhost:3001", "curly.sports", "www.curly.sports"],
    },
  },
};

export default nextConfig;
