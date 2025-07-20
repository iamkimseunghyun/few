'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon as BookmarkOutline,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  StarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid';
import { api } from '@/lib/trpc';
import { toast } from '@/modules/shared/hooks/useToast';
import { CommentSection } from './CommentSection';
import { useAuth } from '@clerk/nextjs';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';

interface ReviewDetailPageProps {
  reviewId: string;
}

export function ReviewDetailPage({ reviewId }: ReviewDetailPageProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data: review, isLoading } = api.reviews.getById.useQuery({
    id: reviewId,
  });
  
  const [isLiked, setIsLiked] = useState(review?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(review?.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(review?.likeCount || 0);

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

  const { mutate: deleteReview } = api.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.');
      router.push('/reviews');
    },
    onError: () => {
      toast.error('삭제에 실패했습니다.');
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: review?.title || '공연 기록',
        text: review?.content || '',
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            기록을 찾을 수 없습니다
          </h1>
          <Link
            href="/reviews"
            className="text-muted-foreground hover:text-foreground underline"
          >
            기록 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = userId === review.userId;
  const media = review.mediaItems || 
    (review.imageUrls?.map(url => ({ url, type: 'image' as const })) || []);

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()}>
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="font-semibold">기록</h1>
          <button onClick={() => setShowMoreOptions(!showMoreOptions)}>
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="lg:max-w-6xl mx-auto lg:py-8">
        <article className="bg-background lg:rounded-lg lg:border overflow-hidden">
          <div className="lg:flex">
            {/* 이미지 영역 */}
            <div className="lg:w-3/5 bg-black relative">
              <div className="relative aspect-square lg:aspect-auto lg:h-full">
                {media.length > 0 ? (
                  <MediaGallery 
                    media={media} 
                    aspectRatio="original"
                    className="w-full h-full"
                    showIndicators={true}
                    showNavigation={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <p className="text-gray-500">이미지가 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="lg:w-2/5 flex flex-col">
              {/* 작성자 정보 */}
              <div className="p-4 border-b flex items-center justify-between">
                <Link href={`/profile/${review.user?.id}`} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                    {review.user?.imageUrl && (
                      <Image
                        src={review.user.imageUrl}
                        alt={review.user.username || 'User'}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{review.user?.username || '익명'}</p>
                    {review.event && (
                      <p className="text-sm text-muted-foreground">{review.event.name}</p>
                    )}
                  </div>
                </Link>
                
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 스크롤 가능한 컨텐츠 영역 */}
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
                          className="text-sm text-primary hover:underline cursor-pointer"
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
                <div className="border-t">
                  <CommentSection reviewId={review.id} />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="border-t p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike({ reviewId: review.id })}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {isLiked ? (
                        <HeartSolid className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartOutline className="w-6 h-6" />
                      )}
                    </button>
                    <button className="hover:opacity-70 transition-opacity">
                      <ChatBubbleOvalLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleBookmark({ reviewId: review.id })}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {isBookmarked ? (
                      <BookmarkSolid className="w-6 h-6" />
                    ) : (
                      <BookmarkOutline className="w-6 h-6" />
                    )}
                  </button>
                </div>
                
                <p className="font-semibold text-sm">
                  좋아요 {likeCount.toLocaleString()}개
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(review.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                </p>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* 더보기 옵션 모달 */}
      {showMoreOptions && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
          onClick={() => setShowMoreOptions(false)}
        >
          <div 
            className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-96 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isOwner ? (
              <>
                <Link
                  href={`/reviews/${review.id}/edit`}
                  className="block w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  수정하기
                </Link>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMoreOptions(false);
                  }}
                  className="block w-full text-left p-3 hover:bg-muted rounded-lg transition-colors text-destructive"
                >
                  삭제하기
                </button>
              </>
            ) : (
              <button className="block w-full text-left p-3 hover:bg-muted rounded-lg transition-colors">
                신고하기
              </button>
            )}
            <button
              onClick={() => setShowMoreOptions(false)}
              className="block w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-background rounded-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">기록을 삭제하시겠습니까?</h3>
            <p className="text-muted-foreground mb-6">
              이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteReview({ id: review.id })}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
