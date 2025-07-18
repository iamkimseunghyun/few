import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { events, reviews, users, musicDiaries } from '@/lib/db/schema';
import { like, or, sql, desc, eq } from 'drizzle-orm';

export const searchRouter = createTRPCRouter({
  global: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const searchPattern = `%${input.query}%`;

      // Search events
      const eventsResults = await ctx.db
        .select()
        .from(events)
        .where(
          or(
            like(events.name, searchPattern),
            like(events.location, searchPattern),
            sql`${events.lineup}::text ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(events.createdAt))
        .limit(input.limit);

      // Search reviews
      const reviewsResults = await ctx.db
        .select({
          review: reviews,
          user: users,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(
          or(
            like(reviews.title, searchPattern),
            like(reviews.content, searchPattern),
            sql`${reviews.tags}::text ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit);

      // Search users
      const usersResults = await ctx.db
        .select()
        .from(users)
        .where(
          or(
            like(users.username, searchPattern),
            like(users.email, searchPattern)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(input.limit);

      // Search music diaries
      const diariesResults = await ctx.db
        .select({
          diary: musicDiaries,
          user: users,
        })
        .from(musicDiaries)
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(
          or(
            like(musicDiaries.caption, searchPattern),
            like(musicDiaries.location, searchPattern),
            sql`${musicDiaries.artists}::text ILIKE ${searchPattern}`,
            sql`${musicDiaries.moments}::text ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(musicDiaries.createdAt))
        .limit(input.limit);

      return {
        events: eventsResults,
        reviews: reviewsResults.map(({ review, user }) => ({
          ...review,
          user,
        })),
        users: usersResults,
        diaries: diariesResults.map(({ diary, user }) => ({
          ...diary,
          user,
        })),
      };
    }),
});