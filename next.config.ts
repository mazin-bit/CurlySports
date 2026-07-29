import type { NextConfig } from "next";
import path from "path";

const sharedPath = path.join(__dirname, "shared");

const nextConfig: NextConfig = {
  // Required for Docker standalone deployment
  output: "standalone",

  // Explicitly pass NEXT_PUBLIC env vars to the client bundle
  // (Turbopack may not inline process.env.NEXT_PUBLIC_* automatically in all cases)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || "",
  },

  // Allow local network IPs to access dev resources (HMR, etc.) — dev only
  ...(process.env.NODE_ENV === "development" ? { allowedDevOrigins: ["192.168.110.0"] } : {}),

  // Allow external image CDNs
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/api/proxy-image",
        search: "",
      },
    ],
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
      // Supabase storage (post images, avatars)
      { protocol: "https", hostname: "*.supabase.co" },
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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.google.com https://*.gstatic.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://a.espncdn.com https://a2.espncdn.com https://a3.espncdn.com https://cdn.nba.com https://media.api-sports.io https://upload.wikimedia.org https://ichef.bbci.co.uk https://media.guim.co.uk https://e0.365dm.com https://e1.365dm.com https://e2.365dm.com https://lh3.googleusercontent.com https://www.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://site.api.espn.com https://api.openf1.org https://www.thesportsdb.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://*.google.com https://*.gstatic.com",
              "frame-src 'self' https://*.google.com https://*.firebaseapp.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Enable experimental features for SSE streaming
  experimental: {
    // Required for proper SSE response streaming in App Router
    serverActions: {
      allowedOrigins: [
        "curlysports.com",
        "www.curlysports.com",
        ...(process.env.NODE_ENV === "development" ? ["localhost:3001", "localhost:3000", "192.168.110.0:3001"] : []),
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")]
          : []),
      ],
    },
  },
};

export default nextConfig;
