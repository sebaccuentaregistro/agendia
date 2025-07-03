// YogaFlow Next.js Configuration

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // Forzar el uso de Terser para mayor compatibilidad en producción.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  // Obliga a Next.js a recompilar los paquetes de Firebase para que sean compatibles
  // con el entorno de producción, evitando que el código se rompa durante la optimización.
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/firestore'],
};

module.exports = nextConfig;
