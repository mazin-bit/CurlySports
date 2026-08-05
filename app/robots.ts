import { MetadataRoute } from "next";

const SITE_URL = "https://curlysports.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/live-scores",
          "/news",
          "/teams",
          "/players",
          "/leagues",
          "/debates",
          "/mini-games",
          "/challenges",
          "/videos",
          "/favorites",
          "/matches",
          "/download",
          "/sports",
        ],
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/_next/",
          "/login",
          "/reset-password",
          "/delete-account",
          "/verify-email",
          "/feedback",
          "/auth/",
          "/redeem",
          "/invite",
          "/dashboard",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
