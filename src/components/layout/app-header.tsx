
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Heart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudio } from '@/context/StudioContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '../theme-toggle';

const navItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/schedule", label: "Horarios" },
  { href: "/students", label: "Personas" },
  { href: "/instructors", label: "Especialistas" },
  { href: "/specializations", label: "Actividades" },
  { href: "/spaces", label: "Espacios" },
  { href: "/levels", label: "Niveles" },
  { href: "/tariffs", label: "Aranceles" },
  { href: "/statistics", label: "Estadísticas" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { openTutorial } = useStudio();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 bg-transparent px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-2.5 font-semibold text-slate-800 dark:text-white">
          <Heart className="h-7 w-7 text-fuchsia-500" />
          <span className="text-lg">Agendia</span>
        </Link>
        
        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => {
             const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
             return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
             )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {pathname === '/dashboard' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={openTutorial} className="text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/10">
                  <Info className="h-5 w-5" />
                  <span className="sr-only">Mostrar tutorial</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mostrar tutorial de bienvenida</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
