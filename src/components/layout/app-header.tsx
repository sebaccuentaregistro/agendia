'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Home, Menu, Heart } from 'lucide-react';
import AppSidebar from './app-sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 bg-transparent px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-4">
          <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-white md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r-0">
            <AppSidebar isSheet={true} />
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-white">
          <Heart className="h-7 w-7 text-fuchsia-500" />
          <span className="text-lg">Agendia</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "rounded-lg bg-white/20 backdrop-blur-sm text-slate-700 dark:text-white dark:bg-white/10",
                      pathname === '/dashboard' && 'bg-white/40 dark:bg-white/20'
                    )}
                  >
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
      </div>
    </header>
  );
}
