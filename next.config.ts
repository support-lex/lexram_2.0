import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable gzip/brotli compression for HTML, CSS, JS responses.
  compress: true,
  // Don't ship the X-Powered-By header.
  poweredByHeader: false,
  // Don't inline source maps into production bundles.
  productionBrowserSourceMaps: false,
  // Tree-shake huge icon libraries — only the icons actually imported end up
  // in the bundle instead of the entire package.
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  experimental: {
    // Lets Next de-duplicate and partial-import many large packages.
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'lodash',
      'lodash-es',
      'framer-motion',
      'motion',
      '@tanstack/react-query',
      'zod',
      'sonner',
      'clsx',
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
    ],
    // Long-term caching for build artifacts is on by default in Next 15.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  images: {
    // Keep unoptimized (the codebase uses plain <img>; switching wholesale to
    // next/image would be a larger refactor). But we *do* pre-resize and
    // re-encode large assets via scripts/compress-images.mjs so the savings
    // don't depend on a runtime optimizer being enabled.
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
  async redirects() {
    return [
      {
        source: '/dashboard/research-3',
        destination: '/dashboard/research-2',
        permanent: false,
      },
      {
        source: '/dashboard/research-3/:path*',
        destination: '/dashboard/research-2',
        permanent: false,
      },
    ];
  },
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
  // Long-cache hash-named build assets (/_next/static/*) and aggressive cache
  // for /landing/* so the second visit is essentially instant.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/landing/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, must-revalidate' },
        ],
      },
      {
        source: '/lexram-logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
