'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Home, Menu, HeartPulse } from 'lucide-react';
import AppSidebar from './app-sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AppHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-4">
          <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <AppSidebar isSheet={true} />
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <HeartPulse className="h-6 w-6 text-primary" />
          <span>YogaFlow</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {!isDashboard && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Inicio</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Volver a Inicio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </header>
  );
}
