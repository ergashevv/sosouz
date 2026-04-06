import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/hipo/:path*',
        destination: 'http://universities.hipolabs.com/:path*',
      },
    ];
  },
};

export default nextConfig;
