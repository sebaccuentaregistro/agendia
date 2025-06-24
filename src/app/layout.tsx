import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { StudioProvider } from '@/context/StudioContext';
import AppSidebar from '@/components/layout/app-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'YogaFlow Manager',
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
          <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-background md:block">
              <div className="flex h-full max-h-screen flex-col gap-2">
                <AppSidebar />
              </div>
            </div>
            <div className="flex flex-col">
              <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex flex-col p-0">
                    <AppSidebar />
                  </SheetContent>
                </Sheet>
                <div className="w-full flex-1">
                  {/* Future elements like search or user menu can go here */}
                </div>
              </header>
              <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </StudioProvider>
      </body>
    </html>
  );
}
