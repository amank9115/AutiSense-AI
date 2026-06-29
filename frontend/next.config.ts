import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  optimizePackageImports: ['framer-motion', 'recharts'],

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
      {
        source: '/ml/:path*',
        destination: 'http://localhost:4000/ml/:path*',
      },
      {
        source: '/ai/:path*',
        destination: 'http://localhost:4000/ai/:path*',
      },
    ];
  },
};

export default nextConfig;


