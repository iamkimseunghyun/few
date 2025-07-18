'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { NotificationItem } from '@/modules/shared';
import { useInfiniteScroll } from '@/modules/shared';
import { Bell, Check } from 'lucide-react';

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = api.notifications.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const { ref: scrollRef } = useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  });

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              알림
            </h1>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Check className="h-4 w-4" />
                모두 읽음
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              읽지 않음
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent mx-auto" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => refetch()}
                  />
                ))}
              </div>
              {hasNextPage && (
                <div
                  ref={scrollRef}
                  className="p-4 text-center text-sm text-muted-foreground"
                >
                  {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}