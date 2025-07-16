'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc';
import { useInfiniteScroll } from '@/modules/shared/hooks/useInfiniteScroll';
import { ReviewCardEnhanced } from './ReviewCardEnhanced';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ReviewCardSkeleton } from '@/modules/shared/ui/components/SkeletonLoader';
import { type ReviewWithDetails } from '../types';

export function ReviewsListPageEnhanced() {
  const { isSignedIn } = useAuth();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'helpful' | 'highRating' | 'lowRating'>('latest');
  const [filters, setFilters] = useState({
    minRating: undefined as number | undefined,
    hasImages: false,
  });
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.reviews.getAll.useInfiniteQuery(
    {
      limit: 20,
      sortBy,
      minRating: filters.minRating,
      hasImages: filters.hasImages,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Flatten all pages of data
  const reviews = data?.pages.flatMap((page) => page.items) ?? [];

  // Infinite scroll hook
  const { ref: observerTarget } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전체 리뷰</h1>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ErrorMessage 
          title="리뷰를 불러올 수 없습니다" 
          message={error?.message || '잠시 후 다시 시도해주세요'}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">전체 리뷰</h1>
          {isSignedIn && (
            <Link
              href="/reviews/new"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white transition-colors hover:bg-gray-800"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              리뷰 작성
            </Link>
          )}
        </div>

        {/* 필터 및 정렬 옵션 */}
        <div className="space-y-4">
          {/* 정렬 옵션 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">정렬:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'latest', label: '최신순' },
                { value: 'popular', label: '인기순' },
                { value: 'helpful', label: '도움순' },
                { value: 'highRating', label: '평점 높은순' },
                { value: 'lowRating', label: '평점 낮은순' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as typeof sortBy)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 필터 옵션 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">최소 평점:</label>
              <select
                value={filters.minRating || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value ? Number(e.target.value) : undefined }))}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">전체</option>
                <option value="5">5점만</option>
                <option value="4">4점 이상</option>
                <option value="3">3점 이상</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.hasImages}
                onChange={(e) => setFilters(prev => ({ ...prev, hasImages: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="font-medium text-gray-700">사진 포함 리뷰만</span>
            </label>
          </div>
        </div>
      </div>

      {/* 베스트 리뷰 섹션 */}
      <BestReviewsSection />

      {/* 리뷰 목록 */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="리뷰가 없습니다"
            description={filters.hasImages || filters.minRating 
              ? "필터 조건에 맞는 리뷰가 없습니다" 
              : "첫 리뷰를 작성해보세요!"}
            action={
              isSignedIn && !filters.hasImages && !filters.minRating ? (
                <Link
                  href="/reviews/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
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
                  리뷰 작성하기
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <ReviewCardEnhanced review={review as ReviewWithDetails} />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))}
              </div>
            )}
            <div ref={observerTarget} className="h-10" />
          </>
        )}
      </div>

      {/* Mobile FAB */}
      {isSignedIn && (
        <Link
          href="/reviews/new"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:bg-gray-800 sm:hidden"
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

// 베스트 리뷰 섹션 컴포넌트
function BestReviewsSection() {
  const { data: bestReviews, isLoading } = api.reviewsEnhanced.getBestReviews.useQuery({
    limit: 3,
  });

  if (isLoading || !bestReviews || bestReviews.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
        <span>🏆</span> 베스트 리뷰
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {bestReviews.map((review) => (
          <Link
            key={review.id}
            href={`/reviews/${review.id}`}
            className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 transition-all hover:border-yellow-300 hover:shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900">
                {review.user?.username || '알 수 없음'}
              </div>
              {review.user?.reviewerLevel && (
                <span className="text-xs text-gray-600">
                  {getReviewerLevelBadge(review.user.reviewerLevel)}
                </span>
              )}
            </div>
            <h3 className="mb-1 font-semibold text-gray-900 line-clamp-1">
              {review.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {review.content}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span>❤️ {review.likeCount}</span>
              <span>💬 {review.commentCount}</span>
              <span>👍 {review.helpfulCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getReviewerLevelBadge(level: string) {
  const badges = {
    seedling: '🌱 새싹',
    regular: '🌿 일반',
    expert: '🌳 우수',
    master: '⭐ 전문',
  };
  return badges[level as keyof typeof badges] || '';
}