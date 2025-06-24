"use client";

import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Calendar,
  Star,
  CreditCard,
  Sparkles,
  HeartPulse,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutGrid },
  { href: "/schedule", label: "Horario", icon: Calendar },
  { href: "/students", label: "Personas", icon: Users },
  { href: "/instructors", label: "Especialistas", icon: ClipboardList },
  { href: "/specializations", label: "Actividades", icon: Star },
  { href: "/spaces", label: "Espacios", icon: Warehouse },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/assistant", label: "Asistente IA", icon: Sparkles },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SheetHeader className="border-b p-4">
        <SheetTitle asChild>
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span>YogaFlow</span>
          </Link>
        </SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start gap-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname.startsWith(item.href) && "bg-muted text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
