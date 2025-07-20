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
  ChevronRightIcon,
  MusicalNoteIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid';
import { api } from '@/lib/trpc';
import { toast } from '@/modules/shared/hooks/useToast';
import type { musicDiaries, users, events } from '@/lib/db/schema';
import { DiaryComments } from './DiaryComments';
import { cn } from '@/lib/utils';

interface DiaryDetailViewProps {
  diary: typeof musicDiaries.$inferSelect & {
    isLiked?: boolean;
    isSaved?: boolean;
  };
  user: typeof users.$inferSelect | null;
  event: typeof events.$inferSelect | null;
  isOwner: boolean;
}

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  foggy: '🌫️',
};

export function DiaryDetailView({ diary, user, event, isOwner }: DiaryDetailViewProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(diary.isLiked || false);
  const [isSaved, setIsSaved] = useState(diary.isSaved || false);
  const [likeCount, setLikeCount] = useState(diary.likeCount || 0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const media = Array.isArray(diary.media) ? diary.media as {
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[] : [];
  const weather = diary.weather as string | null;
  const artists = diary.artists as string[] | null;
  const moments = diary.moments as string[] | null;
  const setlist = diary.setlist as string[] | null;

  const { mutate: toggleLike } = api.musicDiary.toggleLike.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(diary.likeCount || 0);
      toast.error('오류가 발생했습니다.');
    },
  });

  const { mutate: toggleSave } = api.musicDiary.toggleSave.useMutation({
    onMutate: () => {
      setIsSaved(!isSaved);
    },
    onSuccess: (data) => {
      toast.success(data.saved ? '저장되었습니다.' : '저장이 취소되었습니다.');
    },
    onError: () => {
      setIsSaved(isSaved);
      toast.error('오류가 발생했습니다.');
    },
  });

  const { mutate: deleteDiary } = api.musicDiary.delete.useMutation({
    onSuccess: () => {
      toast.success('순간이 삭제되었습니다.');
      router.push('/diary');
    },
    onError: () => {
      toast.error('삭제에 실패했습니다.');
    },
  });

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: '나의 음악 순간',
        text: diary.caption || '멋진 공연의 순간을 기록했어요',
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()}>
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="font-semibold">순간</h1>
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
                  <>
                    <Image
                      src={media[currentImageIndex].url}
                      alt=""
                      fill
                      className="object-contain"
                      priority
                    />
                    
                    {/* 이미지 네비게이션 */}
                    {media.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                        
                        {/* 인디케이터 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                          {media.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                index === currentImageIndex ? "bg-white" : "bg-white/50"
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">이미지가 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="lg:w-2/5 flex flex-col">
              {/* 작성자 정보 */}
              <div className="p-4 border-b flex items-center justify-between">
                <Link href={`/profile/${user?.id}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.username || '익명'}</p>
                    {diary.location && (
                      <p className="text-sm text-muted-foreground">{diary.location}</p>
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
                  {/* 이벤트/아티스트 정보 */}
                  {(event || artists) && (
                    <div className="space-y-2">
                      {event && (
                        <Link 
                          href={`/events/${event.id}`}
                          className="flex items-center gap-2 text-sm hover:text-purple-600 transition-colors"
                        >
                          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <MusicalNoteIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="font-medium">{event.name}</span>
                        </Link>
                      )}
                      
                      {artists && artists.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {artists.map((artist, index) => (
                            <span 
                              key={index}
                              className="text-sm px-3 py-1 bg-pink-100 text-pink-700 rounded-full"
                            >
                              {artist}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 캡션 */}
                  {diary.caption && (
                    <div>
                      <p className="font-semibold mb-1">{user?.username || '익명'}</p>
                      <p className="whitespace-pre-wrap">{diary.caption}</p>
                    </div>
                  )}

                  {/* 특별한 순간들 */}
                  {moments && moments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {moments.map((moment, index) => (
                        <span
                          key={index}
                          className="text-sm text-purple-600 hover:underline cursor-pointer"
                        >
                          #{moment}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 날씨와 시간 */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {weather && (
                      <span>{weatherIcons[weather] || weather}</span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(diary.createdAt), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                  </div>

                  {/* 셋리스트 */}
                  {setlist && setlist.length > 0 && (
                    <details className="border rounded-lg p-3">
                      <summary className="font-medium cursor-pointer flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" />
                        셋리스트 ({setlist.length}곡)
                      </summary>
                      <ol className="mt-3 space-y-1">
                        {setlist.map((song, index) => (
                          <li key={index} className="text-sm flex gap-2">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            <span>{song}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t">
                  <DiaryComments diaryId={diary.id} />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="border-t p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike({ diaryId: diary.id })}
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
                    onClick={() => toggleSave({ diaryId: diary.id })}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {isSaved ? (
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
                  {format(new Date(diary.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
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
                  href={`/diary/${diary.id}/edit`}
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
            <h3 className="text-lg font-semibold mb-2">순간을 삭제하시겠습니까?</h3>
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
                onClick={() => deleteDiary({ id: diary.id })}
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