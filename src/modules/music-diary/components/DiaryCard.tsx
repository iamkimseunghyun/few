'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import { useAuth } from '@clerk/nextjs';
import {
  MusicalNoteIcon,
  MapPinIcon,
  SparklesIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';
import { DiaryComments } from './DiaryComments';
import { toast } from '@/modules/shared/hooks/useToast';
import { TouchFeedback } from '@/components/TouchFeedback';
import type { musicDiaries, users } from '@/lib/db/schema';

interface DiaryCardProps {
  diary: typeof musicDiaries.$inferSelect;
  user: typeof users.$inferSelect | null;
  isLiked: boolean;
  isSaved: boolean;
}

export function DiaryCard({ diary, user, isLiked: initialIsLiked, isSaved: initialIsSaved }: DiaryCardProps) {
  const { isSignedIn, userId } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [likeCount, setLikeCount] = useState(diary.likeCount);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);


  const { mutate: toggleLike } = api.musicDiary.toggleLike.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    },
    onSuccess: () => {
      if (!isLiked) {
        toast.success('좋아요를 눌렀습니다!');
      }
    },
    onError: () => {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(diary.likeCount);
      toast.error('좋아요 처리에 실패했습니다.');
    },
  });

  const { mutate: toggleSave } = api.musicDiary.toggleSave.useMutation({
    onMutate: () => {
      setIsSaved(!isSaved);
    },
    onSuccess: () => {
      if (!isSaved) {
        toast.success('다이어리를 저장했습니다!');
      } else {
        toast.info('저장을 취소했습니다.');
      }
    },
    onError: () => {
      // Revert on error
      setIsSaved(isSaved);
      toast.error('저장 처리에 실패했습니다.');
    },
  });

  const { mutate: deleteDiary, isPending: isDeleting } = api.musicDiary.delete.useMutation({
    onSuccess: () => {
      toast.success('다이어리가 삭제되었습니다.');
      window.location.reload(); // Simple reload for now
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
    toggleLike({ diaryId: diary.id });
  };

  const handleSave = () => {
    if (!isSignedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    toggleSave({ diaryId: diary.id });
  };

  // media가 JSONB로 저장되어 있으므로 안전하게 파싱
  const media = Array.isArray(diary.media) 
    ? diary.media as {
        url: string;
        type: 'image' | 'video';
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
      }[]
    : [];
    
  const caption = diary.caption || '';
  const shouldTruncate = caption.length > 100;
  const displayCaption = showFullCaption || !shouldTruncate
    ? caption
    : caption.slice(0, 100) + '...';

  return (
    <article className="border-b border-border bg-background p-4 last:border-0 sm:p-6">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted sm:h-10 sm:w-10">
            {user?.imageUrl && (
              <Image
                src={user.imageUrl}
                alt={user.username || 'User'}
                fill
                className="object-cover"
                sizes="40px"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/diary?view=profile&userId=${diary.userId}`} className="truncate font-medium text-foreground text-sm sm:text-base hover:underline">
              {user?.username || 'Unknown'}
            </Link>
            {diary.location && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                <MapPinIcon className="inline w-3 h-3 mr-1" />
                {diary.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <time className="text-xs text-muted-foreground sm:text-sm">
            {formatDistanceToNow(new Date(diary.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </time>
          {userId === diary.userId && (
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
                      href={`/diary/${diary.id}/edit`}
                      className="block px-4 py-2 text-sm hover:bg-muted"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 삭제하시겠습니까?')) {
                          deleteDiary({ id: diary.id });
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
          <Link href={`/diary/${diary.id}`} className="block">
            <MediaGallery media={media} aspectRatio="square" />
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="mb-3 flex items-center justify-between">
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
              <span>{diary.commentCount || 0}</span>
            </button>
          </TouchFeedback>


          <TouchFeedback type="opacity" activeOpacity={0.6}>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
            <svg
              className={`h-5 w-5 ${isSaved ? 'fill-foreground' : ''}`}
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
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Caption */}
        {caption && (
          <div>
            <p className="text-sm whitespace-pre-wrap">
              <span className="font-semibold mr-2">{user?.username}</span>
              {displayCaption}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-sm text-muted-foreground hover:text-foreground mt-1"
              >
                {showFullCaption ? '접기' : '더 보기'}
              </button>
            )}
          </div>
        )}

        {/* Artists */}
        {diary.artists && (diary.artists as string[]).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <MusicalNoteIcon className="w-4 h-4 text-muted-foreground" />
            {(diary.artists as string[]).map((artist, index) => (
              <span
                key={index}
                className="text-sm text-primary hover:text-primary/80 cursor-pointer"
              >
                {artist}
                {index < (diary.artists as string[]).length - 1 && ','}
              </span>
            ))}
          </div>
        )}

        {/* Moments */}
        {diary.moments && (diary.moments as string[]).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <SparklesIcon className="w-4 h-4 text-muted-foreground" />
            {(diary.moments as string[]).map((moment, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
              >
                #{moment}
              </span>
            ))}
          </div>
        )}

        {/* Mood */}
        {diary.mood && (
          <p className="text-sm text-muted-foreground">
            분위기: {diary.mood}
          </p>
        )}

      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border pt-4 mt-4">
          <DiaryComments diaryId={diary.id} />
        </div>
      )}
    </article>
  );
}