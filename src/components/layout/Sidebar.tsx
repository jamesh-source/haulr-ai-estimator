'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Map,
  Images,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',  icon: LayoutDashboard },
  { label: 'New Estimate', href: '/estimator',  icon: Sparkles },
  { label: 'Quotes',       href: '/quotes',     icon: FileText },
  { label: 'Customers',    href: '/customers',  icon: Users },
  { label: 'Jobs',         href: '/jobs',       icon: Briefcase },
  { label: 'Schedule',     href: '/schedule',   icon: Calendar },
  { label: 'Route',        href: '/route',      icon: Map },
  { label: 'Gallery',      href: '/gallery',    icon: Images },
  { label: 'Analytics',    href: '/analytics',  icon: BarChart3 },
  { label: 'Settings',     href: '/settings',   icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'relative flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
            <Truck className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold text-gray-900 tracking-tight overflow-hidden whitespace-nowrap"
              >
                HAULR
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors flex-shrink-0',
            collapsed && 'hidden'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute top-16 -right-3 flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 shadow-sm z-10 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn(
        'flex items-center border-t border-gray-200 p-3 flex-shrink-0',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 overflow-hidden"
            >
              <p className="text-xs text-gray-500 whitespace-nowrap">Signed in</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
