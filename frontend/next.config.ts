import type { NextConfig } from "next";

// Backend origin the Next.js server-side proxy forwards to. Defaults to the
// local backend; set BACKEND_URL in production (e.g. http://backend:4000 in Docker).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  // Emit a minimal standalone server bundle for small production Docker images
  output: 'standalone',

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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optimize package imports for tree shaking
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts'],
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/ml/:path*',
        destination: `${BACKEND_URL}/ml/:path*`,
      },
      {
        source: '/ai/:path*',
        destination: `${BACKEND_URL}/ai/:path*`,
      },
    ];
  },
};

export default nextConfig;


