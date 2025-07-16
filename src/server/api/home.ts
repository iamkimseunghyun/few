import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { events, reviews, users } from '@/lib/db/schema';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { paginationInput } from './schemas';

export const homeRouter = createTRPCRouter({
  searchReviews: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const searchPattern = `%${input.query}%`;

      const results = await ctx.db
        .select({
          review: reviews,
          user: users,
          event: events,
          likeCount: sql<number>`(
            SELECT COUNT(*)::int FROM review_likes
            WHERE review_likes.review_id = ${reviews.id}
          )`,
          commentCount: sql<number>`(
            SELECT COUNT(*)::int FROM comments
            WHERE comments.review_id = ${reviews.id}
          )`,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(events, eq(reviews.eventId, events.id))
        .where(
          or(
            like(reviews.content, searchPattern),
            like(events.name, searchPattern),
            like(events.location, searchPattern),
            like(users.username, searchPattern)
          )
        )
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit);

      return results.map(
        ({ review, user, event, likeCount, commentCount }) => ({
          ...review,
          user,
          event,
          likeCount,
          commentCount,
        })
      );
    }),

  getFeed: publicProcedure
    .input(
      paginationInput
        .extend({
          filter: z.enum(['all', 'following', 'popular']).default('all'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 10, cursor: offset = '0', filter = 'all' } = input || {};
      const offsetNum = parseInt(offset);

      // Base query 구성
      const baseSelect = {
        review: reviews,
        user: users,
        event: events,
        likeCount: sql<number>`(
        SELECT COUNT(*)::int FROM review_likes
        WHERE review_likes.review_id = ${reviews.id}
      )`,
        commentCount: sql<number>`(
        SELECT COUNT(*)::int FROM comments
        WHERE comments.review_id = ${reviews.id}
      )`,
        isLiked: ctx.userId
          ? sql<boolean>`EXISTS(
            SELECT 1 FROM review_likes
            WHERE review_likes.review_id = ${reviews.id}
            AND review_likes.user_id = ${ctx.userId}
          )`
          : sql<boolean>`false`,
        isBookmarked: ctx.userId
          ? sql<boolean>`EXISTS(
            SELECT 1 FROM review_bookmarks
            WHERE review_bookmarks.review_id = ${reviews.id}
            AND review_bookmarks.user_id = ${ctx.userId}
          )`
          : sql<boolean>`false`,
      };

      // 필터에 따라 다른 쿼리 실행
      let feedItems;

      if (filter === 'popular') {
        feedItems = await ctx.db
          .select(baseSelect)
          .from(reviews)
          .leftJoin(users, eq(reviews.userId, users.id))
          .leftJoin(events, eq(reviews.eventId, events.id))
          .orderBy(
            sql`(
            SELECT COUNT(*) FROM review_likes
            WHERE review_likes.review_id = ${reviews.id}
          ) DESC`,
            desc(reviews.createdAt)
          )
          .limit(limit + 1)
          .offset(offsetNum);
      } else {
        feedItems = await ctx.db
          .select(baseSelect)
          .from(reviews)
          .leftJoin(users, eq(reviews.userId, users.id))
          .leftJoin(events, eq(reviews.eventId, events.id))
          .orderBy(desc(reviews.createdAt))
          .limit(limit + 1)
          .offset(offsetNum);
      }

      const hasMore = feedItems.length > limit;
      if (hasMore) {
        feedItems.pop();
      }

      return {
        items: feedItems.map(
          ({
            review,
            user,
            event,
            likeCount,
            commentCount,
            isLiked,
            isBookmarked,
          }) => ({
            id: review.id,
            content: review.content,
            overallRating: review.overallRating,
            imageUrls: review.imageUrls,
            tags: review.tags,
            createdAt: review.createdAt,
            author: {
              id: user?.id || '',
              username: user?.username || '알 수 없음',
              imageUrl: user?.imageUrl || null,
            },
            event: {
              id: event?.id || '',
              name: event?.name || '알 수 없는 이벤트',
              category: event?.category || null,
              location: event?.location || null,
              dates: event?.dates || null,
            },
            stats: {
              likeCount,
              commentCount,
              isLiked,
              isBookmarked,
            },
          })
        ),
        nextCursor: hasMore ? String(offsetNum + limit) : undefined,
      };
    }),

  getTrendingEvents: publicProcedure
    .input(paginationInput.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;

      // Get events with most reviews in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingEvents = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
            AND ${reviews.createdAt} >= ${thirtyDaysAgo}
          )`,
          avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews.overallRating}), 0)::float
            FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
          )`,
          recentReviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
            AND ${reviews.createdAt} >= ${thirtyDaysAgo}
          )`,
        })
        .from(events)
        .orderBy(
          sql`(
          SELECT COUNT(*) FROM ${reviews}
          WHERE ${reviews.eventId} = ${events.id}
          AND ${reviews.createdAt} >= ${thirtyDaysAgo}
        ) DESC`
        )
        .limit(limit);

      return trendingEvents.map(
        ({ event, reviewCount, avgRating, recentReviewCount }) => ({
          ...event,
          stats: {
            reviewCount,
            avgRating,
            recentReviewCount,
          },
        })
      );
    }),

  getRecommendedEvents: publicProcedure
    .input(paginationInput.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;

      // For now, get high-rated events with few reviews (hidden gems)
      const recommendedEvents = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
          )`,
          avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews.overallRating}), 0)::float
            FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
          )`,
        })
        .from(events)
        .where(
          sql`(
            SELECT COUNT(*) FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
          ) BETWEEN 3 AND 20
          AND (
            SELECT AVG(${reviews.overallRating})
            FROM ${reviews}
            WHERE ${reviews.eventId} = ${events.id}
          ) >= 4.0`
        )
        .orderBy(
          sql`(
          SELECT AVG(${reviews.overallRating})
          FROM ${reviews}
          WHERE ${reviews.eventId} = ${events.id}
        ) DESC`
        )
        .limit(limit);

      return recommendedEvents.map(({ event, reviewCount, avgRating }) => ({
        ...event,
        stats: {
          reviewCount,
          avgRating,
        },
      }));
    }),
});
