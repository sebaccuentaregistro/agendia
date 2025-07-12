// YogaFlow Next.js Configuration
// Forzando la invalidación de la caché de Next.js con una nueva modificación.
// Una modificación más para asegurar el reseteo de la caché.
// Y otra más para estar seguros.

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
};

module.exports = nextConfig;
