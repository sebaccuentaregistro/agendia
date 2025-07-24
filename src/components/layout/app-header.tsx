

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Info, LogOut, DollarSign, User, Shield, Landmark, Users, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudio } from '@/context/StudioContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import type { Session } from '@/types';

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/schedule", label: "Horarios" },
  { href: "/students", label: "Personas" },
  { href: "/tariffs", label: "Aranceles" },
];

interface AppHeaderProps {
  openPersonDialog: () => void;
  openSessionDialog: (session: Session | null) => void;
}

export function AppHeader({ openPersonDialog, openSessionDialog }: AppHeaderProps) {
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
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
            <div>
                <div className="flex items-center gap-2">
                    <Heart className="h-7 w-7 text-fuchsia-500" />
                    <span className="text-lg font-semibold text-slate-800 dark:text-white sm:inline">Agendia</span>
                </div>
                {institute && (
                     <p className="text-sm font-semibold text-foreground">{institute.name}</p>
                )}
            </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
         {institute && (
            <>
                <div className="hidden sm:flex items-center gap-4">
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
                 <Separator orientation="vertical" className="h-6 hidden sm:block" />
            </>
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Añadir</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones Rápidas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => openSessionDialog(null)}>
                    Nuevo Horario
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openPersonDialog}>
                    Nueva Persona
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
