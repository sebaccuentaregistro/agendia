/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Evita que 'undici' se incluya en los bundles del cliente.
    // Esto resuelve el error "Module parse failed" causado por dependencias de Firebase/Genkit.
    if (!isServer) {
      config.externals.push('undici');
    }
    return config;
  },
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

// Pequeño cambio para forzar la reconstrucción
module.exports = nextConfig;
