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

export function ReviewsListPage() {
  const { isSignedIn } = useAuth();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            모든 리뷰
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            다양한 공연과 페스티벌에 대한 생생한 후기들을 만나보세요.
          </p>
        </div>
        {isSignedIn && (
          <Link
            href="/reviews/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            리뷰 작성
          </Link>
        )}
      </div>

      {/* 정렬 탭 */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setSortBy('latest')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              sortBy === 'latest'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            최신순
            {sortBy === 'latest' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              sortBy === 'popular'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            인기순
            {sortBy === 'popular' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* 리뷰 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </div>
      ) : reviews.length > 0 ? (
        <InfiniteFeed
          items={reviews.map(review => ({
            ...review,
            isLiked: false,
            isBookmarked: false,
            eventName: review.eventName || undefined
          } as ReviewWithDetails))}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
          renderItem={(review: ReviewWithDetails) => (
            <div key={review.id} className="mb-4 last:mb-0">
              <ReviewCard review={review} />
            </div>
          )}
          loader={<ReviewCardSkeleton />}
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
          title="아직 작성된 리뷰가 없습니다"
          description={
            isSignedIn
              ? '첫 번째 리뷰를 작성해보세요!'
              : '로그인하고 첫 번째 리뷰를 작성해보세요!'
          }
          action={
            isSignedIn ? (
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                리뷰 작성하기
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                로그인하기
              </Link>
            )
          }
        />
      )}

      {/* 모바일 플로팅 액션 버튼 */}
      {isSignedIn && (
        <Link
          href="/reviews/new"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 sm:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}
