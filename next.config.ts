import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit to 6MB to handle PDF uploads
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
