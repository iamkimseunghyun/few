'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { ReviewCard } from '@/modules/reviews';
import Image from 'next/image';

export function ProfilePage() {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'reviews' | 'bookmarks' | 'events'>(
    'reviews'
  );

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = api.reviews.getUserReviews.useQuery(undefined, {
    enabled: !!userId,
    retry: false,
  });

  const {
    data: bookmarkedData,
    isLoading: bookmarksLoading,
    error: bookmarksError,
  } = api.reviews.getBookmarked.useQuery(
    {},
    {
      enabled: !!userId,
      retry: false,
    }
  );

  const {
    data: bookmarkedEventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = api.events.getBookmarked.useQuery(
    {},
    {
      enabled: !!userId,
      retry: false,
    }
  );

  // Fetch reviewer stats
  const { data: reviewerStats } = api.reviewsEnhanced.getReviewerStats.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    }
  );

  // Early return if auth is not loaded
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!isSignedIn || !userId) {
    redirect('/sign-in');
  }

  const bookmarkedReviews = bookmarkedData?.items || [];
  const bookmarkedEvents = bookmarkedEventsData?.items || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">
        내 프로필
      </h1>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
              프로필 정보
            </h2>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.username || '프로필'}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-600">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      {user.username || '사용자'}
                      {reviewerStats?.reviewerLevel && (
                        <span className="text-sm">
                          {getReviewerLevelBadge(reviewerStats.reviewerLevel)}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        가입일
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('ko-KR')
                          : '알 수 없음'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        작성한 리뷰
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {reviewerStats?.reviewCount || reviews?.length || 0}개
                      </dd>
                    </div>
                    {reviewerStats && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            받은 좋아요
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {reviewerStats.totalLikesReceived}개
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            베스트 리뷰
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {reviewerStats.bestReviewCount}개
                          </dd>
                        </div>
                      </>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        북마크한 리뷰
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {bookmarkedReviews.length}개
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                내가 작성한 리뷰 ({reviews?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === 'bookmarks'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                북마크한 리뷰 ({bookmarkedReviews.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                관심 이벤트 ({bookmarkedEvents.length})
              </button>
            </nav>
          </div>

          {activeTab === 'reviews' ? (
            reviewsLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>
            ) : reviewsError ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg text-red-600">
                    리뷰를 불러오는 중 오류가 발생했습니다
                  </p>
                  <p className="text-sm text-gray-600">
                    잠시 후 다시 시도해주세요
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews && reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-gray-200 bg-white"
                    >
                      <ReviewCard review={review} />
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-lg text-gray-900">
                        아직 작성한 리뷰가 없습니다
                      </p>
                      <p className="text-sm text-gray-600">
                        이벤트에 참여하고 첫 리뷰를 작성해보세요!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : activeTab === 'bookmarks' ? (
            bookmarksLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            </div>
          ) : bookmarksError ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-lg text-red-600">
                  북마크를 불러오는 중 오류가 발생했습니다
                </p>
                <p className="text-sm text-gray-600">
                  잠시 후 다시 시도해주세요
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarkedReviews.length > 0 ? (
                bookmarkedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-gray-200 bg-white"
                  >
                    <ReviewCard review={review} />
                  </div>
                ))
              ) : (
                <div className="flex min-h-[40vh] items-center justify-center">
                  <div className="text-center">
                    <p className="mb-2 text-lg text-gray-900">
                      아직 북마크한 리뷰가 없습니다
                    </p>
                    <p className="text-sm text-gray-600">
                      마음에 드는 리뷰를 북마크해보세요!
                    </p>
                  </div>
                </div>
              )}
            </div>
            )
          ) : activeTab === 'events' ? (
            eventsLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>
            ) : eventsError ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg text-red-600">
                    이벤트를 불러오는 중 오류가 발생했습니다
                  </p>
                  <p className="text-sm text-gray-600">
                    잠시 후 다시 시도해주세요
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedEvents.length > 0 ? (
                  bookmarkedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                            {event.name}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {event.dates?.start && (
                              <p>
                                📅 {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {event.dates.end && event.dates.end !== event.dates.start && (
                                  <span>
                                    {' ~ '}
                                    {new Date(event.dates.end).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                              </p>
                            )}
                            {event.location && <p>📍 {event.location}</p>}
                          </div>
                        </div>
                        {event.category && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                            {event.category}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-lg text-gray-900">
                        아직 관심 이벤트가 없습니다
                      </p>
                      <p className="text-sm text-gray-600">
                        참가하고 싶은 이벤트를 북마크해보세요!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
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
