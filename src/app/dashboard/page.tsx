'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users, ClipboardList, Star, Warehouse, Bot } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: "/schedule", label: "Horario", icon: Calendar, description: "Gestiona y visualiza las clases programadas." },
  { href: "/students", label: "Personas", icon: Users, description: "Administra los perfiles de todos tus clientes." },
  { href: "/instructors", label: "Especialistas", icon: ClipboardList, description: "Gestiona los perfiles de los instructores." },
  { href: "/specializations", label: "Actividades", icon: Star, description: "Define los tipos de clases que ofreces." },
  { href: "/spaces", label: "Espacios", icon: Warehouse, description: "Administra los salones y áreas físicas." },
  { href: "/assistant", label: "Asistente IA", icon: Bot, description: "Crea horarios óptimos con inteligencia artificial." },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader title="Panel de Control" description="Selecciona una sección para empezar a gestionar tu estudio de bienestar." />
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block transition-transform hover:-translate-y-1">
              <Card className="group flex h-full flex-col justify-between p-6 transition-colors hover:border-primary hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-lg font-bold">{item.label}</CardTitle>
                        <CardDescription className="mt-1">{item.description}</CardDescription>
                    </div>
                  </div>
              </Card>
          </Link>
          ))}
      </div>
    </div>
  );
}
