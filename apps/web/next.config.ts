import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "avatar.vercel.sh" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
