import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/vocalize',
  assetPrefix: '/vocalize/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
