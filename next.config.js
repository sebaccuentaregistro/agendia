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
    // Generate service worker only for production build and on the client side.
    if (!isServer && !dev) {
      const { InjectManifest } = require('workbox-webpack-plugin');
      config.plugins.push(
        new InjectManifest({
          swSrc: './src/lib/sw-prod.js', // Point to a production-specific service worker source
          swDest: 'sw.js',
          exclude: [
            /\.map$/, 
            /manifest\.json$/, 
            /^(?:.*\/){3}middleware-manifest\.js$/,
            /_buildManifest\.js$/, 
            /_ssgManifest\.js$/,
            /\.DS_Store$/,
          ],
        })
      );
    }
    return config;
  },
  compiler: {
    // Evita que Next.js intente generar una ruta para el favicon
    missingJsFutureWebpack: true,
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
