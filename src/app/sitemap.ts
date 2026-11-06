import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppOrigin();
  const paths = ["", "/pricing", "/how-it-works", "/demo", "/resources", "/resources/eu-ai-act-risk-tiers", "/resources/high-risk-obligations", "/resources/gpai-transparency", "/frameworks", "/security", "/contact", "/developers", "/privacy", "/terms", "/login", "/signup"];
  const lastMod = new Date("2026-11-06T00:00:00.000Z");
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: lastMod,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.7,
  }));
}
