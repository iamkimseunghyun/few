'use client';

import { EventCalendar } from '@/modules/events/components/EventCalendar';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { type ReviewWithDetails } from '@/modules/reviews/types';
import { BestReviewsSection } from './BestReviewsSection';
import '@/modules/events/styles/calendar.css';

export function HomePage() {
  // Fetch recent reviews
  const { data: recentReviews } = api.reviews.getAll.useQuery({
    limit: 3,
  });

  // Fetch upcoming events
  const { data: upcomingEvents } = api.events.getUpcoming.useQuery({
    limit: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              페스티벌 & 공연 캘린더
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-purple-100 sm:text-xl">
              한눈에 보는 공연 일정, 생생한 리뷰와 함께
            </p>
          </div>
        </div>
      </section>

      {/* Main Calendar Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <EventCalendar />
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-t border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/events"
              className="group rounded-lg border border-gray-200 p-6 text-center transition-all hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-2 text-purple-600">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">이벤트 목록</h3>
              <p className="mt-1 text-sm text-gray-600">모든 공연과 페스티벌 확인</p>
            </Link>

            <Link
              href="/reviews"
              className="group rounded-lg border border-gray-200 p-6 text-center transition-all hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-2 text-purple-600">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">리뷰 커뮤니티</h3>
              <p className="mt-1 text-sm text-gray-600">생생한 공연 후기 읽기</p>
            </Link>

            <Link
              href="/reviews/new"
              className="group rounded-lg border border-gray-200 p-6 text-center transition-all hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-2 text-purple-600">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">리뷰 작성</h3>
              <p className="mt-1 text-sm text-gray-600">나의 공연 경험 공유하기</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Reviews */}
      <BestReviewsSection />

      {/* Recent Reviews & Upcoming Events */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Recent Reviews */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">최근 리뷰</h2>
                <Link
                  href="/reviews"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  리뷰 모두 보기 →
                </Link>
              </div>
              <div className="space-y-4">
                {recentReviews?.items && recentReviews.items.length > 0 ? (
                  recentReviews.items.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <Link href={`/reviews/${review.id}`} className="block group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {review.title && (
                              <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                {review.title}
                              </h3>
                            )}
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{review.content}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.overallRating ? 'fill-yellow-400' : 'fill-gray-200'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{review.user?.username || '익명'}</span>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">아직 리뷰가 없습니다.</p>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">다가오는 이벤트</h2>
                <Link
                  href="/events"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  이벤트 모두 보기 →
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingEvents?.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block group border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                          {event.name}
                        </h3>
                        <div className="mt-2 space-y-1">
                          {event.dates?.start && (
                            <p className="text-sm text-gray-600">
                              📅 {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-sm text-gray-600">📍 {event.location}</p>
                          )}
                        </div>
                      </div>
                      {event.category && (
                        <span className="ml-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </Link>
                )) || (
                  <p className="text-center text-gray-500 py-8">예정된 이벤트가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}