'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc-client';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { User, Send } from 'lucide-react';

interface DiaryCommentsProps {
  diaryId: string;
}

export function DiaryComments({ diaryId }: DiaryCommentsProps) {
  const { userId } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, refetch } = api.musicDiary.getComments.useQuery(
    { diaryId, limit: 50 },
    { enabled: !!diaryId }
  );

  const { mutate: addComment } = api.musicDiary.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !userId) return;

    setIsSubmitting(true);
    addComment(
      { diaryId, content: commentText },
      {
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-4">
          {comments?.items.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link
                href={`/profile/${comment.user?.id}`}
                className="flex-shrink-0"
              >
                {comment.user?.imageUrl ? (
                  <Image
                    src={comment.user.imageUrl}
                    alt={comment.user.name || ''}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </Link>
              User
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <Link
                    href={`/profile/${comment.user?.id}`}
                    className="font-semibold hover:underline"
                  >
                    {comment.user?.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <p className="text-sm mt-0.5 text-foreground/90 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {comments?.items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              아직 댓글이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Comment form */}
      {userId && (
        <div className="border-t border-border px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글 달기..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      )}

      {!userId && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          댓글을 남기려면 로그인이 필요합니다.
        </div>
      )}
    </div>
  );
}
