import { notifications, users, reviews, musicDiaries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { db } from "@/lib/db";

type DrizzleDB = typeof db;

interface CreateNotificationParams {
  db: DrizzleDB;
  userId: string;
  type: "like" | "comment" | "reply" | "follow" | "diary_like" | "diary_comment";
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: "review" | "comment" | "user" | "diary";
}

export async function createNotification({
  db,
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
}: CreateNotificationParams) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    relatedId,
    relatedType,
  });
}

interface NotificationHelpers {
  db: DrizzleDB;
}

export function notificationHelpers({ db }: NotificationHelpers) {
  return {
    async onReviewLiked(reviewId: string, likedByUserId: string) {
      // Get review details
      const [review] = await db
        .select({
          review: reviews,
          user: users,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, reviewId))
        .limit(1);

      if (!review || review.review.userId === likedByUserId) return;

      const [likedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, likedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: review.review.userId,
        type: "like",
        title: "리뷰에 좋아요를 받았습니다",
        message: `${likedByUser?.username || "누군가"}님이 회원님의 리뷰에 좋아요를 눌렀습니다.`,
        relatedId: reviewId,
        relatedType: "review",
      });
    },

    async onReviewCommented(reviewId: string, commentedByUserId: string, commentContent: string) {
      // Get review details
      const [review] = await db
        .select({
          review: reviews,
          user: users,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, reviewId))
        .limit(1);

      if (!review || review.review.userId === commentedByUserId) return;

      const [commentedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, commentedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: review.review.userId,
        type: "comment",
        title: "리뷰에 댓글이 달렸습니다",
        message: `${commentedByUser?.username || "누군가"}님: ${commentContent.substring(0, 50)}${commentContent.length > 50 ? "..." : ""}`,
        relatedId: reviewId,
        relatedType: "review",
      });
    },

    async onCommentReplied(parentCommentUserId: string, repliedByUserId: string, replyContent: string, reviewId: string) {
      if (parentCommentUserId === repliedByUserId) return;

      const [repliedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, repliedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: parentCommentUserId,
        type: "reply",
        title: "댓글에 답글이 달렸습니다",
        message: `${repliedByUser?.username || "누군가"}님: ${replyContent.substring(0, 50)}${replyContent.length > 50 ? "..." : ""}`,
        relatedId: reviewId,
        relatedType: "review",
      });
    },

    async onDiaryLiked(diaryId: string, likedByUserId: string) {
      // Get diary details
      const [diary] = await db
        .select({
          diary: musicDiaries,
          user: users,
        })
        .from(musicDiaries)
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(eq(musicDiaries.id, diaryId))
        .limit(1);

      if (!diary || diary.diary.userId === likedByUserId) return;

      const [likedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, likedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: diary.diary.userId,
        type: "diary_like",
        title: "다이어리에 좋아요를 받았습니다",
        message: `${likedByUser?.username || "누군가"}님이 회원님의 다이어리에 좋아요를 눌렀습니다.`,
        relatedId: diaryId,
        relatedType: "diary",
      });
    },

    async onDiaryCommented(diaryId: string, commentedByUserId: string, commentContent: string) {
      // Get diary details
      const [diary] = await db
        .select({
          diary: musicDiaries,
          user: users,
        })
        .from(musicDiaries)
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(eq(musicDiaries.id, diaryId))
        .limit(1);

      if (!diary || diary.diary.userId === commentedByUserId) return;

      const [commentedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, commentedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: diary.diary.userId,
        type: "diary_comment",
        title: "다이어리에 댓글이 달렸습니다",
        message: `${commentedByUser?.username || "누군가"}님: ${commentContent.substring(0, 50)}${commentContent.length > 50 ? "..." : ""}`,
        relatedId: diaryId,
        relatedType: "diary",
      });
    },

    async onUserFollowed(followedUserId: string, followedByUserId: string) {
      const [followedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, followedByUserId))
        .limit(1);

      await createNotification({
        db,
        userId: followedUserId,
        type: "follow",
        title: "새로운 팔로워가 생겼습니다",
        message: `${followedByUser?.username || "누군가"}님이 회원님을 팔로우했습니다.`,
        relatedId: followedByUserId,
        relatedType: "user",
      });
    },
  };
}