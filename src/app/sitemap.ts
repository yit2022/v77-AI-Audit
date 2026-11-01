import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppOrigin();
  const paths = ["", "/how-it-works", "/frameworks", "/security", "/contact", "/privacy", "/terms", "/login", "/signup"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
