'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import { ReportDialog } from './ReportDialog';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';
import { type ReviewWithDetails } from '../types';
import { trackEvent } from '@/lib/analytics';
import { TouchFeedback } from '@/components/TouchFeedback';
import { toast } from '@/modules/shared/hooks/useToast';
import { CommentSection } from './CommentSection';
import { useIsDesktop } from '@/modules/shared/hooks/useMediaQuery';
import { useRouter } from 'next/navigation';
import { 
  MapPinIcon,
  StarIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

interface ReviewCardProps {
  review: ReviewWithDetails;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [likeCount, setLikeCount] = useState(review?.likeCount || 0);
  const [isLiked, setIsLiked] = useState(review?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(
    review?.isBookmarked || false
  );
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  

  if (!review || !review.id) {
    return null;
  }

  const toggleLike = api.reviews.toggleLike.useMutation({
    onMutate: async () => {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
      return { previousIsLiked: isLiked, previousLikeCount: likeCount };
    },
    onError: (err, newData, context) => {
      if (context) {
        setIsLiked(context.previousIsLiked);
        setLikeCount(context.previousLikeCount);
      }
      toast.error('좋아요 처리에 실패했습니다.');
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      if (data.liked) {
        toast.success('좋아요를 눌렀습니다!');
        trackEvent('like_review', { reviewId: review.id });
      }
    },
  });

  const toggleBookmark = api.reviews.toggleBookmark.useMutation({
    onMutate: async () => {
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);
      return { previousIsBookmarked: isBookmarked };
    },
    onError: (err, newData, context) => {
      if (context) {
        setIsBookmarked(context.previousIsBookmarked);
      }
      toast.error('북마크 처리에 실패했습니다.');
    },
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      if (data.bookmarked) {
        toast.success('기록을 저장했습니다!');
      } else {
        toast.info('저장을 취소했습니다.');
      }
    },
  });

  const { mutate: deleteReview, isPending: isDeleting } = api.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.');
      window.location.reload();
    },
    onError: (error) => {
      toast.error('삭제에 실패했습니다.');
      console.error(error);
    },
  });

  const handleLike = () => {
    if (!isSignedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    toggleLike.mutate({ reviewId: review.id });
  };

  const handleBookmark = () => {
    if (!isSignedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    toggleBookmark.mutate({ reviewId: review.id });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: review.title || '공연 기록',
        text: review.content,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다.');
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted-foreground/20 text-muted-foreground/20'
        }`}
      />
    ));
  };
  
  const content = review.content || '';
  const shouldTruncate = content.length > 150;
  const displayContent = showFullContent || !shouldTruncate
    ? content
    : content.slice(0, 150) + '...';

  // Media compatibility
  const media = review.mediaItems || 
    (review.imageUrls?.map(url => ({ url, type: 'image' as const })) || []);

  return (
    <article className="border-b border-border bg-background p-4 last:border-0 sm:p-6">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted sm:h-10 sm:w-10">
            {review.user?.imageUrl && (
              <Image
                src={review.user.imageUrl}
                alt={review.user?.username || 'User'}
                fill
                className="object-cover"
                sizes="40px"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/diary?view=profile&userId=${review.userId}`} className="truncate font-medium text-foreground text-sm sm:text-base hover:underline">
              {review.user?.username || 'Unknown'}
            </Link>
            {review.event && (
              <Link 
                href={`/events/${review.event.id}`}
                className="truncate text-xs text-muted-foreground sm:text-sm hover:text-primary transition-colors"
              >
                <MapPinIcon className="inline w-3 h-3 mr-1" />
                {review.event.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.isBestReview && (
            <span className="text-xs font-medium text-yellow-600">🏆 베스트</span>
          )}
          <time className="text-xs text-muted-foreground sm:text-sm">
            {formatDistanceToNow(new Date(review.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </time>
          {userId === review.userId && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-muted-foreground" />
              </button>
              
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-background rounded-lg shadow-lg border z-20">
                    <Link
                      href={`/reviews/${review.id}/edit`}
                      className="block px-4 py-2 text-sm hover:bg-muted"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 삭제하시겠습니까?')) {
                          deleteReview({ id: review.id });
                        }
                      }}
                      disabled={isDeleting}
                      className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="mb-4">
          {isDesktop ? (
            <Link 
              href={`/reviews/${review.id}`} 
              className="block cursor-pointer relative"
              onClick={(e) => {
                // 비디오 컨트롤 클릭 시 링크 동작 방지
                const target = e.target as HTMLElement;
                if (target.closest('video') || target.closest('button')) {
                  e.preventDefault();
                }
              }}
            >
              <MediaGallery 
                media={media} 
                aspectRatio="square" 
                autoPlay={false}
                showNavigation={media.length > 1}
              />
              {/* 비디오인 경우 오버레이 추가 */}
              {media[0]?.type === 'video' && (
                <div className="absolute inset-0 bg-transparent cursor-pointer z-10" />
              )}
            </Link>
          ) : (
            <div 
              onClick={() => router.push(`/reviews/${review.id}`)}
              className="cursor-pointer relative"
            >
              <MediaGallery 
                media={media} 
                aspectRatio="square"
                autoPlay={false}
                showNavigation={media.length > 1}
              />
            </div>
          )}
        </div>
      )}

      {/* Rating & Seat */}
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

      {/* Content */}
      <div className="space-y-3">
        {/* Title & Content */}
        <div 
          className={isDesktop ? "" : "cursor-pointer"}
          onClick={() => !isDesktop && router.push(`/reviews/${review.id}`)}
        >
          {review.title && (
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {review.title}
            </h3>
          )}
          <p className="text-sm whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullContent(!showFullContent);
              }}
              className="text-sm text-muted-foreground hover:text-foreground mt-1"
            >
              {showFullContent ? '접기' : '더 보기'}
            </button>
          )}
        </div>

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Actions */}
      <div className="mb-3 flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <TouchFeedback type="opacity" activeOpacity={0.6}>
            <button
              onClick={handleLike}
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
          </TouchFeedback>

          <TouchFeedback type="opacity" activeOpacity={0.6}>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            </button>
          </TouchFeedback>

          <TouchFeedback type="opacity" activeOpacity={0.6}>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </TouchFeedback>
        </div>

        <TouchFeedback type="opacity" activeOpacity={0.6}>
          <button
            onClick={handleBookmark}
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
        </TouchFeedback>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border pt-4 mt-4">
          <CommentSection reviewId={review.id} />
        </div>
      )}

      {showReportDialog && (
        <ReportDialog
          reviewId={review.id}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </article>
  );
}