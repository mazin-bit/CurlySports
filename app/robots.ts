import { MetadataRoute } from "next";

const SITE_URL = "https://curlysports.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
