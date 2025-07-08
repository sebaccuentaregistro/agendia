
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#111',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '20px',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#f0f', marginBottom: '1rem' }}>SISTEMA EN RECUPERACIÓN</h1>
            <p>El servidor se ha restaurado con éxito. La aplicación se recargará por completo en el siguiente paso.</p>
            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#888' }}>
              Este es un estado temporal para solucionar el bloqueo. No te preocupes, tus datos están a salvo.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
