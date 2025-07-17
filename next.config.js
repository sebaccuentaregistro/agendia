
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adding a comment to force a webpack rebuild and solve module not found errors.
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
};

module.exports = nextConfig;
