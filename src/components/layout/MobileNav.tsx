'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Estimate',  href: '/estimator',  icon: Sparkles },
  { label: 'Quotes',    href: '/quotes',     icon: FileText },
  { label: 'Schedule',  href: '/schedule',   icon: Calendar },
  { label: 'Customers', href: '/customers',  icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ backgroundColor: '#111827', borderTop: '1px solid #1f2937' }}
    >
      {/* Nav items row */}
      <div className="flex items-stretch h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-orange-400' : 'text-gray-500 active:text-gray-300'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-orange-500" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-orange-400' : 'text-gray-500'
                )}
              />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone home indicator */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
