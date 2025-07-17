'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { ReportDialog } from './ReportDialog';
import { BlurImage } from '@/modules/shared/ui/components/BlurImage';
import { type ReviewWithDetails } from '../types';
import { OptimizedImage } from '@/modules/shared';

interface ReviewCardProps {
  review: ReviewWithDetails;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { isSignedIn } = useAuth();
  const [likeCount, setLikeCount] = useState(review?.likeCount || 0);
  const [isLiked, setIsLiked] = useState(review?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(
    review?.isBookmarked || false
  );
  const [showReportDialog, setShowReportDialog] = useState(false);

  if (!review || !review.id) {
    return null;
  }

  const toggleLike = api.reviews.toggleLike.useMutation({
    onMutate: async () => {
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

      // Return context for rollback
      return { previousIsLiked: isLiked, previousLikeCount: likeCount };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context) {
        setIsLiked(context.previousIsLiked);
        setLikeCount(context.previousLikeCount);
      }
      alert('좋아요 처리에 실패했습니다.');
    },
    onSuccess: (data) => {
      // Update with actual server data
      setIsLiked(data.liked);
    },
  });

  const toggleBookmark = api.reviews.toggleBookmark.useMutation({
    onMutate: async () => {
      // Optimistic update
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);

      // Return context for rollback
      return { previousIsBookmarked: isBookmarked };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context) {
        setIsBookmarked(context.previousIsBookmarked);
      }
      alert('북마크 처리에 실패했습니다.');
    },
    onSuccess: (data) => {
      // Update with actual server data
      setIsBookmarked(data.bookmarked);
    },
  });

  const handleLike = () => {
    if (!isSignedIn) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }
    toggleLike.mutate({ reviewId: review.id });
  };

  const handleBookmark = () => {
    if (!isSignedIn) {
      alert('북마크하려면 로그인이 필요합니다.');
      return;
    }
    toggleBookmark.mutate({ reviewId: review.id });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-foreground' : 'fill-muted-foreground/30'
        }`}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <article className="border-b border-border bg-background p-4 last:border-0 sm:p-6">
      {review.isBestReview && (
        <div className="mb-2 flex items-center gap-1 text-sm font-medium text-yellow-600">
          <span>🏆</span> 베스트 리뷰
        </div>
      )}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted sm:h-10 sm:w-10">
            {review.user?.imageUrl ? (
              <OptimizedImage
                src={review.user.imageUrl}
                alt={review.user.username}
                fill
                className="object-cover"
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground sm:text-sm">
                {review.user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground text-sm sm:text-base">
              {review.user?.username || '\uc54c \uc218 \uc5c6\uc74c'}
            </p>
            {review.event && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {review.event.name}
              </p>
            )}
          </div>
        </div>
        <time className="text-xs text-muted-foreground sm:text-sm">
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('ko-KR')
            : ''}
        </time>
      </div>

      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-1">
          {renderStars(review.overallRating)}
        </div>
        {review.seatOrArea && (
          <span className="text-sm text-muted-foreground">
            {review.seatOrArea}
          </span>
        )}
      </div>

      <Link href={`/reviews/${review.id}`} className="block mb-4">
        {review.title && (
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {review.title}
          </h3>
        )}
        <p className="text-foreground/90 hover:text-foreground transition-colors">
          {review.content}
        </p>
      </Link>

      {review.imageUrls && review.imageUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {review.imageUrls.slice(0, 3).map((url, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <BlurImage
                src={url}
                alt={`리뷰 이미지 ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                quality={75}
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      )}

      {review.tags && review.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
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
            <span>{likeCount}</span>
          </button>

          <button
            onClick={handleBookmark}
            disabled={toggleBookmark.isPending}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 ${isBookmarked ? 'fill-foreground' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          <Link
            href={`/reviews/${review.id}`}
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{review.commentCount || 0}</span>
          </Link>
        </div>

        <button
          onClick={() => setShowReportDialog(true)}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground/80"
        >
          신고
        </button>
      </div>

      {showReportDialog && (
        <ReportDialog
          reviewId={review.id}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </article>
  );
}
