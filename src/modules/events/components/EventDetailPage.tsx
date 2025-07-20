"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/trpc";
import { EventDetail } from "./EventDetail";
import { ReviewCard, ReviewForm } from "@/modules/reviews";
import { useToast } from "@/modules/shared";
import type { ReviewWithDetails } from "@/modules/reviews/types";
import { trackEvent } from "@/lib/analytics";

export function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { isSignedIn } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { showToast } = useToast();

  const { data: event, isLoading: eventLoading } = api.events.getById.useQuery({
    id: eventId,
  });

  const { data: reviews, isLoading: reviewsLoading } = api.reviews.getAll.useQuery({
    eventId,
  });

  const { data: isBookmarked } = api.events.isBookmarked.useQuery(
    { id: eventId },
    { enabled: isSignedIn }
  );

  // 이벤트 상세 페이지 뷰 추적
  useEffect(() => {
    if (event) {
      trackEvent('view_event_detail', {
        eventId: event.id,
        eventName: event.name,
        category: event.category || 'unknown'
      });
    }
  }, [event]);

  const utils = api.useUtils();
  const toggleBookmark = api.events.toggleBookmark.useMutation({
    onMutate: async () => {
      // Optimistic update
      await utils.events.isBookmarked.cancel({ id: eventId });
      const previousValue = utils.events.isBookmarked.getData({ id: eventId });
      utils.events.isBookmarked.setData({ id: eventId }, !previousValue);
      return { previousValue };
    },
    onError: (err, newValue, context) => {
      // Rollback on error
      utils.events.isBookmarked.setData({ id: eventId }, context?.previousValue);
      showToast('북마크 처리에 실패했습니다.', 'error');
    },
    onSuccess: (data) => {
      showToast(
        data.bookmarked ? '북마크에 추가했습니다.' : '북마크를 해제했습니다.',
        'success'
      );
    },
    onSettled: () => {
      utils.events.isBookmarked.invalidate({ id: eventId });
    },
  });

  if (eventLoading || reviewsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            이벤트를 찾을 수 없습니다
          </h2>
          <Link
            href="/events"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            이벤트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* 왼쪽: 이벤트 정보 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            {isSignedIn && (
              <button
                onClick={() => toggleBookmark.mutate({ id: eventId })}
                disabled={toggleBookmark.isPending}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isBookmarked
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {toggleBookmark.isPending ? (
                  '처리 중...'
                ) : (
                  <>
                    <span className="mr-1">{isBookmarked ? '📌' : '📌'}</span>
                    {isBookmarked ? '관심 이벤트 해제' : '관심 이벤트 등록'}
                  </>
                )}
              </button>
            )}
          </div>
          <EventDetail event={event} />

          {/* 리뷰 통계 */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              리뷰 통계
            </h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {event.stats?.reviewCount || 0}
                </p>
                <p className="text-sm text-gray-600">전체 리뷰</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {event.stats?.avgRating ? event.stats.avgRating.toFixed(1) : "0.0"}
                </p>
                <p className="text-sm text-gray-600">전체 만족도</p>
              </div>
            </div>
          </div>

          {/* 리뷰 작성 버튼 */}
          <div className="mt-8">
            {isSignedIn ? (
              showReviewForm ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      리뷰 작성
                    </h3>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      취소
                    </button>
                  </div>
                  <ReviewForm
                    eventId={eventId}
                    onSuccess={() => {
                      setShowReviewForm(false);
                      // 리뷰 목록 새로고침
                      window.location.reload();
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowReviewForm(true);
                    trackEvent('start_review', { eventId });
                  }}
                  className="w-full rounded-lg bg-gray-900 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                >
                  리뷰 작성하기
                </button>
              )
            ) : (
              <Link
                href="/sign-in"
                className="block w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white transition-colors hover:bg-gray-800"
              >
                로그인하고 리뷰 작성하기
              </Link>
            )}
          </div>
        </div>

        {/* 오른쪽: 리뷰 목록 */}
        <div className="lg:col-span-1">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            리뷰 ({reviews?.items?.length || 0})
          </h2>
          <div className="space-y-4">
            {reviews?.items && reviews.items.length > 0 ? (
              reviews.items.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-200 bg-white"
                >
                  <ReviewCard review={{
                    ...review,
                    isLiked: false,
                    isBookmarked: false,
                    eventName: review.eventName || undefined
                  } as ReviewWithDetails} />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">
                아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}