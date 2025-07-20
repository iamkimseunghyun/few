'use client';

import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/trpc';
import { DiaryCard } from './DiaryCard';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { DiaryListSkeleton } from './DiaryListSkeleton';
import { useAuth } from '@clerk/nextjs';
import { UsersIcon } from '@heroicons/react/24/outline';
import { InfiniteFeed } from '@/modules/shared/ui/components/InfiniteFeed';

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


  if (allDiaries.length === 0) {
    if (userId && userId !== currentUserId) {
      return (
        <EmptyState
          icon={<UsersIcon />}
          title="아직 작성한 순간이 없습니다"
          description="이 사용자가 순간을 기록하면 여기에 표시됩니다."
        />
      );
    }

    if (feedType === 'following') {
      return (
        <EmptyState
          icon={<UsersIcon />}
          title="팔로잉 피드가 비어있습니다"
          description="팔로우한 사용자들의 순간이 여기에 표시됩니다."
          actionLabel="전체 피드 보기"
          onAction={() => setFeedType('all')}
        />
      );
    }

    return (
      <EmptyState
        icon={<UsersIcon />}
        title="아직 순간이 없습니다"
        description="첫 번째 순간을 기록해보세요!"
        actionLabel="순간 기록"
        actionHref="/music-diary/new"
      />
    );
  }

  return (
    <>
      {/* 정렬 탭 */}
      {!userId && currentUserId && (
        <div className="mb-6 border-b border-border">
          <div className="flex gap-6">
            <button
              onClick={() => setFeedType('all')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                feedType === 'all'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              전체
              {feedType === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              onClick={() => setFeedType('following')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                feedType === 'following'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              팔로잉
              {feedType === 'following' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 다이어리 목록 */}
      <InfiniteFeed
        items={allDiaries}
        renderItem={(item) => (
          <div key={item.diary.id} className="mb-4 last:mb-0">
            {renderDiaryCard(item)}
          </div>
        )}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        loader={<DiaryListSkeleton />}
      />
    </>
  );
}
