// YogaFlow Next.js Configuration

/** @type {import('next').NextConfig} */
const nextConfig = {
  // swcMinify: false, // Dejar que Next.js use su compilador rápido, pero forzar la transpilación de Firebase.
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
  // Esta es la corrección clave.
  // Obliga a Next.js a recompilar los paquetes de Firebase para que sean compatibles
  // con el entorno de producción, evitando que el código se rompa durante la optimización.
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/firestore'],
};

module.exports = nextConfig;
