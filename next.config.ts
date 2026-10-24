import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return {
      // Admin uploads land in public/uploads after the build, which `next start`
      // doesn't serve; fall back to a route that reads them from disk.
      fallback: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
    };
  },
  async redirects() {
    return [
      { source: "/jackets", destination: "/outerwear", permanent: true },
      { source: "/sweaters", destination: "/knitwear", permanent: true },
    ];
  },
};

export default nextConfig;
