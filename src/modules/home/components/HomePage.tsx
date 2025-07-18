'use client';

import { useCachedEvents, useCachedReviews } from '@/hooks/use-cached-query';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
// import { prefetchHomeData } from '@/lib/prefetch-utils';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { type EventCategory } from '@/lib/db/schema';
import '@/modules/events/styles/calendar.css';

// 동적 import로 초기 로딩 시간 단축
const EventCalendar = dynamic(
  () => import('@/modules/events/components/EventCalendar'),
  { 
    loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />,
    ssr: true 
  }
);

const BestReviewsSection = dynamic(
  () => import('./BestReviewsSection').then(mod => mod.BestReviewsSection),
  { ssr: true }
);

// 카테고리 한글 변환 매핑
const categoryLabels: Record<EventCategory, string> = {
  festival: '페스티벌',
  concert: '콘서트',
  overseas_tour: '내한공연',
  performance: '공연',
  exhibition: '전시',
};

export function HomePage() {
  const queryClient = useQueryClient();
  
  // 홈페이지 데이터 프리페칭
  useEffect(() => {
    // void prefetchHomeData(queryClient);
  }, [queryClient]);
  
  // 캐싱된 쿼리 사용
  const { data: recentReviews } = useCachedReviews.list({
    limit: 3,
  });

  const { data: upcomingEvents } = useCachedEvents.upcoming();

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

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                다가오는 이벤트
              </h2>
              <Link
                href="/events"
                className="text-purple-600 hover:text-purple-700"
              >
                모두 보기 →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {event.posterUrl && (
                    <div className="aspect-video overflow-hidden">
                      <Image
                        src={event.posterUrl}
                        alt={event.name}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                      {categoryLabels[event.category as EventCategory] || event.category}
                    </span>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                      {event.name}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{event.location}</span>
                      <span>
                        {event.dates?.start ? new Date(event.dates.start).toLocaleDateString('ko-KR') : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Reviews Section */}
      <BestReviewsSection />

      {/* Recent Reviews */}
      {recentReviews && recentReviews.items && recentReviews.items.length > 0 && (
        <section className="bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                최신 리뷰
              </h2>
              <Link
                href="/reviews"
                className="text-purple-600 hover:text-purple-700"
              >
                모두 보기 →
              </Link>
            </div>
            <div className="space-y-6">
              {recentReviews.items.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900">
                        {review.event?.name || review.eventName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        작성자: {review.user?.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 text-2xl font-bold text-purple-600">
                        {review.overallRating}/5
                      </div>
                      <div className="text-xs text-gray-500">종합 평점</div>
                    </div>
                  </div>
                  <p className="mb-4 text-gray-700 line-clamp-3">
                    {review.content}
                  </p>
                  <Link
                    href={`/reviews/${review.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    리뷰 전체 보기 →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-purple-700 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            당신의 공연 경험을 공유해주세요
          </h2>
          <p className="mb-8 text-lg text-purple-100">
            생생한 후기로 다른 관객들에게 도움을 주세요
          </p>
          <Link
            href="/reviews/new"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            리뷰 작성하기
          </Link>
        </div>
      </section>
    </div>
  );
}