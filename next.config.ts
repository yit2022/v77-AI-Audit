import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone kept for Docker/Contabo; OpenNext has its own bundling
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "@libsql/client"],
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
