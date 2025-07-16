'use client';

import { api } from '@/lib/trpc';

import Link from 'next/link';
import { NotificationItem } from '@/modules/shared';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

export function NotificationDropdown({
  onClose,
  onNotificationRead,
}: NotificationDropdownProps) {
  const {
    data: notifications,
    isLoading,
    refetch,
  } = api.notifications.getAll.useQuery({
    limit: 10,
  });

  const markAllAsRead = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      onNotificationRead?.();
    },
  });

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const notificationsList = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-3 border-b border-gray-200 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            알림
          </h3>
          {notificationsList.length > 0 &&
            notificationsList.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-gray-600 hover:text-gray-900 sm:text-sm"
              >
                모두 읽음
              </button>
            )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black mx-auto" />
          </div>
        ) : notificationsList.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notificationsList.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {
                  onClose();
                  refetch();
                  onNotificationRead?.();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-sm text-gray-600 hover:text-gray-900"
        >
          모든 알림 보기
        </Link>
      </div>
    </div>
  );
}
