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
  SparklesIcon,
  MapPinIcon,
  CheckBadgeIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc-client';
import { toast } from '@/modules/shared/hooks/useToast';
import { DiaryComments } from './DiaryComments';
import { cn } from '@/lib/utils';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';

interface DiaryModalContentProps {
  diaryId: string;
  onClose?: () => void;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  foggy: '🌫️',
};

export function DiaryModalContent({ diaryId, onClose }: DiaryModalContentProps) {
  const { userId } = useAuth();
  const [showComments, setShowComments] = useState(false);
  
  const { data, isLoading, error } = api.musicDiary.getById.useQuery(
    { id: diaryId },
    { enabled: diaryId !== 'new' }
  );
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (data) {
      setIsLiked(data.isLiked);
      setIsSaved(data.isSaved);
      setLikeCount(data.diary.likeCount);
    }
  }, [data]);

  const { mutate: toggleLike } = api.musicDiary.toggleLike.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(data?.diary.likeCount || 0);
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

  const handleShare = async () => {
    if (data) {
      try {
        await navigator.share({
          title: '나의 음악 순간',
          text: data.diary.caption || '멋진 공연의 순간을 기록했어요',
          url: `/diary/${data.diary.id}`,
        });
      } catch {
        await navigator.clipboard.writeText(`${window.location.origin}/diary/${diaryId}`);
        toast.success('링크가 복사되었습니다.');
      }
    }
  };

  if (diaryId === 'new') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background rounded-2xl border border-border/50">
        <div className="space-y-4 text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-600/20" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">순간을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background rounded-2xl border border-border/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <XMarkIcon className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-muted-foreground">순간을 불러올 수 없습니다.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-purple-400 hover:text-purple-300 font-medium"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    );
  }

  const { diary, user } = data;
  const rawMedia = Array.isArray(diary.media) ? diary.media as MediaItem[] : [];
  const weather = diary.weather as string | null;
  const artists = diary.artists as string[] | null;
  const moments = diary.moments as string[] | null;
  const setlist = diary.setlist as string[] | null;

  // MediaGallery를 위한 미디어 데이터 변환
  const media = rawMedia; // Media is already in the correct MediaItem format

  // 디버깅을 위한 로그
  console.log('Raw media data:', rawMedia);
  console.log('Converted media data:', media);


  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-background rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl border border-border/50">
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
              <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500">이미지가 없습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 - 40% */}
      <div className="flex-1 lg:flex-initial lg:w-[40%] flex flex-col bg-background min-w-0">
        {/* 작성자 정보 헤더 */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link href={`/diary?view=profile&userId=${user?.id}`} className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                {user?.reviewCount && user.reviewCount > 10 && (
                  <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500 bg-white rounded-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{user?.username || '익명'}</p>
                {diary.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{diary.location}</span>
                  </p>
                )}
              </div>
            </Link>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link 
                href={`/diary/${diary.id}`}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <EllipsisHorizontalIcon className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 이벤트/아티스트 정보 */}
            {artists && (
              <div className="space-y-3">
                
                {artists && artists.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {artists.map((artist, index) => (
                      <span 
                        key={index}
                        className="text-sm px-3 py-1.5 bg-gradient-to-r from-purple-600/10 to-pink-600/10 text-foreground rounded-full font-medium border border-purple-600/20"
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
                <p className="text-foreground leading-relaxed">
                  <span className="font-semibold mr-2">{user?.username || '익명'}</span>
                  {diary.caption}
                </p>
              </div>
            )}

            {/* 특별한 순간들 */}
            {moments && moments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {moments.map((moment, index) => (
                  <span
                    key={index}
                    className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    #{moment}
                  </span>
                ))}
              </div>
            )}

            {/* 날씨와 시간 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {weather && (
                <span className="flex items-center gap-1">
                  <span className="text-lg">{weatherIcons[weather] || '🌈'}</span>
                  <span>{weather}</span>
                </span>
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
              <details className="group">
                <summary className="font-medium cursor-pointer flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                  <SparklesIcon className="w-5 h-5 text-purple-400" />
                  <span>셋리스트</span>
                  <span className="text-sm text-muted-foreground">({setlist.length}곡)</span>
                  <ChevronRightIcon className="w-4 h-4 ml-auto group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <ol className="space-y-2">
                    {setlist.map((song, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground font-mono">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-foreground">{song}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            )}
          </div>

          {/* 댓글 섹션 */}
          {showComments && (
            <div className="border-t border-border">
              <DiaryComments diaryId={diary.id} />
            </div>
          )}
        </div>

        {/* 액션 버튼 푸터 */}
        <div className="flex-shrink-0 border-t border-border p-4 bg-background">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => userId && toggleLike({ diaryId: diary.id })}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                )}
                disabled={!userId}
              >
                {isLiked ? (
                  <HeartSolid className="w-6 h-6" />
                ) : (
                  <HeartOutline className="w-6 h-6" />
                )}
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                <ChatBubbleOvalLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                <PaperAirplaneIcon className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => userId && toggleSave({ diaryId: diary.id })}
              className={cn(
                "p-2 rounded-full transition-colors",
                isSaved ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              disabled={!userId}
            >
              {isSaved ? (
                <BookmarkSolid className="w-6 h-6" />
              ) : (
                <BookmarkOutline className="w-6 h-6" />
              )}
            </button>
          </div>
          
          <div>
            <p className="font-semibold text-sm text-foreground">
              좋아요 {likeCount.toLocaleString()}개
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(diary.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}