'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { DiaryCard } from './DiaryCard';
import { LoadingSpinner } from '@/modules/shared/ui/components/LoadingSpinner';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { DiaryListSkeleton } from './DiaryListSkeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UsersIcon } from '@heroicons/react/24/outline';

interface DiaryFeedProps {
  userId?: string;
}

export function DiaryFeed({ userId }: DiaryFeedProps) {
  const { userId: currentUserId } = useAuth();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = api.musicDiary.getFeed.useInfiniteQuery(
    {
      limit: 10,
      userId,
      feedType,
      sortBy: 'recent', // Always use recent sort
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !userId || !!currentUserId || feedType === 'all', // Disable following feed if not logged in
    }
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <DiaryListSkeleton />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="피드를 불러올 수 없습니다"
        message="네트워크 연결을 확인하고 다시 시도해주세요."
        onRetry={() => refetch()}
      />
    );
  }

  const allDiaries = data?.pages.flatMap((page) => page.items) || [];

  if (allDiaries.length === 0) {
    // Different empty states based on feed type
    if (feedType === 'following' && currentUserId) {
      return (
        <>
          {/* Keep the filter tabs visible */}
          {!userId && currentUserId && (
            <div className="bg-white border-b sticky top-[60px] z-10">
              <div className="flex">
                <button
                  onClick={() => setFeedType('all')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    (feedType as string) === 'all'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFeedType('following')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    (feedType as string) === 'following'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  팔로잉
                </button>
              </div>
            </div>
          )}
          
          <EmptyState
            icon={<UsersIcon className="w-12 h-12" />}
            title="팔로우한 사용자의 다이어리가 없습니다"
            description="다른 사용자를 팔로우하고 그들의 음악 이야기를 들어보세요!"
            actionLabel="전체 피드 보기"
            onAction={() => setFeedType('all')}
          />
        </>
      );
    }
    
    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
        title="아직 음악 다이어리가 없습니다"
        description="첫 번째 음악 다이어리를 작성해보세요!"
        actionLabel="다이어리 작성하기"
        actionHref="/diary/new"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs - Only show on main feed, not user profiles */}
      {!userId && currentUserId && (
        <div className="bg-white border-b sticky top-[60px] z-10">
          <div className="flex">
            <button
              onClick={() => setFeedType('all')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                feedType === 'all'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFeedType('following')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                feedType === 'following'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              팔로잉
            </button>
          </div>
        </div>
      )}

      {/* Diary Cards */}
      <div className="space-y-4 sm:space-y-6">
        {allDiaries.map((item) => (
          <DiaryCard
            key={item.diary.id}
            diary={item.diary}
            user={item.user}
            isLiked={item.isLiked}
            isSaved={item.isSaved}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={ref} className="py-4">
          {isFetchingNextPage && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}
      
      {/* End of feed message */}
      {!hasNextPage && allDiaries.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          모든 다이어리를 확인했습니다
        </div>
      )}
    </div>
  );
}