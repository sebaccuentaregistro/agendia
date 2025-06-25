
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { StudioProvider } from '@/context/StudioContext';
import AppHeader from '@/components/layout/app-header';

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
      <body className="antialiased bg-gradient-to-br from-indigo-100 via-purple-200 to-pink-200 dark:from-gray-900 dark:via-purple-950 dark:to-slate-900">
        <StudioProvider>
          <div className="flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
          <Toaster />
        </StudioProvider>
      </body>
    </html>
  );
}
