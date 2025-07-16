"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/trpc";
import { CommentForm } from "./CommentForm";
import type { Comment, User } from "@/lib/db/schema";

interface CommentWithUser extends Comment {
  user: User | null;
  replies?: CommentWithUser[];
}

interface CommentItemProps {
  comment: CommentWithUser;
  reviewId: string;
  onUpdate?: () => void;
  depth?: number;
}

export function CommentItem({
  comment,
  reviewId,
  onUpdate,
  depth = 0,
}: CommentItemProps) {
  const { userId } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = userId === comment.userId;
  const isDeleted = comment.content === "[삭제된 댓글입니다]";

  const updateComment = api.comments.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      onUpdate?.();
    },
  });

  const deleteComment = api.comments.delete.useMutation({
    onSuccess: () => {
      onUpdate?.();
    },
  });

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateComment.mutate({
      id: comment.id,
      content: editContent.trim(),
    });
  };

  const handleDelete = () => {
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteComment.mutate({ id: comment.id });
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-12" : ""}`}>
      <div className="flex gap-3">
        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          {comment.user?.imageUrl ? (
            <Image
              src={comment.user.imageUrl}
              alt={comment.user.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600">
              {comment.user?.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">
              {comment.user?.username || "알 수 없음"}
            </span>
            <span className="text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={updateComment.isPending}
                  className="px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-gray-600 text-sm hover:text-gray-900"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-gray-700 ${isDeleted ? "italic" : ""}`}>
              {comment.content}
            </p>
          )}

          {!isDeleted && !isEditing && (
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-600 hover:text-gray-900"
              >
                답글
              </button>
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteComment.isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                reviewId={reviewId}
                parentId={comment.id}
                placeholder="답글을 작성하세요..."
                onSuccess={() => {
                  setIsReplying(false);
                  onUpdate?.();
                }}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  reviewId={reviewId}
                  onUpdate={onUpdate}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}