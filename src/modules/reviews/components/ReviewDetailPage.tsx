'use client';

import { api } from '@/lib/trpc';
import { ReviewCard } from './ReviewCard';
import { CommentSection } from './CommentSection';
import Link from 'next/link';
import { type ReviewWithDetails } from '../types';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ReviewDetailPageProps {
  reviewId: string;
}

export function ReviewDetailPage({ reviewId }: ReviewDetailPageProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: review, isLoading } = api.reviews.getById.useQuery({
    id: reviewId,
  });
  
  const deleteReview = api.reviews.delete.useMutation({
    onSuccess: () => {
      router.push('/');
    },
  });
  
  const handleDelete = async () => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteReview.mutateAsync({ id: reviewId });
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert('리뷰 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isAuthor = userId && review?.userId === userId;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
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
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 underline"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        {review.event ? (
          <Link
            href={`/events/${review.event.id}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← {review.event.name}로 돌아가기
          </Link>
        ) : (
          <Link
            href="/reviews"
            className="text-gray-600 hover:text-gray-900"
          >
            ← 리뷰 목록으로 돌아가기
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <ReviewCard review={review as ReviewWithDetails} />
        {isAuthor && (
          <div className="border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
            <Link
              href={`/reviews/${reviewId}/edit`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CommentSection reviewId={reviewId} />
      </div>
    </div>
  );
}
