import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { StudioProvider } from '@/context/StudioContext';

export const metadata: Metadata = {
  title: 'YogaFlow Manager',
  description: 'Gestiona tu centro de bienestar de forma sencilla y eficiente.',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-body antialiased`}>
        <StudioProvider>
          {children}
          <Toaster />
        </StudioProvider>
      </body>
    </html>
  );
}
