
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agendia - Modo de Recuperación',
  description: 'Aplicación en modo de recuperación.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          fontFamily: 'sans-serif', 
          textAlign: 'center',
          backgroundColor: '#f0f2f5'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#172b4d' }}>Aplicación en modo de recuperación.</h1>
            <p style={{ fontSize: '1.1rem', color: '#5e6c84' }}>Por favor, confirma que puedes ver este mensaje. La web volverá en el siguiente paso.</p>
            {/* Ocultamos el contenido problemático temporalmente */}
            <div style={{ display: 'none' }}>{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
