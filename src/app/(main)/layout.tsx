import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { StudioProvider } from '@/context/StudioContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioProvider>
      <Sidebar collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </StudioProvider>
  );
}
