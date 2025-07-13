import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  images: {
    remotePatterns: [
      { hostname: "cdn1.iconfinder.com" },
      { hostname: "cdn3.iconfinder.com" },
      { hostname: "www.shareicon.net" },
      { hostname: "www.iconarchive.com" },
      { hostname: "imgs.search.brave.com" },
      { hostname: "http.cat" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:8080",
        "localhost",
        "backend:3001",
        "frontend:3000",
      ],
    },
  },
};

export default nextConfig;
