'use client';

import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/trpc';
import { DiaryCard } from './DiaryCard';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { DiaryListSkeleton } from './DiaryListSkeleton';
import { useAuth } from '@clerk/nextjs';
import { UsersIcon } from '@heroicons/react/24/outline';
import { VirtualizedInfiniteFeed } from '@/modules/shared/ui/components/VirtualizedInfiniteFeed';

interface DiaryFeedProps {
  userId?: string;
}

export function DiaryFeed({ userId }: DiaryFeedProps) {
  const { userId: currentUserId } = useAuth();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

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
      limit: 20, // 가상화로 더 많은 아이템 로드 가능
      userId,
      feedType,
      sortBy: 'recent',
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !userId || !!currentUserId || feedType === 'all',
    }
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 모든 다이어리 데이터를 플랫 배열로 변환
  const allDiaries = useMemo(
    () => data?.pages.flatMap((page) => page.items) || [],
    [data]
  );

  // 다이어리 카드 렌더링 함수
  const renderDiaryCard = useCallback(
    (item: NonNullable<typeof data>['pages'][0]['items'][0]) => (
      <DiaryCard
        key={item.diary.id}
        diary={item.diary}
        user={item.user}
        isLiked={item.isLiked}
        isSaved={item.isSaved}
      />
    ),
    []
  );

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderItem = (item: NonNullable<typeof data>['pages'][0]['items'][0], index: number) => (
      renderDiaryCard(item)
  );

  if (allDiaries.length === 0) {
    if (userId && userId !== currentUserId) {
      return (
        <EmptyState
          icon={<UsersIcon />}
          title="아직 작성한 다이어리가 없습니다"
          description="이 사용자가 음악 일기를 작성하면 여기에 표시됩니다."
        />
      );
    }

    if (feedType === 'following') {
      return (
        <EmptyState
          icon={<UsersIcon />}
          title="팔로잉 피드가 비어있습니다"
          description="팔로우한 사용자들의 다이어리가 여기에 표시됩니다."
          actionLabel="전체 피드 보기"
          onAction={() => setFeedType('all')}
        />
      );
    }

    return (
      <EmptyState
        icon={<UsersIcon />}
        title="아직 다이어리가 없습니다"
        description="첫 번째 음악 일기를 작성해보세요!"
        actionLabel="다이어리 작성"
        actionHref="/music-diary/new"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 피드 타입 선택 (본인 프로필이 아닐 때만) */}
      {!userId && currentUserId && (
        <div className="flex gap-2">
          <button
            onClick={() => setFeedType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              feedType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              feedType === 'following'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            팔로잉
          </button>
        </div>
      )}

      {/* 가상화된 무한 스크롤 피드 */}
      <VirtualizedInfiniteFeed
        items={allDiaries}
        renderItem={renderItem}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        itemHeight={600} // 다이어리 카드 예상 높이
        overscan={2}
      />
    </div>
  );
}