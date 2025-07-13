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
  webpack: (config, { isServer }) => {
    // Agregado para forzar la resolución del SDK de cliente de Firebase
    // y evitar que se incluya el SDK de Node.js en el bundle del cliente.
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/auth': 'firebase/auth/dist/index.mjs',
    };

    return config;
  },
};

module.exports = nextConfig;
