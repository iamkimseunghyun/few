'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingSpinner } from '@/modules/shared/ui/components/LoadingSpinner';
import { ErrorMessage } from '@/modules/shared/ui/components/ErrorMessage';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface CommentSectionProps {
  diaryId: string;
}

export function CommentSection({ diaryId }: CommentSectionProps) {
  const { isSignedIn } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = api.musicDiary.getComments.useInfiniteQuery(
    {
      diaryId,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const { mutate: addComment } = api.musicDiary.addComment.useMutation({
    onSuccess: () => {
      setComment('');
      refetch();
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    addComment({
      diaryId,
      content: comment.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage
          title="댓글을 불러올 수 없습니다"
          message="다시 시도해주세요."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const allComments = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="divide-y">
      {/* Comment List */}
      <div className="max-h-96 overflow-y-auto">
        {allComments.length === 0 ? (
          <p className="p-4 text-center text-gray-500 text-sm">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </p>
        ) : (
          <>
            {allComments.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex gap-3">
                  <Link
                    href={`/profile/${item.user?.id}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                      {item.user?.imageUrl && (
                        <Image
                          src={item.user.imageUrl}
                          alt={item.user.name || 'User'}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/profile/${item.user?.id}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {item.user?.name || 'Unknown'}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 break-words">{item.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load more trigger */}
            <div ref={ref} className="h-4">
              {isFetchingNextPage && (
                <div className="flex justify-center p-2">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Comment Input */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글 달기..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={500}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '게시 중...' : '게시'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600">
            댓글을 작성하려면{' '}
            <Link href="/sign-in" className="text-purple-600 hover:underline">
              로그인
            </Link>
            이 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}