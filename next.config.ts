import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "gnews.io",
      "cdn.gnews.io",
      "images.unsplash.com",
      "bbc.com",
      "cnn.com",
      "marketscreener.com" 
    ],
  },
};

export default nextConfig;
