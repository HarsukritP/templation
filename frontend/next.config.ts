import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output for better Railway compatibility
  output: 'standalone',
  // Explicitly configure server
  experimental: {
    serverComponentsExternalPackages: [],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  // Add logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Ensure proper server configuration
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

export default nextConfig;
