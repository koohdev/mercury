import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.6', 'localhost:3000'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
