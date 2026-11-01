import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppOrigin();
  const paths = ["", "/how-it-works", "/demo", "/resources", "/resources/eu-ai-act-risk-tiers", "/resources/high-risk-obligations", "/resources/gpai-transparency", "/frameworks", "/security", "/contact", "/developers", "/privacy", "/terms", "/login", "/signup"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
