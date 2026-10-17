import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "1section.com",
    "*.1section.com",
    "*.localhost",
    "lvh.me",
    "*.lvh.me",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.1section.com" },
      { protocol: "https", hostname: "**.paddle.com" },
      { protocol: "https", hostname: "**.paddleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
