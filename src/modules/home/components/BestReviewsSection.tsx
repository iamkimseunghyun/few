'use client';

import Link from 'next/link';
import { api } from '@/lib/trpc';

export function BestReviewsSection() {
  const { data: bestReviews, isLoading } = api.reviewsEnhanced.getBestReviews.useQuery({
    limit: 4,
  });

  if (isLoading || !bestReviews || bestReviews.length === 0) {
    return null;
  }

  return (
    <section className="bg-yellow-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <span>🏆</span> 베스트 리뷰
          </h2>
          <p className="mt-2 text-gray-600">우리의 취향 커뮤니티가 선정한 최고의 리뷰</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {bestReviews.map((review) => (
            <Link
              key={review.id}
              href={`/reviews/${review.id}`}
              className="group rounded-lg border border-yellow-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-yellow-300"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="text-sm font-medium text-gray-900">
                  {review.user?.username || '알 수 없음'}
                </div>
                {review.user?.reviewerLevel && (
                  <span className="text-xs text-gray-600">
                    {getReviewerLevelBadge(review.user.reviewerLevel)}
                  </span>
                )}
              </div>
              
              <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                {review.title}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {review.content}
              </p>

              {review.eventName && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                  {review.eventName}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="text-red-500">❤️</span>
                  {review.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <span>💬</span>
                  {review.commentCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-500">👍</span>
                  {review.helpfulCount}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/reviews?sortBy=helpful"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            베스트 리뷰 더보기
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function getReviewerLevelBadge(level: string) {
  const badges = {
    seedling: '🌱',
    regular: '🌿',
    expert: '🌳',
    master: '⭐',
  };
  return badges[level as keyof typeof badges] || '';
}