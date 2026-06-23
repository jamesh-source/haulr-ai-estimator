'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, ExternalLink } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, string>;
}

const POLL_INTERVAL_MS = 60_000; // 60 seconds

const TYPE_ICONS: Record<string, string> = {
  payment_received: '💰',
  payment_failed: '❌',
  quote_approved: '✅',
  changes_requested: '✏️',
  job_scheduled: '📅',
  default: '🔔',
};

function notificationHref(notification: Notification): string | null {
  const meta = notification.metadata ?? {};
  if (meta.invoice_id) return `/invoices/${meta.invoice_id}`;
  if (meta.quote_id) return `/quotes/${meta.quote_id}`;
  if (meta.job_id) return `/jobs/${meta.job_id}`;
  return null;
}

// ---------------------------------------------------------------------------
// NotificationBell
// ---------------------------------------------------------------------------

export function NotificationBell({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------------------------------------------------------------------------
  // Fetch notifications
  // -------------------------------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently ignore network errors during polling
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Mark single notification as read
  // -------------------------------------------------------------------------
  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  // -------------------------------------------------------------------------
  // Mark all as read
  // -------------------------------------------------------------------------
  const markAllRead = async () => {
    setIsLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setIsLoading(false);
  };

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-96 max-h-[480px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Bell className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You&apos;ll see updates here when things happen.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const href = notificationHref(notification);
                  const icon =
                    TYPE_ICONS[notification.type] ?? TYPE_ICONS.default;

                  const content = (
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium leading-snug',
                            notification.is_read
                              ? 'text-gray-600'
                              : 'text-gray-900'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {href && (
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <li key={notification.id}>
                      <div
                        className={cn(
                          'px-4 py-3 transition-colors',
                          !notification.is_read
                            ? 'bg-orange-50 hover:bg-orange-100'
                            : 'hover:bg-gray-50'
                        )}
                        onClick={() => {
                          if (!notification.is_read) markRead(notification.id);
                        }}
                      >
                        {href ? (
                          <Link
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className="block"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="cursor-default">{content}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
              <Link
                href="/settings?tab=notifications"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Manage notification preferences
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
