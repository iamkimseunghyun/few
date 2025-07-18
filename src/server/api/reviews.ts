import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  reviews,
  events,
  users,
  reviewLikes,
  reviewBookmarks,
  reviewReports,
  comments,
} from '@/lib/db/schema';
import { eq, desc, and, sql, lt, gt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { notificationHelpers } from '@/server/utils/notifications';
import { idInput, infiniteQueryInput, ratingSchema } from './schemas';

const createReviewSchema = z.object({
  title: z.string().min(1).max(256),
  eventId: z.string().optional(),
  eventName: z.string().max(256).optional(),
  overallRating: ratingSchema,
  soundRating: ratingSchema.optional(),
  viewRating: ratingSchema.optional(),
  safetyRating: ratingSchema.optional(),
  operationRating: ratingSchema.optional(),
  seatOrArea: z.string().max(100).optional(),
  content: z.string().min(10).max(5000),
  imageUrls: z.array(z.string().url()).max(10).optional(), // Deprecated
  mediaItems: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video']),
    thumbnailUrl: z.string().url().optional(),
    duration: z.number().optional(),
  })).max(10).optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
});

const updateReviewSchema = createReviewSchema.partial();

export const reviewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      // If eventId is provided, verify event exists
      if (input.eventId) {
        const event = await ctx.db
          .select()
          .from(events)
          .where(eq(events.id, input.eventId))
          .limit(1);

        if (!event.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '이벤트를 찾을 수 없습니다.',
          });
        }

        // Check if user already reviewed this event
        const existingReview = await ctx.db
          .select()
          .from(reviews)
          .where(
            and(
              eq(reviews.userId, ctx.userId),
              eq(reviews.eventId, input.eventId)
            )
          )
          .limit(1);

        if (existingReview.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: '이미 이 이벤트에 대한 리뷰를 작성하셨습니다.',
          });
        }
      }

      const result = await ctx.db
        .insert(reviews)
        .values({
          userId: ctx.userId,
          title: input.title,
          eventId: input.eventId || null,
          overallRating: input.overallRating,
          soundRating: input.soundRating,
          viewRating: input.viewRating,
          safetyRating: input.safetyRating,
          operationRating: input.operationRating,
          seatOrArea: input.seatOrArea,
          content: input.content,
          imageUrls: input.imageUrls,
          mediaItems: input.mediaItems,
          tags: input.tags,
        })
        .returning();

      const review = Array.isArray(result) ? result[0] : result;

      return review;
    }),

  getAll: publicProcedure
    .input(
      infiniteQueryInput
        .extend({
          eventId: z.string().optional(),
          sortBy: z.enum(['latest', 'popular']).optional().default('latest'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        limit = 20,
        cursor,
        direction = 'forward',
        eventId,
        sortBy = 'latest',
      } = input || {};
      const queryLimit = limit + 1;

      const whereConditions = [];
      if (eventId) {
        whereConditions.push(eq(reviews.eventId, eventId));
      }

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (direction === 'forward') {
          whereConditions.push(lt(reviews.createdAt, cursorDate));
        } else {
          whereConditions.push(gt(reviews.createdAt, cursorDate));
        }
      }

      const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const reviewsList = await ctx.db
        .select({
          review: reviews,
          user: users,
          event: events,
          likeCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviewLikes}
            WHERE ${reviewLikes.reviewId} = ${reviews.id}
          )`,
          commentCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${comments}
            WHERE ${comments.reviewId} = ${reviews.id}
          )`,
          isLiked: ctx.userId
            ? sql<boolean>`EXISTS(
                SELECT 1 FROM ${reviewLikes}
                WHERE ${reviewLikes.reviewId} = ${reviews.id}
                AND ${reviewLikes.userId} = ${ctx.userId}
              )`
            : sql<boolean>`false`,
          isBookmarked: ctx.userId
            ? sql<boolean>`EXISTS(
                SELECT 1 FROM ${reviewBookmarks}
                WHERE ${reviewBookmarks.reviewId} = ${reviews.id}
                AND ${reviewBookmarks.userId} = ${ctx.userId}
              )`
            : sql<boolean>`false`,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(events, eq(reviews.eventId, events.id))
        .where(where)
        .orderBy(
          sortBy === 'popular'
            ? sql`(
                SELECT COUNT(*)::int FROM ${reviewLikes}
                WHERE ${reviewLikes.reviewId} = ${reviews.id}
              ) DESC, ${reviews.createdAt} DESC`
            : desc(reviews.createdAt)
        )
        .limit(queryLimit);

      let nextCursor: string | undefined = undefined;
      let hasNextPage = false;

      if (reviewsList.length > limit) {
        hasNextPage = true;
        const nextItem = reviewsList.pop();
        nextCursor = nextItem!.review.createdAt.toISOString();
      }

      return {
        items: reviewsList.map(
          ({
            review,
            user,
            event,
            likeCount,
            commentCount,
            isLiked,
            isBookmarked,
          }) => ({
            ...review,
            user,
            event,
            likeCount,
            commentCount,
            isLiked,
            isBookmarked,
          })
        ),
        nextCursor,
        hasNextPage,
      };
    }),

  getById: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    console.log('getById input:', input);

    const result = await ctx.db
      .select({
        review: reviews,
        user: users,
        event: events,
        likeCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${reviewLikes}
          WHERE ${reviewLikes.reviewId} = ${reviews.id}
        )`,
        commentCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${comments}
          WHERE ${comments.reviewId} = ${reviews.id}
        )`,
        isLiked: ctx.userId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM ${reviewLikes}
              WHERE ${reviewLikes.reviewId} = ${reviews.id}
              AND ${reviewLikes.userId} = ${ctx.userId}
            )`
          : sql<boolean>`false`,
        isBookmarked: ctx.userId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM ${reviewBookmarks}
              WHERE ${reviewBookmarks.reviewId} = ${reviews.id}
              AND ${reviewBookmarks.userId} = ${ctx.userId}
            )`
          : sql<boolean>`false`,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(events, eq(reviews.eventId, events.id))
      .where(eq(reviews.id, input.id))
      .limit(1);

    console.log('Full query result:', result);

    if (!result.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    const { review, user, event, likeCount, commentCount, isLiked, isBookmarked } = result[0];

    return {
      ...review,
      user,
      event,
      likeCount,
      commentCount,
      isLiked,
      isBookmarked,
    };
  }),

  getUserReviews: publicProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ ctx }) => {
      console.log('=== getUserReviews Debug ===');
      console.log('ctx.userId:', ctx.userId);

      try {
        const reviewsList = await ctx.db
          .select({
            review: reviews,
            user: users,
            event: events,
            likeCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviewLikes}
            WHERE ${reviewLikes.reviewId} = ${reviews.id}
          )`,
            commentCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${comments}
            WHERE ${comments.reviewId} = ${reviews.id}
          )`,
          })
          .from(reviews)
          .leftJoin(users, eq(reviews.userId, users.id))
          .leftJoin(events, eq(reviews.eventId, events.id))
          .where(eq(reviews.userId!, ctx.userId!))
          .orderBy(desc(reviews.createdAt));

        return reviewsList.map(
          ({ review, user, event, likeCount, commentCount }) => ({
            ...review,
            user,
            event,
            likeCount,
            commentCount,
          })
        );
      } catch (error) {
        console.error('getUserReviews error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '리뷰를 가져오는 중 오류가 발생했습니다.',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateReviewSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingReview = await ctx.db
        .select()
        .from(reviews)
        .where(and(eq(reviews.id, input.id), eq(reviews.userId, ctx.userId)))
        .limit(1);

      if (!existingReview.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '리뷰를 찾을 수 없거나 수정 권한이 없습니다.',
        });
      }

      const result = await ctx.db
        .update(reviews)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, input.id))
        .returning();

      const updated = Array.isArray(result) ? result[0] : result;

      return updated;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const existingReview = await ctx.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, input.id), eq(reviews.userId, ctx.userId)))
      .limit(1);

    if (!existingReview.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '리뷰를 찾을 수 없거나 삭제 권한이 없습니다.',
      });
    }

    // 이미지 및 비디오 삭제 로직 추가
    const review = existingReview[0];
    
    // 새로운 mediaItems 처리
    if (review.mediaItems && review.mediaItems.length > 0) {
      const { deleteFromCloudflare, extractImageId } = await import('@/lib/cloudflare-images');
      const { deleteFromCloudflareStream, extractVideoId } = await import('@/lib/cloudflare-stream');
      
      const deletePromises = review.mediaItems.map(async (item) => {
        try {
          if (item.type === 'image') {
            const imageId = extractImageId(item.url);
            if (imageId) {
              await deleteFromCloudflare(imageId);
            }
          } else if (item.type === 'video') {
            const videoId = extractVideoId(item.url);
            if (videoId) {
              await deleteFromCloudflareStream(videoId);
            }
          }
        } catch (error) {
          console.error(`Failed to delete ${item.type} ${item.url}:`, error);
          // 미디어 삭제 실패해도 리뷰는 삭제 진행
        }
      });
      
      await Promise.allSettled(deletePromises);
    }
    // 기존 imageUrls 호환성 유지
    else if (review.imageUrls && review.imageUrls.length > 0) {
      const { deleteFromCloudflare, extractImageId } = await import('@/lib/cloudflare-images');
      
      const deletePromises = review.imageUrls.map(async (url) => {
        try {
          const imageId = extractImageId(url);
          if (imageId) {
            await deleteFromCloudflare(imageId);
          }
        } catch (error) {
          console.error(`Failed to delete image ${url}:`, error);
          // 이미지 삭제 실패해도 리뷰는 삭제 진행
        }
      });
      
      await Promise.allSettled(deletePromises);
    }

    await ctx.db.delete(reviews).where(eq(reviews.id, input.id));

    return { success: true };
  }),

  // Like functionality
  toggleLike: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingLike = await ctx.db
        .select()
        .from(reviewLikes)
        .where(
          and(
            eq(reviewLikes.reviewId, input.reviewId),
            eq(reviewLikes.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingLike.length > 0) {
        await ctx.db
          .delete(reviewLikes)
          .where(eq(reviewLikes.id, existingLike[0].id));
        return { liked: false };
      } else {
        await ctx.db.insert(reviewLikes).values({
          reviewId: input.reviewId,
          userId: ctx.userId,
        });

        // Create notification
        const helpers = notificationHelpers({ db: ctx.db });
        await helpers.onReviewLiked(input.reviewId, ctx.userId);

        return { liked: true };
      }
    }),

  // Bookmark functionality
  toggleBookmark: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingBookmark = await ctx.db
        .select()
        .from(reviewBookmarks)
        .where(
          and(
            eq(reviewBookmarks.reviewId, input.reviewId),
            eq(reviewBookmarks.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingBookmark.length > 0) {
        await ctx.db
          .delete(reviewBookmarks)
          .where(eq(reviewBookmarks.id, existingBookmark[0].id));
        return { bookmarked: false };
      } else {
        await ctx.db.insert(reviewBookmarks).values({
          reviewId: input.reviewId,
          userId: ctx.userId,
        });
        return { bookmarked: true };
      }
    }),

  // Report functionality
  report: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        reason: z.enum(['spam', 'inappropriate', 'misleading', 'other']),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingReport = await ctx.db
        .select()
        .from(reviewReports)
        .where(
          and(
            eq(reviewReports.reviewId, input.reviewId),
            eq(reviewReports.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingReport.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '이미 신고한 리뷰입니다.',
        });
      }

      await ctx.db.insert(reviewReports).values({
        reviewId: input.reviewId,
        userId: ctx.userId,
        reason: input.reason,
        description: input.description,
      });

      return { success: true };
    }),

  // Get user's bookmarked reviews
  getBookmarked: protectedProcedure
    .input(infiniteQueryInput.optional())
    .query(async ({ ctx, input }) => {
      const { limit = 20, cursor } = input || {};
      const queryLimit = limit + 1;

      const whereConditions = [eq(reviewBookmarks.userId, ctx.userId)];

      if (cursor) {
        whereConditions.push(lt(reviewBookmarks.createdAt, new Date(cursor)));
      }

      const bookmarkedReviews = await ctx.db
        .select({
          bookmark: reviewBookmarks,
          review: reviews,
          user: users,
          event: events,
          likeCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviewLikes}
            WHERE ${reviewLikes.reviewId} = ${reviews.id}
          )`,
          commentCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${comments}
            WHERE ${comments.reviewId} = ${reviews.id}
          )`,
        })
        .from(reviewBookmarks)
        .innerJoin(reviews, eq(reviewBookmarks.reviewId, reviews.id))
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(events, eq(reviews.eventId, events.id))
        .where(and(...whereConditions))
        .orderBy(desc(reviewBookmarks.createdAt))
        .limit(queryLimit);

      let nextCursor: string | undefined = undefined;
      let hasNextPage = false;

      if (bookmarkedReviews.length > limit) {
        hasNextPage = true;
        const nextItem = bookmarkedReviews.pop();
        nextCursor = nextItem!.bookmark.createdAt.toISOString();
      }

      return {
        items: bookmarkedReviews.map(
          ({ review, user, event, likeCount, commentCount }) => ({
            ...review,
            user,
            event,
            likeCount,
            commentCount,
            isLiked: false, // Will be fetched separately if needed
            isBookmarked: true,
          })
        ),
        nextCursor,
        hasNextPage,
      };
    }),
});
