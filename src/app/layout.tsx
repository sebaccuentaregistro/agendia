import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Agendia - Recuperación del Sistema',
  description: 'Modo de recuperación del sistema',
};

// Layout simplificado para forzar una reconstrucción limpia.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
