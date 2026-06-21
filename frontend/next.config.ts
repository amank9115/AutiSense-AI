import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to serve internal assets (/_next/*) when accessed
  // through a different origin, e.g. a VS Code dev tunnel. Without this,
  // Next.js 15 blocks cross-origin requests and chunks fail with a timeout.
  allowedDevOrigins: ['*.devtunnels.ms', '*.inc1.devtunnels.ms'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
      // ML proxy routes (MlController uses @Controller('ml'), no /api/v1 prefix)
      {
        source: '/ml/:path*',
        destination: 'http://localhost:4000/ml/:path*',
      },
      // AI proxy routes (AiController uses @Controller('ai'), no /api/v1 prefix)
      {
        source: '/ai/:path*',
        destination: 'http://localhost:4000/ai/:path*',
      },
    ];
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@/': './src/',
      },
    },
  },
};

export default nextConfig;


