/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  generateEtags: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
