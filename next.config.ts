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
  // Allow Turbopack to coexist with webpack-based next-pwa
  turbopack: {},
  // Allow large PDF uploads via Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default withPWA(nextConfig);
