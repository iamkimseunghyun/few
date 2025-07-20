'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { ReviewCard } from './ReviewCard';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ReviewCardSkeleton } from '@/modules/shared/ui/components/SkeletonLoader';
import { type ReviewWithDetails } from '../types';
import { InfiniteFeed } from '@/modules/shared/ui/components/InfiniteFeed';
import { PullToRefresh } from '@/components/PullToRefresh';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { 
  PlusIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function ReviewsListPage() {
  const { isSignedIn } = useAuth();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = api.reviews.getAll.useInfiniteQuery(
    {
      limit: 20,
      sortBy,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    }
  );

  const reviews = data?.pages.flatMap((page) => page.items) ?? [];

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <ErrorMessage
          title="리뷰를 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요."
          onRetry={() => refetch()}
          fullScreen
        />
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      <div className="min-h-screen bg-background">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* 로고/타이틀 */}
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  기록
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                </span>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-2">
                {isSignedIn && (
                  <Link
                    href="/reviews/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">새 기록</span>
                  </Link>
                )}
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 네비게이션 탭 */}
            <div className="flex items-center">
              <nav className="flex gap-1">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    sortBy === 'latest' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  최신순
                  {sortBy === 'latest' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                  )}
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    sortBy === 'popular' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  인기순
                  {sortBy === 'popular' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                  )}
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 리뷰 목록 */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
            </div>
          ) : reviews.length > 0 ? (
            <InfiniteFeed
              items={reviews.map(
                (review) =>
                  ({
                    ...review,
                    isLiked: false,
                    isBookmarked: false,
                    eventName: review.eventName || undefined,
                  }) as ReviewWithDetails
              )}
              onLoadMore={fetchNextPage}
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
              renderItem={(review: ReviewWithDetails) => (
                <div key={review.id} className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <ReviewCard review={review} />
                </div>
              )}
              loader={
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                </div>
              }
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            />
          ) : (
            <EmptyState
              icon={
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              }
              title="아직 작성된 기록이 없습니다"
              description={
                isSignedIn
                  ? '첫 번째 기록을 작성해보세요!'
                  : '로그인하고 첫 번째 기록을 작성해보세요!'
              }
              action={
                isSignedIn ? (
                  <Link
                    href="/reviews/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    기록 작성하기
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    로그인하기
                  </Link>
                )
              }
            />
          )}
        </main>

        {/* 모바일 플로팅 액션 버튼 */}
        {isSignedIn && (
          <FloatingActionButton
            href="/reviews/new"
            ariaLabel="기록 작성하기"
            className="sm:hidden"
          >
            <PlusIcon className="h-6 w-6" />
          </FloatingActionButton>
        )}
      </div>
    </PullToRefresh>
  );
}
