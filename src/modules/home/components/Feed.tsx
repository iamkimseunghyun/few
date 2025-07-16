'use client';

import { api } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { ReviewCardSkeleton } from '@/modules/shared/ui/components/SkeletonLoader';

export function Feed() {
  const {
    data: feedData,
    isLoading,
    error,
    refetch,
  } = api.home.getFeed.useQuery({});

  if (isLoading) {
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
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage
          title="피드를 불러올 수 없습니다"
          message="잠시 후 다시 시도해주세요."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!feedData?.items || feedData.items.length === 0) {
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="divide-y divide-gray-100">
        {feedData.items.map((item) => (
          <div key={item.id} className="py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Author Avatar */}
                {item.author.imageUrl ? (
                  <Image
                    src={item.author.imageUrl}
                    alt={item.author.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {item.author.username[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  {/* Author & Event Info */}
                  <div className="mb-2">
                    <span className="font-medium text-gray-900">
                      {item.author.username}
                    </span>
                    <span className="mx-1 text-gray-400">·</span>
                    <Link
                      href={`/events/${item.event.id}`}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      {item.event.name}
                    </Link>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < item.overallRating
                            ? 'fill-yellow-400'
                            : 'fill-gray-200'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Content */}
                  <Link
                    href={`/reviews/${item.id}`}
                    className="block group"
                  >
                    <p className="text-gray-700 line-clamp-3 group-hover:text-gray-900 transition-colors">
                      {item.content}
                    </p>
                  </Link>

                  {/* Images */}
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {item.imageUrls.slice(0, 3).map((url, idx) => (
                        <div key={idx} className="relative h-24 w-full">
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      <svg
                        className={`h-4 w-4 ${
                          item.stats.isLiked ? 'fill-red-500' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{item.stats.likeCount}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-gray-700">
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
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      <span>{item.stats.commentCount}</span>
                    </button>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {feedData.nextCursor && (
        <div className="py-6 text-center">
          <button className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}