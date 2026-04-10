/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Production optimizations
  compress: true,
  generateEtags: true,
  // Disable dev features
  devIndicators: false,
  // Security
  poweredByHeader: false,
  // Image optimization (if using Next.js image)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;