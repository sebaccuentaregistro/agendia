
import type { ReactNode } from 'react';

// Este es un layout de emergencia, simplificado al máximo para garantizar la compilación.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
