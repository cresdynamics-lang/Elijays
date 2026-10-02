import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/jackets", destination: "/outerwear", permanent: true },
      { source: "/sweaters", destination: "/knitwear", permanent: true },
    ];
  },
};

export default nextConfig;
