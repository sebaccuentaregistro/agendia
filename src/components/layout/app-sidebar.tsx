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
  UserSquare,
  Calendar,
  Star,
  CreditCard,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import Link from "next/link";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/students", label: "Students", icon: Users },
  { href: "/instructors", label: "Instructors", icon: UserSquare },
  { href: "/specializations", label: "Specializations", icon: Star },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
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
                isActive={pathname === item.href}
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
