import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    // Explicitly expose the API URL
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      console.log('=== BUILD TIME DEBUG ===');
      console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('========================');
    }
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
};

export default nextConfig;
