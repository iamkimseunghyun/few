'use client';

import { api } from '@/lib/trpc-client';
import { MediaCarousel } from './MediaCarousel';
import { DiaryComments } from './DiaryComments';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  MapPin,
  Music,
  Calendar,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface DiaryModalContentProps {
  diaryId: string;
}

export function DiaryModalContent({ diaryId }: DiaryModalContentProps) {
  const { userId } = useAuth();
  
  // "new" ID는 새 다이어리 작성 페이지이므로 쿼리하지 않음
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
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(data?.diary.likeCount || 0);
    },
  });

  const { mutate: toggleSave } = api.musicDiary.toggleSave.useMutation({
    onMutate: () => {
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
    },
  });

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: `${data.user?.username}의 음악 다이어리`,
          text: data.diary.caption || '음악 다이어리를 확인해보세요!',
          url: `/diary/${data.diary.id}`,
        });
      } catch (error) {
        console.log('공유 취소 또는 실패:', error);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/diary/${diaryId}`);
      alert('링크가 복사되었습니다!');
    }
  };

  // "new" ID인 경우 빈 컨텐츠 반환 (실제로는 인터셉팅되지 않아야 함)
  if (diaryId === 'new') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-muted-foreground">다이어리를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { diary, user } = data;

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
      {/* Media Section */}
      <div className="lg:w-3/5 bg-black flex items-center justify-center relative">
        <div className="w-full h-full">
          <MediaCarousel media={diary.media} />
        </div>
      </div>

      {/* Info Section */}
      <div className="lg:w-2/5 bg-card flex flex-col overflow-hidden">
        {/* User Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href={`/profile/${user?.id}`} className="flex items-center gap-3">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.username || ''}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(diary.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>
          </Link>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Caption */}
            {diary.caption && (
              <p className="text-sm whitespace-pre-wrap">{diary.caption}</p>
            )}

            {/* Event Info */}
            {diary.eventId && (
              <Link
                href={`/events/${diary.eventId}`}
                className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">이벤트 보기</span>
                </div>
              </Link>
            )}

            {/* Location */}
            {diary.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{diary.location}</span>
              </div>
            )}

            {/* Artists */}
            {diary.artists && diary.artists.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Music className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">아티스트</p>
                  <div className="flex flex-wrap gap-2">
                    {diary.artists.map((artist, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Moments */}
            {diary.moments && diary.moments.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-2">기억하고 싶은 순간</p>
                <div className="space-y-2">
                  {diary.moments.map((moment, index) => (
                    <p key={index} className="text-muted-foreground">
                      • {moment}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Mood */}
            {diary.mood && (
              <div className="text-sm">
                <p className="font-medium mb-1">오늘의 기분</p>
                <p className="text-muted-foreground">{diary.mood}</p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => userId && toggleLike({ diaryId: diary.id })}
                    className="transition-transform hover:scale-110"
                    disabled={!userId}
                  >
                    <Heart
                      className={cn(
                        "w-6 h-6",
                        isLiked && "fill-red-500 text-red-500"
                      )}
                    />
                  </button>
                  <button className="transition-transform hover:scale-110">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="transition-transform hover:scale-110"
                  >
                    <Share className="w-6 h-6" />
                  </button>
                </div>
                <button
                  onClick={() => userId && toggleSave({ diaryId: diary.id })}
                  className="transition-transform hover:scale-110"
                  disabled={!userId}
                >
                  <Bookmark
                    className={cn(
                      "w-6 h-6",
                      isSaved && "fill-current"
                    )}
                  />
                </button>
              </div>
              
              {likeCount > 0 && (
                <p className="text-sm font-semibold">
                  좋아요 {likeCount.toLocaleString()}개
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="border-t border-border max-h-[40%] flex flex-col">
          <DiaryComments diaryId={diary.id} />
        </div>
      </div>
    </div>
  );
}