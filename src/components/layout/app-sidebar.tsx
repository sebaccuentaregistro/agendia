"use client";

import { usePathname } from "next/navigation";
import { LayoutGrid, Users, ClipboardList, Calendar, Star, Sparkles, HeartPulse, Warehouse, CreditCard, Bot } from "lucide-react";
import Link from "next/link";
import { SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

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

function NavContent() {
  const pathname = usePathname();
  return (
    <>
     <SheetHeader className="border-b p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="h-6 w-6 text-primary" />
            <SheetTitle>YogaFlow</SheetTitle>
          </Link>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start gap-1 p-4">
          {menuItems.map((item) => {
            const LinkComponent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                  pathname === item.href && "bg-accent text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
            // In mobile view, wrap with SheetClose to close panel on navigation
            if (SheetClose.displayName) {
              return <SheetClose asChild key={item.href}>{LinkComponent}</SheetClose>
            }
            return LinkComponent;
          })}
        </nav>
      </div>
    </>
  )
}


export default function AppSidebar() {
  return <NavContent />;
}
