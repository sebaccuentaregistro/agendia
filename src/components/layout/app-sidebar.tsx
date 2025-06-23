"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  ClipboardUser,
  Calendar,
  Star,
  CreditCard,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import Link from "next/link";

const menuItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutGrid },
  { href: "/schedule", label: "Horario", icon: Calendar },
  { href: "/students", label: "Estudiantes", icon: Users },
  { href: "/instructors", label: "Especialistas", icon: ClipboardUser },
  { href: "/specializations", label: "Actividades", icon: Star },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/assistant", label: "Asistente IA", icon: Sparkles },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <HeartPulse className="text-primary" size={24} />
          <h2 className="text-lg font-semibold font-headline text-foreground">YogaFlow</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Can add user profile or settings here */}
      </SidebarFooter>
    </>
  );
}
