'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect, useRouter } from 'next/navigation';
import { ReviewForm } from './ReviewForm';
import { api } from '@/lib/trpc';
import { LoadingSpinner } from '@/modules/shared';

interface EditReviewPageProps {
  reviewId: string;
}

export function EditReviewPage({ reviewId }: EditReviewPageProps) {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();

  const { data: review, isLoading } = api.reviews.getById.useQuery({
    id: reviewId,
  });

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            리뷰를 찾을 수 없습니다
          </h1>
        </div>
      </div>
    );
  }

  // 작성자가 아닌 경우
  if (review.userId !== userId) {
    redirect(`/reviews/${reviewId}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">리뷰 수정</h1>
        <p className="text-gray-600">리뷰 내용을 수정할 수 있습니다.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ReviewForm
          reviewId={reviewId}
          initialData={{
            title: review.title,
            eventId: review.eventId || undefined,
            eventName: review.event?.name || review.title,
            overallRating: review.overallRating,
            soundRating: review.soundRating || undefined,
            viewRating: review.viewRating || undefined,
            safetyRating: review.safetyRating || undefined,
            operationRating: review.operationRating || undefined,
            seatOrArea: review.seatOrArea || '',
            content: review.content,
            tags: review.tags?.join(', ') || '',
            imageUrls: review.imageUrls || [],
            mediaItems: review.mediaItems || [],
          }}
          onSuccess={() => {
            router.push(`/reviews/${reviewId}`);
          }}
        />
      </div>
    </div>
  );
}
