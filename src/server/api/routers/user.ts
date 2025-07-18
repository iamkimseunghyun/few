import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { users, follows } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { notificationHelpers } from '@/server/utils/notifications';

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      return user;
    }),
    
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      // Get follower and following counts
      const [followerCountResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followingId, input.userId));
        
      const [followingCountResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followerId, input.userId));
        
      // Get diary count
      const diaryCountResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as count FROM music_diaries WHERE user_id = ${input.userId}`
      );
      
      // Check if current user follows this user
      let isFollowing = false;
      if (ctx.userId) {
        const followRecord = await ctx.db.query.follows.findFirst({
          where: and(
            eq(follows.followerId, ctx.userId),
            eq(follows.followingId, input.userId)
          ),
        });
        isFollowing = !!followRecord;
      }
      
      return {
        user,
        followerCount: Number(followerCountResult?.count || 0),
        followingCount: Number(followingCountResult?.count || 0),
        diaryCount: Number(diaryCountResult.rows?.[0]?.count || 0),
        isFollowing,
        favoriteArtists: [], // TODO: Implement favorite artists
      };
    }),
    
  toggleFollow: protectedProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot follow yourself',
        });
      }
      
      // Check if target user exists
      const targetUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.targetUserId),
      });
      
      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      // Check if already following
      const existingFollow = await ctx.db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.userId),
          eq(follows.followingId, input.targetUserId)
        ),
      });
      
      if (existingFollow) {
        // Unfollow
        await ctx.db
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, ctx.userId),
              eq(follows.followingId, input.targetUserId)
            )
          );
        return { following: false };
      } else {
        // Follow
        await ctx.db.insert(follows).values({
          followerId: ctx.userId,
          followingId: input.targetUserId,
        });
        
        // Create notification
        const helpers = notificationHelpers({ db });
        await helpers.onUserFollowed(input.targetUserId, ctx.userId);
        
        return { following: true };
      }
    }),
    
  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const followers = await ctx.db
        .select({
          user: users,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, input.userId))
        .orderBy(desc(follows.createdAt))
        .limit(input.limit)
        .offset(input.offset);
        
      // Check if current user follows each follower
      const followersWithStatus = await Promise.all(
        followers.map(async ({ user, followedAt }) => {
          let isFollowing = false;
          if (ctx.userId) {
            const followRecord = await ctx.db.query.follows.findFirst({
              where: and(
                eq(follows.followerId, ctx.userId),
                eq(follows.followingId, user.id)
              ),
            });
            isFollowing = !!followRecord;
          }
          
          return {
            user,
            followedAt,
            isFollowing,
          };
        })
      );
      
      return followersWithStatus;
    }),
    
  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const following = await ctx.db
        .select({
          user: users,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, input.userId))
        .orderBy(desc(follows.createdAt))
        .limit(input.limit)
        .offset(input.offset);
        
      // Check if current user follows each user
      const followingWithStatus = await Promise.all(
        following.map(async ({ user, followedAt }) => {
          let isFollowing = false;
          if (ctx.userId) {
            const followRecord = await ctx.db.query.follows.findFirst({
              where: and(
                eq(follows.followerId, ctx.userId),
                eq(follows.followingId, user.id)
              ),
            });
            isFollowing = !!followRecord;
          }
          
          return {
            user,
            followedAt,
            isFollowing,
          };
        })
      );
      
      return followingWithStatus;
    }),
});