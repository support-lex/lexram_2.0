import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  devIndicators: false,
  // Lives in a subfolder of the lexram repo; pin tracing to itself.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
