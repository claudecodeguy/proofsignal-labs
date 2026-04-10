import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  serverExternalPackages: ["@mendable/firecrawl-js"],
};

export default nextConfig;
