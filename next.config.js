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
      const { WorkboxWebpackPlugin } = require('workbox-webpack-plugin');
      config.plugins.push(
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: './src/lib/sw.js',
          swDest: '../public/sw.js',
          // Do not cache images by default
          exclude: [/\.map$/, /_buildManifest\.js$/, /_ssgManifest\.js$/, /_middlewareManifest\.js$/, /manifest\.json$/, /.+?\.png$/i],
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
