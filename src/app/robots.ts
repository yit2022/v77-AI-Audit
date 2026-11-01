import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getAppOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/systems", "/settings", "/leads", "/assessments"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
