import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Bundle analyzer 설정
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Turbopack configuration
  experimental: {
    // optimizePackageImports helps with tree-shaking
    optimizePackageImports: [
      '@clerk/nextjs',
      '@tanstack/react-query',
      '@trpc/client',
      '@trpc/react-query',
      'drizzle-orm',
      'react-icons',
      'date-fns',
      'zod',
    ],
  },

  // Fast Refresh configuration
  reactStrictMode: true,

  // Ensure database operations only run on server
  serverExternalPackages: ['postgres'],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 번들 사이즈 최적화
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서만 적용
    if (!isServer) {
      // 대용량 라이브러리를 별도 청크로 분리
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React 관련 라이브러리
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|react-is)[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // UI 라이브러리
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          // 폼 관련 라이브러리
          forms: {
            name: 'forms',
            test: /[\\/]node_modules[\\/](react-hook-form|zod|@hookform)[\\/]/,
            priority: 14,
            reuseExistingChunk: true,
          },
          // 유틸리티 라이브러리
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](date-fns|clsx|tailwind-merge)[\\/]/,
            priority: 13,
            reuseExistingChunk: true,
          },
          // 기타 vendor 라이브러리
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          // 공통 모듈
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // 컴파일러 최적화
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 모듈 ID 최적화
  productionBrowserSourceMaps: false,
};

// Bundle analyzer와 Sentry config 순차 적용
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

export default withSentryConfig(configWithAnalyzer, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'laaf',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});