import { createTRPCRouter, adminProcedure, publicProcedure } from '@/server/trpc';
import { users } from '@/lib/db/schema';
import { eq, like, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const usersRouter = createTRPCRouter({
  // Get current user with admin status
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    // If not signed in, return null
    if (!ctx.userId) {
      return null;
    }
    
    const user = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    
    return user[0] || null;
  }),

  // Get user by ID
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      
      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      return user[0];
    }),

  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        offset: z.number().min(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset, search } = input;

      const baseQuery = ctx.db
        .select({
          id: users.id,
          username: users.username,
          imageUrl: users.imageUrl,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          reviewCount: users.reviewCount,
          reviewerLevel: users.reviewerLevel,
          totalLikesReceived: users.totalLikesReceived,
          bestReviewCount: users.bestReviewCount,
        })
        .from(users);

      const whereCondition = search && search.trim() 
        ? like(users.username, `%${search}%`)
        : undefined;

      const query = whereCondition 
        ? baseQuery.where(whereCondition).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
        : baseQuery.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

      const items = await query;

      // Check if there are more items
      const totalCountQuery = whereCondition
        ? ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(whereCondition)
        : ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(users);
      
      const totalCount = await totalCountQuery;

      const hasMore = offset + items.length < Number(totalCount[0].count);

      return {
        items,
        hasMore,
      };
    }),

  toggleAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current admin status
      const user = await ctx.db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Toggle admin status
      await ctx.db
        .update(users)
        .set({ isAdmin: !user[0].isAdmin })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});