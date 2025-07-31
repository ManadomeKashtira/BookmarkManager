/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Disable ESLint during build for standalone version
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Electron-specific configurations
  basePath: '',
};

export default nextConfig;
