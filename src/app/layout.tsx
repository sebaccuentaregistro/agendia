'use client';

import './globals.css';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

// This is a temporary layout for stabilization
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 font-sans antialiased',
          poppins.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
