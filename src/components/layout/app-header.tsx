
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Info, LogOut, DollarSign, User, Shield, Landmark, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudio } from '@/context/StudioContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/schedule", label: "Horarios" },
  { href: "/students", label: "Personas" },
  { href: "/instructors", label: "Especialistas" },
  { href: "/specializations", label: "Actividades" },
  { href: "/spaces", label: "Espacios" },
  { href: "/levels", label: "Niveles" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { openTutorial, people } = useStudio();
  const { logout, activeOperator, logoutOperator, userProfile, institute } = useAuth();
  const router = useRouter();

  const handleFullLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const isSuperAdmin = userProfile?.isSuperAdmin === true;
  const studentLimit = institute?.studentLimit;
  const studentCount = people.length;
  
  const usagePercentage = (studentLimit && studentLimit > 0) ? (studentCount / studentLimit) * 100 : 0;
  const usageColorClass = usagePercentage > 90 ? (usagePercentage >= 100 ? 'text-destructive' : 'text-yellow-500') : 'text-muted-foreground';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 bg-background/90 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5 font-semibold text-slate-800 dark:text-white">
          <Heart className="h-7 w-7 text-fuchsia-500" />
          <span className="hidden text-lg sm:inline">Agendia</span>
        </Link>
        
        {institute && activeOperator && (
            <>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Landmark className="h-4 w-4" />
                        <span className="hidden sm:inline">{institute.name}</span>
                    </div>
                    {studentLimit !== undefined && studentLimit > 0 && (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", usageColorClass)}>
                                        <Users className="h-4 w-4" />
                                        <span>{studentCount}/{studentLimit}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{studentCount} de {studentLimit} alumnos permitidos en tu plan.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {pathname === '/' && (
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
        {isSuperAdmin && (
             <Link
                href="/superadmin"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 h-9 text-sm font-medium transition-colors hover:bg-accent hover:text-primary",
                  pathname.startsWith('/superadmin') ? "text-primary bg-accent" : "text-muted-foreground"
                )}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
          )}
        <ThemeToggle />
         {activeOperator && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <User className="mr-2 h-4 w-4" />
                    {activeOperator.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuLabel>Sesión activa</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {activeOperator.role !== 'admin' && (
                      <DropdownMenuItem onSelect={logoutOperator}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cambiar Operador
                      </DropdownMenuItem>
                   )}
                   <DropdownMenuItem onSelect={handleFullLogout} className="text-destructive focus:text-destructive">
                     <LogOut className="mr-2 h-4 w-4" />
                     Cerrar Sesión General
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
         )}
      </div>
    </header>
  );
}
