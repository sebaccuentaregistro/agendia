import type { ReactNode } from 'react';
import './globals.css';
// import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: 'Agendia',
  description: 'Gestión para Estudios de Bienestar',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* <AuthProvider> */}
            <AppShell>{children}</AppShell>
            <Toaster />
          {/* </AuthProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
