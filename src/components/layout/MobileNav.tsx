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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-bottom">
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
                'flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              />
              <span className="leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-b-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
