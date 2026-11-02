import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone kept for Docker/Contabo; OpenNext has its own bundling
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm", "date-fns", "zod"],
  },
  serverExternalPackages: ["@electric-sql/pglite", "@libsql/client"],
  async redirects() {
    return [
      { source: "/inventory", destination: "/systems", permanent: false },
      { source: "/inventory/:path*", destination: "/systems/:path*", permanent: false },
      { source: "/ai-systems", destination: "/systems", permanent: false },
      { source: "/ai-systems/:path*", destination: "/systems/:path*", permanent: false },
      { source: "/register", destination: "/signup", permanent: false },
      { source: "/sign-up", destination: "/signup", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/app", destination: "/dashboard", permanent: false },
      { source: "/app/:path*", destination: "/:path*", permanent: false },
      { source: "/account", destination: "/settings", permanent: false },
      { source: "/profile", destination: "/settings", permanent: false },
      { source: "/home", destination: "/", permanent: false },
      { source: "/docs", destination: "/developers", permanent: false },
      { source: "/documentation", destination: "/developers", permanent: false },
      { source: "/api-docs", destination: "/developers", permanent: false },
      { source: "/status", destination: "/api/health", permanent: false },
      { source: "/health", destination: "/api/health", permanent: false },
      { source: "/billing/portal", destination: "/billing", permanent: false },
      { source: "/plans", destination: "/pricing", permanent: false },
      { source: "/pricing-plans", destination: "/pricing", permanent: false },
      { source: "/trial", destination: "/signup", permanent: false },
      { source: "/get-started", destination: "/signup", permanent: false },
      { source: "/password-reset", destination: "/forgot-password", permanent: false },
      { source: "/reset", destination: "/forgot-password", permanent: false },
      { source: "/team", destination: "/settings", permanent: false },
      { source: "/members", destination: "/settings", permanent: false },
      { source: "/org", destination: "/settings", permanent: false },
      { source: "/organisation", destination: "/settings", permanent: false },
      { source: "/organization", destination: "/settings", permanent: false },
      { source: "/trust-center", destination: "/settings", permanent: false },
      { source: "/risk-checker", destination: "/#risk-checker", permanent: false },
      { source: "/pilot", destination: "/#pricing", permanent: false },
      { source: "/request-pilot", destination: "/#pricing", permanent: false },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
