'use client';

import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map route segments to human-readable breadcrumb labels
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  estimator: 'New Estimate',
  quotes: 'Quotes',
  customers: 'Customers',
  jobs: 'Jobs',
  schedule: 'Schedule',
  route: 'Route',
  gallery: 'Gallery',
  analytics: 'Analytics',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

function useBreadcrumbs(): { label: string; href: string }[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((segment, index) => ({
    label: ROUTE_LABELS[segment] ?? segment.replace(/-/g, ' '),
    href: '/' + segments.slice(0, index + 1).join('/'),
  }));
}

interface HeaderProps {
  unreadNotifications?: number;
  className?: string;
}

export function Header({ unreadNotifications = 0, className }: HeaderProps) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header
      className={cn(
        'flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200 flex-shrink-0',
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm capitalize truncate',
                  isLast
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                )}
              >
                {crumb.label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* User avatar */}
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </header>
  );
}
