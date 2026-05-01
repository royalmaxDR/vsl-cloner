import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  // Exclude heavy native modules from bundling — they must be loaded at runtime
  serverExternalPackages: [
    '@sparticuz/chromium-min',
    'puppeteer-core',
  ],
  // Allow cross-origin requests for VSL player scripts
  async headers() {
    return [
      {
        source: '/p/:slug*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
