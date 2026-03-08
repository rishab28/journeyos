import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse', 'pdf-lib'],
  // Allow large PDF uploads via Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // @ts-ignore - Silence Turbopack/Webpack conflict
  turbopack: {},
};

export default withPWA(nextConfig);
