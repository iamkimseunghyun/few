'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/trpc';
import { useAuth } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { musicDiaries, users } from '@/lib/db/schema';
import { 
  ArrowLeft, 
  MoreVertical, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share, 
  MapPin,
  Music,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaGallery } from '@/modules/shared/ui/components/MediaGallery';
import { DiaryComments } from './DiaryComments';
import { ConfirmModal } from '@/modules/shared';

interface DiaryDetailProps {
  initialData: {
    diary: typeof musicDiaries.$inferSelect;
    user: typeof users.$inferSelect | null;
    isLiked: boolean;
    isSaved: boolean;
  };
}

export function DiaryDetail({ initialData }: DiaryDetailProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLiked, setIsLiked] = useState(initialData.isLiked);
  const [isSaved, setIsSaved] = useState(initialData.isSaved);
  const [likeCount, setLikeCount] = useState(initialData.diary.likeCount);

  const { data: diaryData } = api.musicDiary.getById.useQuery(
    { id: initialData.diary.id },
    { 
      initialData, 
      refetchOnMount: false,
      refetchOnWindowFocus: false 
    }
  );

  const diary = diaryData?.diary || initialData.diary;
  const user = diaryData?.user || initialData.user;

  const { mutate: toggleLike } = api.musicDiary.toggleLike.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(likeCount);
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

  const { mutate: deleteDiary, isPending: isDeleting } = api.musicDiary.delete.useMutation({
    onSuccess: () => {
      router.push('/diary');
    },
    onError: (error) => {
      alert('삭제에 실패했습니다.');
      console.error(error);
    },
  });

  const handleDelete = () => {
    deleteDiary({ id: diary.id });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.username}의 음악 다이어리`,
          text: diary.caption || '음악 다이어리를 확인해보세요!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('공유 취소 또는 실패:', error);
      }
    } else {
      // 클립보드에 URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const isOwner = userId === diary.userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <h1 className="text-lg font-semibold">게시물</h1>
            
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-20">
                      <Link
                        href={`/diary/${diary.id}/edit`}
                        className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      >
                        수정하기
                      </Link>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-destructive hover:bg-muted transition-colors"
                      >
                        삭제하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="bg-card">
          <div className="lg:flex lg:min-h-[calc(100vh-4rem)]">
            {/* Media Section */}
            <div className="lg:flex-1 lg:flex lg:items-center lg:justify-center bg-black">
              <div className="w-full">
                <MediaGallery media={Array.isArray(diary.media) ? diary.media : []} />
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:w-96 lg:border-l border-border lg:flex lg:flex-col">
              {/* User Info */}
              <div className="p-4 border-b border-border">
                <Link
                  href={`/profile/${user?.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
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

              {/* Caption & Details */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
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
                  {diary.artists && Array.isArray(diary.artists) && diary.artists.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Music className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">아티스트</p>
                        <div className="flex flex-wrap gap-2">
                          {(diary.artists as string[]).map((artist, index) => (
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

                  {/* Setlist */}
                  {diary.setlist && Array.isArray(diary.setlist) && diary.setlist.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-2">셋리스트</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {(diary.setlist as string[]).map((song, index) => (
                          <li key={index} className="text-muted-foreground">
                            {song}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Moments */}
                  {diary.moments && Array.isArray(diary.moments) && diary.moments.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-2">기억하고 싶은 순간</p>
                      <div className="space-y-2">
                        {(diary.moments as string[]).map((moment, index) => (
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
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLike({ diaryId: diary.id })}
                        className="transition-transform hover:scale-110"
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
                      onClick={() => toggleSave({ diaryId: diary.id })}
                      className="transition-transform hover:scale-110"
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
                    <p className="text-sm font-semibold mb-2">
                      좋아요 {likeCount.toLocaleString()}개
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div className="border-t border-border">
                  <DiaryComments diaryId={diary.id} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="다이어리 삭제"
        message="정말로 이 다이어리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isLoading={isDeleting}
      />
    </div>
  );
}