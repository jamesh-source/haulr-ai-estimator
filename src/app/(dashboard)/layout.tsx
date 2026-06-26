import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex flex-col" />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header — padding-top accounts for iOS notch in standalone mode */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-none">
          {/* pb-24 on mobile = bottom nav (h-16) + home indicator safe area */}
          <div className="p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
