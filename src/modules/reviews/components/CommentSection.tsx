"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/trpc";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  reviewId: string;
}

export function CommentSection({ reviewId }: CommentSectionProps) {
  const { isSignedIn } = useAuth();
  const utils = api.useUtils();
  const { data, isLoading, refetch } = api.comments.getByReviewId.useQuery({
    reviewId,
  });
  
  const comments = data?.comments || [];

  const handleCommentAdded = async () => {
    // 직접 refetch 호출
    await refetch();
    // 리뷰 정보도 업데이트
    await utils.reviews.getById.invalidate({ id: reviewId });
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        댓글 {data?.totalCount || 0}개
      </h3>

      {isSignedIn && (
        <CommentForm
          reviewId={reviewId}
          onSuccess={handleCommentAdded}
        />
      )}

      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              reviewId={reviewId}
              onUpdate={handleCommentAdded}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </p>
        )}
      </div>
    </div>
  );
}