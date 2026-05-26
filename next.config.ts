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
  async redirects() {
    return [
      // /pricing direct URL → homepage pricing anchor
      { source: '/pricing', destination: '/#pricing', permanent: true },

      // Marketing / SEO stub URLs surfaced by the landing page — point at the
      // real product surfaces so deep-links and shared URLs don't 404.
      { source: '/title-scrutiny-report',  destination: '/dashboard/tsr',         permanent: false },
      { source: '/tsr-landing',            destination: '/dashboard/tsr',         permanent: true  },
      { source: '/bare-acts-library',      destination: '/acts',                  permanent: true  },
      { source: '/resources',              destination: '/acts',                  permanent: true  },

      // Practice-area marketing tiles — until per-practice landings exist,
      // anchor back to the #practice-areas grid on the homepage.
      { source: '/practice',         destination: '/#practice-areas', permanent: false },
      { source: '/practice/:slug',   destination: '/#practice-areas', permanent: false },

      // Drafting-template marketing tiles → into the drafting tool.
      { source: '/drafting',         destination: '/dashboard/research-2', permanent: false },
      { source: '/drafting/:slug',   destination: '/dashboard/research-2', permanent: false },

      // Comparison stubs — none of these pages exist yet; send to homepage.
      { source: '/compare',          destination: '/#sc-precedent-research', permanent: false },
      { source: '/compare/:slug',    destination: '/#sc-precedent-research', permanent: false },

      // Security stubs
      { source: '/security/:slug',   destination: '/#faq', permanent: false },

      // Legacy dashboard redirect
      { source: '/dashboard/research-3',        destination: '/dashboard/research-2', permanent: false },
      { source: '/dashboard/research-3/:path*', destination: '/dashboard/research-2', permanent: false },
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
};

export default nextConfig;
