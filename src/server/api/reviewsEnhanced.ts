import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '@/server/trpc';
import {
  reviews,
  users,
  reviewHelpful,
} from '@/lib/db/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';

export const reviewsEnhancedRouter = createTRPCRouter({
  // Toggle helpful vote
  toggleHelpful: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingVote = await ctx.db
        .select()
        .from(reviewHelpful)
        .where(
          and(
            eq(reviewHelpful.reviewId, input.reviewId),
            eq(reviewHelpful.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        await ctx.db
          .delete(reviewHelpful)
          .where(eq(reviewHelpful.id, existingVote[0].id));
        
        // Update helpful count
        await ctx.db
          .update(reviews)
          .set({ helpfulCount: sql`helpful_count - 1` })
          .where(eq(reviews.id, input.reviewId));
          
        return { helpful: false };
      } else {
        await ctx.db.insert(reviewHelpful).values({
          reviewId: input.reviewId,
          userId: ctx.userId,
        });
        
        // Update helpful count
        await ctx.db
          .update(reviews)
          .set({ helpfulCount: sql`helpful_count + 1` })
          .where(eq(reviews.id, input.reviewId));
          
        return { helpful: true };
      }
    }),

  // Get best reviews
  getBestReviews: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        eventId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(reviews.isBestReview, true)];
      
      if (input.eventId) {
        whereConditions.push(eq(reviews.eventId, input.eventId));
      }

      const bestReviews = await ctx.db
        .select()
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(reviews.bestReviewDate))
        .limit(input.limit);

      return bestReviews.map(result => ({
        ...result.reviews,
        user: result.users,
      }));
    }),

  // Update best reviews (admin only) - run this periodically
  updateBestReviews: adminProcedure
    .mutation(async ({ ctx }) => {
      // Reset all best reviews
      await ctx.db
        .update(reviews)
        .set({ isBestReview: false, bestReviewDate: null });

      // Select new best reviews based on criteria
      const topReviews = await ctx.db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          score: sql<number>`
            ${reviews.likeCount} * 3 + 
            ${reviews.commentCount} * 2 + 
            ${reviews.helpfulCount} * 4 +
            CASE WHEN json_array_length(${reviews.imageUrls}) > 0 THEN 5 ELSE 0 END +
            CASE WHEN char_length(${reviews.content}) > 200 THEN 5 ELSE 0 END
          `.as('score'),
        })
        .from(reviews)
        .where(sql`char_length(${reviews.content}) >= 100`) // Minimum 100 characters
        .orderBy(desc(sql`score`))
        .limit(20); // Top 20 reviews

      // Mark them as best reviews
      if (topReviews.length > 0) {
        const reviewIds = topReviews.map(r => r.id);
        await ctx.db
          .update(reviews)
          .set({ isBestReview: true, bestReviewDate: new Date() })
          .where(inArray(reviews.id, reviewIds));
          
        // Update best review count for users
        const userIds = [...new Set(topReviews.map(r => r.userId))];
        for (const userId of userIds) {
          const count = topReviews.filter(r => r.userId === userId).length;
          await ctx.db
            .update(users)
            .set({ 
              bestReviewCount: sql`best_review_count + ${count}`,
              totalLikesReceived: sql`(
                SELECT COALESCE(SUM(like_count), 0)
                FROM reviews
                WHERE user_id = ${userId}
              )`
            })
            .where(eq(users.id, userId));
        }
        
        // Update reviewer levels
        await updateReviewerLevels(ctx.db);
      }

      return { updated: topReviews.length };
    }),

  // Get reviewer stats
  getReviewerStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));

      if (!user) {
        return null;
      }

      return {
        reviewCount: user.reviewCount,
        totalLikesReceived: user.totalLikesReceived,
        bestReviewCount: user.bestReviewCount,
        reviewerLevel: user.reviewerLevel,
        levelInfo: getReviewerLevelInfo(user.reviewerLevel),
      };
    }),
});

// Helper function to update reviewer levels
import type { db as Database } from '@/lib/db/server';

async function updateReviewerLevels(db: typeof Database) {
  // Update all users' reviewer levels based on their stats
  await db.execute(sql`
    UPDATE users
    SET reviewer_level = CASE
      WHEN review_count >= 50 AND best_review_count >= 5 THEN 'master'
      WHEN review_count >= 21 AND best_review_count >= 2 THEN 'expert'
      WHEN review_count >= 6 THEN 'regular'
      ELSE 'seedling'
    END
  `);
}

// Helper function to get reviewer level info
function getReviewerLevelInfo(level: string) {
  const levels = {
    seedling: {
      name: '새싹 리뷰어',
      icon: '🌱',
      description: '리뷰 1-5개',
      nextLevel: 'regular',
      nextRequirement: '리뷰 6개 이상',
    },
    regular: {
      name: '일반 리뷰어',
      icon: '🌿',
      description: '리뷰 6-20개',
      nextLevel: 'expert',
      nextRequirement: '리뷰 21개 이상, 베스트 리뷰 2개 이상',
    },
    expert: {
      name: '우수 리뷰어',
      icon: '🌳',
      description: '리뷰 21-49개, 베스트 리뷰 2개 이상',
      nextLevel: 'master',
      nextRequirement: '리뷰 50개 이상, 베스트 리뷰 5개 이상',
    },
    master: {
      name: '전문 리뷰어',
      icon: '⭐',
      description: '리뷰 50개 이상, 베스트 리뷰 5개 이상',
      nextLevel: null,
      nextRequirement: null,
    },
  };

  return levels[level as keyof typeof levels] || levels.seedling;
}