import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  experimental: {
    // optimizePackageImports helps with tree-shaking
    optimizePackageImports: ["@clerk/nextjs", "@tanstack/react-query", "@trpc/client", "@trpc/react-query"],
  },
  
  // Fast Refresh configuration
  reactStrictMode: true,
  
  // Note: Webpack configuration removed as we're using Turbopack
  // If you need to switch back to Webpack, uncomment the following:
  /*
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        perf_hooks: false,
        fs: false,
        crypto: false,
        os: false,
        stream: false,
      };
    }
    return config;
  },
  */
  
  // Ensure database operations only run on server
  serverExternalPackages: ['postgres', 'drizzle-orm'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
    ],
  },
};

export default nextConfig;
