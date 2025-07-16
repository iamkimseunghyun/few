'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/trpc';
import { EventCardSkeleton } from '@/modules/shared/ui/components/SkeletonLoader';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { EmptyState } from '@/modules/shared/ui/components/EmptyState';
import { type EventWithStats } from '../types';
import { useAuth } from '@clerk/nextjs';

export function EventsListPage() {
  const [category, setCategory] = useState<string>('all');
  const { isSignedIn } = useAuth();
  const {
    data,
    isLoading,
    error,
    refetch,
  } = api.events.getAll.useQuery();

  // API 응답에서 items 배열 추출
  const eventsList = data?.items || [];

  const filteredEvents = eventsList.filter((event: EventWithStats) => {
    if (!event) return false;
    if (category === 'all') return true;
    return event.category === category;
  });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <ErrorMessage
          title="이벤트를 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요."
          onRetry={() => refetch()}
          fullScreen
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            이벤트
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            다양한 공연과 페스티벌을 확인하고 리뷰를 남겨보세요.
          </p>
        </div>
        {isSignedIn && (
          <Link
            href="/reviews/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
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

      {/* 카테고리 필터 */}
      <div className="mb-6 flex gap-2 overflow-x-auto sm:mb-8">
        <button
          onClick={() => setCategory('all')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
            category === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setCategory('festival')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
            category === 'festival'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          페스티벌
        </button>
        <button
          onClick={() => setCategory('concert')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            category === 'concert'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          콘서트
        </button>
      </div>

      {/* 이벤트 그리드 */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="space-y-4 sm:grid sm:gap-6 sm:grid-cols-2 sm:space-y-0 lg:grid-cols-3">
          {filteredEvents.map((event: EventWithStats) => (
            <article
              key={event.id}
              className="bg-white border-b sm:border sm:rounded-lg sm:overflow-hidden sm:hover:shadow-lg sm:transition-all"
            >
              {/* 모바일: 인스타그램 스타일 헤더 */}
              <div className="flex items-center justify-between p-3 sm:hidden">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {event.category === 'festival' ? 'F' : 'C'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{event.name}</h3>
                    {event.location && (
                      <p className="text-xs text-gray-600">{event.location}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  상세보기
                </Link>
              </div>
              
              {/* 이미지 영역 */}
              <Link
                href={`/events/${event.id}`}
                className="block relative aspect-square sm:aspect-[16/9] overflow-hidden bg-gray-100"
              >
                {event.posterUrl ? (
                  <Image
                    src={event.posterUrl}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform sm:group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12"
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
                  </div>
                )}
              </Link>
              
              {/* 모바일: 인스타그램 스타일 정보 영역 */}
              <div className="p-3 sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{event.reviewCount || 0} 리뷰</span>
                    {event.avgRating > 0 && (
                      <span className="text-sm text-gray-600">★ {event.avgRating.toFixed(1)}</span>
                    )}
                  </div>
                  {event.dates && (
                    <p className="text-xs text-gray-600">
                      {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                {isSignedIn && (
                  <Link
                    href={`/events/${event.id}`}
                    className="block w-full text-center py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    리뷰 작성하기
                  </Link>
                )}
              </div>
              
              {/* 데스크탑: 기존 스타일 정보 영역 */}
              <div className="hidden sm:block p-4 sm:p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 hover:text-black text-sm sm:text-base">
                    {event.name}
                  </h3>
                  {event.category && (
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {event.category === 'festival' ? '페스티벌' : '콘서트'}
                    </span>
                  )}
                </div>
                {event.location && (
                  <p className="mb-2 text-xs text-gray-600 sm:text-sm">
                    📍 {event.location}
                  </p>
                )}
                {event.dates && (
                  <p className="text-sm text-gray-600">
                    📅{' '}
                    {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                    {event.dates.end !== event.dates.start &&
                      ` - ${new Date(event.dates.end).toLocaleDateString(
                        'ko-KR',
                        {
                          month: 'long',
                          day: 'numeric',
                        }
                      )}`}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <span>{event.reviewCount || 0} 리뷰</span>
                  {event.avgRating > 0 && (
                    <span>★ {event.avgRating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
          title={
            category === 'all'
              ? '아직 등록된 이벤트가 없습니다'
              : `${category === 'festival' ? '페스티벌' : '콘서트'}가 없습니다`
          }
          description="곧 새로운 이벤트가 등록될 예정입니다"
        />
      )}
      
      {/* 모바일 플로팅 액션 버튼 */}
      {isSignedIn && (
        <Link
          href="/reviews/new"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 sm:hidden"
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
