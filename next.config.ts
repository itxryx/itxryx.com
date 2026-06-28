import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // SSG support
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
