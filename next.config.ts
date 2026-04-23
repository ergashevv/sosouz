import type { NextConfig } from "next";

/**
 * OpenNext Cloudflare dev hook spawns `workerd` (Cloudflare’s local runtime). That binary does not
 * run on Vercel’s build image (GLIBC mismatch → EPIPE). Only wire it for local `next dev`.
 */
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } =
    require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
