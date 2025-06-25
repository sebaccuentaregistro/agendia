
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { StudioProvider } from '@/context/StudioContext';
import AppHeader from '@/components/layout/app-header';

export const metadata: Metadata = {
  title: 'Agendia',
  description: 'Gestiona tu centro de bienestar de forma sencilla y eficiente.',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-body antialiased`}>
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
