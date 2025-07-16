'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { api } from '@/lib/trpc';
import { NotificationItem } from '@/modules/shared/notifications/components/NotificationItem';

export function NotificationsPage() {
  const { isSignedIn } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  const {
    data: notifications,
    isLoading,
    refetch,
  } = api.notifications.getAll.useQuery({
    limit: 50,
    onlyUnread: filter === 'unread',
  });

  const deleteAll = api.notifications.deleteAll.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsRead = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const notificationsList = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">알림</h1>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              읽지 않음
            </button>
          </div>

          <div className="flex gap-2">
            {notificationsList.length > 0 &&
              notificationsList.some((n) => !n.isRead) && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  모두 읽음
                </button>
              )}
            {notificationsList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('모든 알림을 삭제하시겠습니까?')) {
                    deleteAll.mutate();
                  }
                }}
                disabled={deleteAll.isPending}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                모두 삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        </div>
      ) : notificationsList.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {notificationsList.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={refetch}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-900 mb-2">
              {filter === 'unread'
                ? '읽지 않은 알림이 없습니다'
                : '알림이 없습니다'}
            </p>
            <p className="text-sm text-gray-600">
              다른 사용자들과 소통하면 여기에 알림이 표시됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
