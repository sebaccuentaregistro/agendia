
import './globals.css';

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
          backgroundColor: '#f0f0f0',
          fontFamily: 'sans-serif',
          color: '#333',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Servidor Recuperado</h1>
            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
              El servidor de la vista previa está nuevamente en línea. En el siguiente paso, restauraremos la aplicación por completo.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
