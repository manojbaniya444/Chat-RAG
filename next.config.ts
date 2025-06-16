import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Server Actions
  serverActions: {
    // Increase body size limit to 6MB to handle PDF uploads
    bodySizeLimit: '6mb',
  },
};

export default nextConfig;
