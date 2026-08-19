'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { clearAllNotifications, deleteNotification, getRecentNotifications, markNotificationsRead } from '@/app/actions';
import type { Notification } from '@/lib/types';

const POLL_MS = 30_000;

function notificationHref(n: Notification) {
  if (!n.link) return '#';
  if (!n.related_id) return n.link;
  const separator = n.link.includes('?') ? '&' : '?';
  return `${n.link}${separator}id=${n.related_id}`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const data = await getRecentNotifications();
      if (!cancelled) setNotifications(data);
    }
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function toggleOpen() {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await markNotificationsRead();
    }
  }

  async function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  }

  async function handleClearAll() {
    setNotifications([]);
    await clearAllNotifications();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vocom px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2">
            <span className="text-xs font-medium text-neutral-500">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleClearAll} className="text-xs text-neutral-400 hover:text-neutral-700">
                Clear all
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-400">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {notifications.map((n) => (
                <li key={n.id} className="group relative flex items-start">
                  <Link
                    href={notificationHref(n)}
                    onClick={() => setOpen(false)}
                    className={`block flex-1 px-4 py-3 pr-9 text-sm hover:bg-neutral-50 ${
                      n.read ? 'text-neutral-500' : 'font-medium text-neutral-900'
                    }`}
                  >
                    {n.title}
                    <span className="mt-0.5 block text-xs font-normal text-neutral-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </Link>
                  <button
                    onClick={() => handleDelete(n.id)}
                    aria-label="Dismiss notification"
                    className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-neutral-300 opacity-0 hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
