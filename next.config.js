
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Evita que 'undici' se incluya en los bundles del cliente.
    // Esto resuelve el error "Module parse failed" causado por dependencias de Firebase/Genkit.
    if (!isServer) {
      config.externals.push('undici');
    }
    
    // Solución para el error de empaquetado de chunks de Firebase en el servidor
    if (isServer) {
      config.externals.push({
        '@firebase/app': 'commonjs @firebase/app',
        '@firebase/auth': 'commonjs @firebase/auth',
        '@firebase/firestore': 'commonjs @firebase/firestore',
      });
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

module.exports = nextConfig;
