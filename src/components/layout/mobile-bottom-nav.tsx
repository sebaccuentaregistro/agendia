

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/schedule", label: "Horarios", icon: Calendar },
  { href: "/students", label: "Personas", icon: Users },
  { href: "/?view=management", label: "Gestión", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t border-border/50 shadow-t-lg z-50">
      <nav className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href)) || (item.href.startsWith('/?view=') && pathname === '/' && new URLSearchParams(window.location.search).get('view') === item.href.split('=')[1]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
