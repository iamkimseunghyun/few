'use client';

import { api } from '@/lib/trpc';
import { ReviewCard } from '@/modules/reviews';
import { LoadingSpinner } from '@/modules/shared/ui/components/LoadingSpinner';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ReviewCardSkeleton } from '@/modules/shared/ui/components/SkeletonLoader';
import { useInfiniteScroll } from '@/modules/shared/hooks/useInfiniteScroll';
import { useEffect } from 'react';

export function InfiniteFeed() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = api.reviews.getAll.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => {
        // tRPC 직렬화로 인한 구조 처리
        const pageData = (lastPage as any)?.json || lastPage;
        return pageData?.nextCursor;
      },
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // 디버깅 로그 추가
  useEffect(() => {
    console.log('=== InfiniteFeed Debug ===');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('data:', data);
    console.log('data?.pages:', data?.pages);
    console.log('hasNextPage:', hasNextPage);

    if (data?.pages) {
      console.log('Total pages:', data.pages.length);
      data.pages.forEach((page, index) => {
        console.log(`Page ${index}:`, page);
        console.log(`Page ${index} items count:`, page.items?.length);
      });
    }
  }, [data, isLoading, error, hasNextPage]);

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: !isLoading && !error,
  });

  if (isLoading) {
    console.log('Showing loading skeleton...');
    return (
      <div className="mx-auto max-w-2xl">
        <div className="divide-y divide-gray-100">
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Showing error:', error);
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage
          title="피드를 불러올 수 없습니다"
          message={error.message || '잠시 후 다시 시도해주세요.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // 실제 작동하는 방식: page?.items가 undefined이므로 page?.json?.items 사용
  const allReviews =
    data?.pages.flatMap((page) => {
      const items = page?.items || (page as any)?.json?.items || [];
      return Array.isArray(items) ? items : [];
    }) ?? [];

  console.log('All reviews after flatMap:', allReviews);
  console.log('All reviews count:', allReviews.length);

  // Filter out any invalid reviews
  const validReviews = allReviews.filter((review) => review && review.id);
  console.log('Valid reviews:', validReviews);
  console.log('Valid reviews count:', validReviews.length);

  if (validReviews.length === 0) {
    console.log('Showing empty state...');
    return (
      <div className="mx-auto max-w-2xl">
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          }
          title="아직 리뷰가 없습니다"
          description="첫 번째 리뷰를 작성하고 경험을 공유해보세요!"
          actionLabel="리뷰 작성하기"
          actionHref="/reviews/new"
        />
      </div>
    );
  }

  console.log('Rendering reviews...');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="divide-y divide-gray-100">
        {validReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Loading trigger for infinite scroll */}
      <div ref={ref} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <LoadingSpinner size="sm" message="더 불러오는 중..." />
          </div>
        )}
      </div>
    </div>
  );
}
