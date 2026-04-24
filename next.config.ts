import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://165.232.176.24:8000/:path*',
      },
      {
        // LexRam Legal Research v2 backend — proxied so the HTTPS frontend
        // can reach the HTTP origin without mixed-content blocking.
        source: '/legal-api/:path*',
        destination: 'http://157.245.106.223:8124/:path*',
      },
    ];
  },
};

export default nextConfig;
