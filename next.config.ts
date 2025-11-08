import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  images: {
    unoptimized: true, // ✅ disables all optimization checks
  },
};

export default nextConfig;