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
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      const InjectManifest = require('workbox-webpack-plugin').InjectManifest;
      config.plugins.push(
        new InjectManifest({
          swSrc: './src/lib/sw.js',
          swDest: 'sw.js',
          // Do not cache images by default
          exclude: [/\.map$/, /_buildManifest\.js$/, /_ssgManifest\.js$/, /_middlewareManifest\.js$/, /manifest\.json$/, /.+?\.png$/i],
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
