
import AppSidebar from '@/components/layout/app-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HeartPulse, PanelLeft } from 'lucide-react';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-[280px] sm:w-[320px]">
            <AppSidebar />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
                <HeartPulse className="text-primary" size={24} />
                <h1 className="text-lg font-semibold font-headline text-foreground">YogaFlow</h1>
            </Link>
        </div>
      </header>
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
          {children}
      </main>
    </div>
  );
}
