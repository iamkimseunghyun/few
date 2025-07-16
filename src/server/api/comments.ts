import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc";
import { comments, users, reviews, events } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notificationHelpers } from "@/server/utils/notifications";
import { idInput } from "./schemas";

const createCommentSchema = z.object({
  reviewId: z.string(),
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify review exists
      const reviewExists = await ctx.db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.id, input.reviewId))
        .limit(1);

      if (!reviewExists.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "리뷰를 찾을 수 없습니다.",
        });
      }

      // If parentId is provided, verify parent comment exists
      if (input.parentId) {
        const parentExists = await ctx.db
          .select({ id: comments.id })
          .from(comments)
          .where(eq(comments.id, input.parentId))
          .limit(1);

        if (!parentExists.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "부모 댓글을 찾을 수 없습니다.",
          });
        }
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          reviewId: input.reviewId,
          userId: ctx.userId,
          content: input.content,
          parentId: input.parentId,
        })
        .returning();

      // Create notifications
      const helpers = notificationHelpers({ db: ctx.db });
      
      if (input.parentId) {
        // This is a reply - notify the parent comment author
        const [parentComment] = await ctx.db
          .select()
          .from(comments)
          .where(eq(comments.id, input.parentId))
          .limit(1);
          
        if (parentComment && parentComment.userId !== ctx.userId) {
          await helpers.onCommentReplied(
            parentComment.userId,
            ctx.userId,
            input.content,
            input.reviewId
          );
        }
      } else {
        // This is a new comment - notify the review author
        await helpers.onReviewCommented(
          input.reviewId,
          ctx.userId,
          input.content
        );
      }

      // Return comment with user info
      const [commentWithUser] = await ctx.db
        .select({
          comment: comments,
          user: users,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, comment.id))
        .limit(1);

      return {
        ...commentWithUser.comment,
        user: commentWithUser.user,
        replies: [],
      };
    }),

  getByReviewId: publicProcedure
    .input(z.object({ 
      reviewId: z.string(),
      includeDeleted: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const commentsList = await ctx.db
        .select({
          comment: comments,
          user: users,
          replyCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${comments} AS c2
            WHERE c2.parent_id = ${comments.id}
          )`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.reviewId, input.reviewId))
        .orderBy(desc(comments.createdAt));

      // Filter out deleted comments if requested
      const filteredComments = input.includeDeleted
        ? commentsList
        : commentsList.filter(({ comment }) => 
            !comment.content.startsWith("[삭제된 댓글")
          );

      // Organize comments into tree structure
      const rootComments = filteredComments.filter(
        ({ comment }) => !comment.parentId
      );
      const repliesMap = new Map<string, typeof filteredComments>();

      filteredComments.forEach((item) => {
        if (item.comment.parentId) {
          const replies = repliesMap.get(item.comment.parentId) || [];
          replies.push(item);
          repliesMap.set(item.comment.parentId, replies);
        }
      });

      // Build nested structure
      type CommentItem = typeof filteredComments[0];
      interface CommentTree {
        id: string;
        reviewId: string;
        userId: string;
        content: string;
        parentCommentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        user: CommentItem['user'];
        replyCount: number;
        replies: CommentTree[];
        canEdit: boolean;
        canDelete: boolean;
      }
      
      const buildCommentTree = (
        commentItem: typeof filteredComments[0]
      ): CommentTree => {
        const replies = repliesMap.get(commentItem.comment.id) || [];
        return {
          ...commentItem.comment,
          user: commentItem.user,
          replyCount: commentItem.replyCount,
          replies: replies.map(buildCommentTree),
          canEdit: ctx.userId === commentItem.comment.userId,
          canDelete: ctx.userId === commentItem.comment.userId,
        };
      };

      return {
        comments: rootComments.map(buildCommentTree),
        totalCount: commentsList.length,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db
        .select()
        .from(comments)
        .where(
          and(eq(comments.id, input.id), eq(comments.userId, ctx.userId))
        )
        .limit(1);

      if (!existingComment.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "댓글을 찾을 수 없거나 수정 권한이 없습니다.",
        });
      }

      // Check if comment was already deleted
      if (existingComment[0].content.startsWith("[삭제된 댓글")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "삭제된 댓글은 수정할 수 없습니다.",
        });
      }

      const [updated] = await ctx.db
        .update(comments)
        .set({
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db
        .select({
          comment: comments,
          hasReplies: sql<boolean>`EXISTS(
            SELECT 1 FROM ${comments} AS c2
            WHERE c2.parent_id = ${comments.id}
          )`,
        })
        .from(comments)
        .where(
          and(eq(comments.id, input.id), eq(comments.userId, ctx.userId))
        )
        .limit(1);

      if (!existingComment.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "댓글을 찾을 수 없거나 삭제 권한이 없습니다.",
        });
      }

      // If comment has replies, soft delete
      if (existingComment[0].hasReplies) {
        await ctx.db
          .update(comments)
          .set({
            content: "[삭제된 댓글입니다]",
            updatedAt: new Date(),
          })
          .where(eq(comments.id, input.id))
          .returning();

        return { success: true, softDeleted: true };
      } else {
        // If no replies, hard delete
        await ctx.db
          .delete(comments)
          .where(eq(comments.id, input.id));

        return { success: true, softDeleted: false };
      }
    }),

  // Get user's recent comments
  getUserComments: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userComments = await ctx.db
        .select({
          comment: comments,
          review: reviews,
          reviewEvent: events,
        })
        .from(comments)
        .innerJoin(reviews, eq(comments.reviewId, reviews.id))
        .leftJoin(events, eq(reviews.eventId, events.id))
        .where(
          and(
            eq(comments.userId, input.userId),
            sql`${comments.content} NOT LIKE '[삭제된 댓글%'`
          )
        )
        .orderBy(desc(comments.createdAt))
        .limit(input.limit);

      return userComments.map(({ comment, review, reviewEvent }) => ({
        ...comment,
        review: {
          id: review.id,
          content: review.content.substring(0, 100) + "...",
          event: reviewEvent,
        },
      }));
    }),
});