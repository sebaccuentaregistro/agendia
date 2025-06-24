"use client";

import { usePathname } from "next/navigation";
import { LayoutGrid, Users, ClipboardList, Calendar, Star, HeartPulse, Warehouse, CreditCard, Bot } from "lucide-react";
import Link from "next/link";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/schedule", label: "Horario", icon: Calendar },
  { href: "/students", label: "Personas", icon: Users },
  { href: "/instructors", label: "Especialistas", icon: ClipboardList },
  { href: "/specializations", label: "Actividades", icon: Star },
  { href: "/spaces", label: "Espacios", icon: Warehouse },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/assistant", label: "Asistente IA", icon: Bot },
];

function NavLink({ href, label, icon: Icon, isMobile, currentPath }: { href: string, label: string, icon: React.ElementType, isMobile: boolean, currentPath: string }) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
        currentPath === href && "bg-accent text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  return isMobile ? <SheetClose asChild>{link}</SheetClose> : link;
}

export default function AppSidebar() {
  const pathname = usePathname();
  // A simple check to see if we are in a mobile sheet context.
  // This is a trick: SheetClose is only a valid component inside a Sheet.
  // When not in a sheet, it's just an object, so we can check its displayName.
  const isMobile = SheetClose.displayName === 'DialogClose';

  return (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <HeartPulse className="h-6 w-6 text-primary" />
          <span>YogaFlow</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start gap-1 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isMobile={isMobile}
              currentPath={pathname}
            />
          ))}
        </nav>
      </div>
    </>
  );
}
