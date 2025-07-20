"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/trpc";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCount, refetch } = api.notifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: isLoaded && isSignedIn === true,
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: false,
    }
  );
  
  // 숫자로 변환하여 안전하게 처리
  const notificationCount = Number(unreadCount) || 0;

  useEffect(() => {
    if (isOpen && isSignedIn) {
      refetch();
    }
  }, [isOpen, isSignedIn, refetch]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="relative inline-block" data-testid="notification-bell">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notificationCount > 0 && (
          <>
            <span 
              className="absolute flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-gray-900"
              style={{
                top: '-6px',
                right: '-6px',
                minWidth: '20px',
                height: '20px',
              }}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
            <span 
              className="absolute rounded-full bg-red-500 animate-ping opacity-75"
              style={{
                top: '-6px',
                right: '-6px',
                width: '20px',
                height: '20px',
              }}
            />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <NotificationDropdown
            onClose={() => setIsOpen(false)}
            onNotificationRead={refetch}
          />
        </>
      )}
    </div>
  );
}