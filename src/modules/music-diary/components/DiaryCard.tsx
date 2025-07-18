'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import { useAuth } from '@clerk/nextjs';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ShareIcon,
  MusicalNoteIcon,
  MapPinIcon,
  SparklesIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { MediaGallery } from './MediaGallery';
import { DiaryComments } from './DiaryComments';
import { useIsDesktop } from '@/modules/shared/hooks/useMediaQuery';
import { toast } from '@/modules/shared/hooks/useToast';
import type { musicDiaries, users } from '@/lib/db/schema';

interface DiaryCardProps {
  diary: typeof musicDiaries.$inferSelect;
  user: typeof users.$inferSelect | null;
  isLiked: boolean;
  isSaved: boolean;
}

export function DiaryCard({ diary, user, isLiked: initialIsLiked, isSaved: initialIsSaved }: DiaryCardProps) {
  const { isSignedIn, userId } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isDesktop = useIsDesktop();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [likeCount, setLikeCount] = useState(diary.likeCount);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const media = diary.media as {
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  const caption = diary.caption || '';
  const shouldTruncate = caption.length > 100;
  const displayCaption = showFullCaption || !shouldTruncate
    ? caption
    : caption.slice(0, 100) + '...';

  return (
    <article className="bg-white border-b sm:border sm:rounded-lg sm:shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <Link href={`/profile/${user?.id}`} className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {user?.imageUrl && (
              <Image
                src={user.imageUrl}
                alt={user.username || 'User'}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{user?.username || 'Unknown'}</p>
            {diary.location && (
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" />
                {diary.location}
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(diary.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
          {userId === diary.userId && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
              </button>
              
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border z-20">
                    <Link
                      href={`/diary/${diary.id}/edit`}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
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
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
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
      {!mounted || isDesktop ? (
        <Link href={`/diary/${diary.id}`} className="block">
          <MediaGallery media={media} isInteractive={false} />
        </Link>
      ) : (
        <MediaGallery media={media} isInteractive={true} />
      )}

      {/* Actions */}
      <div className="px-3 sm:px-4 py-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-gray-700 hover:text-red-600 transition-colors"
          >
            {isLiked ? (
              <HeartIconSolid className="w-6 h-6 text-red-600" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ChatBubbleLeftIcon className="w-6 h-6" />
            {diary.commentCount > 0 && (
              <span className="text-sm">{diary.commentCount}</span>
            )}
          </button>

          <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors">
            <ShareIcon className="w-6 h-6" />
          </button>

          <button
            onClick={handleSave}
            className="ml-auto flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            {isSaved ? (
              <BookmarkIconSolid className="w-6 h-6" />
            ) : (
              <BookmarkIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Like count */}
        {likeCount > 0 && (
          <p className="mt-2 text-sm font-semibold">좋아요 {likeCount}개</p>
        )}
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
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
                className="text-sm text-gray-600 hover:text-gray-800 mt-1"
              >
                {showFullCaption ? '접기' : '더 보기'}
              </button>
            )}
          </div>
        )}

        {/* Artists */}
        {diary.artists && (diary.artists as string[]).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <MusicalNoteIcon className="w-4 h-4 text-gray-400" />
            {(diary.artists as string[]).map((artist, index) => (
              <span
                key={index}
                className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
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
            <SparklesIcon className="w-4 h-4 text-gray-400" />
            {(diary.moments as string[]).map((moment, index) => (
              <span
                key={index}
                className="text-sm text-pink-600"
              >
                #{moment}
              </span>
            ))}
          </div>
        )}

        {/* Mood */}
        {diary.mood && (
          <p className="text-sm text-gray-600">
            분위기: {diary.mood}
          </p>
        )}

        {/* Comment count */}
        {diary.commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            댓글 {diary.commentCount}개 모두 보기
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t px-3 sm:px-4 py-3 sm:py-4">
          <DiaryComments diaryId={diary.id} />
        </div>
      )}
    </article>
  );
}