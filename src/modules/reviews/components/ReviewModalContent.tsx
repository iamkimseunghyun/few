'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon as BookmarkOutline,
  EllipsisHorizontalIcon,
  MapPinIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc';
import { toast } from '@/modules/shared/hooks/useToast';
import { CommentSection } from './CommentSection';
import { cn } from '@/lib/utils';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';
import Image from 'next/image';

interface ReviewModalContentProps {
  reviewId: string;
  onClose?: () => void;
}

export function ReviewModalContent({ reviewId, onClose }: ReviewModalContentProps) {
  const { isSignedIn } = useAuth();
  const [showComments, setShowComments] = useState(false);
  
  const { data: review, isLoading, error } = api.reviews.getById.useQuery(
    { id: reviewId }
  );
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (review) {
      setIsLiked(review.isLiked || false);
      setIsBookmarked(review.isBookmarked || false);
      setLikeCount(review.likeCount || 0);
    }
  }, [review]);

  const { mutate: toggleLike } = api.reviews.toggleLike.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(review?.likeCount || 0);
      toast.error('오류가 발생했습니다.');
    },
  });

  const { mutate: toggleBookmark } = api.reviews.toggleBookmark.useMutation({
    onMutate: () => {
      setIsBookmarked(!isBookmarked);
    },
    onSuccess: (data) => {
      toast.success(data.bookmarked ? '저장되었습니다.' : '저장이 취소되었습니다.');
    },
    onError: () => {
      setIsBookmarked(isBookmarked);
      toast.error('오류가 발생했습니다.');
    },
  });

  const handleShare = async () => {
    if (review) {
      try {
        await navigator.share({
          title: review.title || '공연 기록',
          text: review.content || '',
          url: `/reviews/${review.id}`,
        });
      } catch {
        await navigator.clipboard.writeText(`${window.location.origin}/reviews/${reviewId}`);
        toast.success('링크가 복사되었습니다.');
      }
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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background rounded-2xl">
        <div className="space-y-4 text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background rounded-2xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <XMarkIcon className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground">기록을 불러올 수 없습니다.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    );
  }

  const media = review.mediaItems || 
    (review.imageUrls?.map(url => ({ url, type: 'image' as const })) || []);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-background rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
      {/* 이미지 영역 - 60% */}
      <div className="flex-shrink-0 w-full lg:w-[60%] h-[60vh] lg:h-full bg-black relative">
        {media.length > 0 ? (
          <MediaGallery
            media={media}
            className="w-full h-full"
            aspectRatio="original"
            showIndicators={true}
            showNavigation={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <StarIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">이미지가 없습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 - 40% */}
      <div className="flex-1 lg:flex-initial lg:w-[40%] flex flex-col bg-background min-w-0">
        {/* 작성자 정보 헤더 */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${review.user?.id}`} className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                  {review.user?.imageUrl && (
                    <Image
                      src={review.user.imageUrl}
                      alt={review.user.username || 'User'}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{review.user?.username || '익명'}</p>
                {review.event && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{review.event.name}</span>
                  </p>
                )}
              </div>
            </Link>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link 
                href={`/reviews/${review.id}`}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 평점 */}
            <div className="flex items-center gap-2">
              {renderStars(review.overallRating)}
              <span className="text-sm text-muted-foreground ml-2">
                {review.overallRating}.0
              </span>
            </div>

            {/* 제목과 내용 */}
            <div>
              {review.title && (
                <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
              )}
              <p className="whitespace-pre-wrap">{review.content}</p>
            </div>

            {/* 좌석 정보 */}
            {review.seatOrArea && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="w-4 h-4" />
                <span>{review.seatOrArea}</span>
              </div>
            )}

            {/* 태그 */}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm text-primary hover:text-primary/80 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 날짜 */}
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), { 
                addSuffix: true, 
                locale: ko 
              })}
            </div>

            {/* 베스트 리뷰 배지 */}
            {review.isBestReview && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <span>🏆</span>
                <span className="font-medium">베스트 리뷰</span>
              </div>
            )}
          </div>

          {/* 댓글 섹션 */}
          {showComments && (
            <div className="border-t">
              <CommentSection reviewId={review.id} />
            </div>
          )}
        </div>

        {/* 액션 버튼 푸터 */}
        <div className="flex-shrink-0 border-t p-4 bg-background">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (!isSignedIn) {
                    toast.error('로그인이 필요합니다.');
                    return;
                  }
                  toggleLike({ reviewId: review.id });
                }}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isLiked ? "text-red-500" : "hover:text-foreground"
                )}
              >
                {isLiked ? (
                  <HeartSolid className="w-6 h-6" />
                ) : (
                  <HeartOutline className="w-6 h-6" />
                )}
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="p-2 hover:text-foreground rounded-full transition-colors"
              >
                <ChatBubbleOvalLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 hover:text-foreground rounded-full transition-colors"
              >
                <PaperAirplaneIcon className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => {
                if (!isSignedIn) {
                  toast.error('로그인이 필요합니다.');
                  return;
                }
                toggleBookmark({ reviewId: review.id });
              }}
              className={cn(
                "p-2 rounded-full transition-colors",
                isBookmarked ? "text-foreground" : "hover:text-foreground"
              )}
            >
              {isBookmarked ? (
                <BookmarkSolid className="w-6 h-6" />
              ) : (
                <BookmarkOutline className="w-6 h-6" />
              )}
            </button>
          </div>
          
          <div>
            <p className="font-semibold text-sm">
              좋아요 {likeCount.toLocaleString()}개
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(review.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}