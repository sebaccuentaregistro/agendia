
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { StudioProvider } from '@/context/StudioContext';
import AppHeader from '@/components/layout/app-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Agendia',
  description: 'Gestiona tu centro de bienestar de forma sencilla y eficiente.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StudioProvider>
            <div className="flex min-h-screen w-full flex-col">
              <AppHeader />
              <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
              </main>
              <MobileBottomNav />
            </div>
            <Toaster />
          </StudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
