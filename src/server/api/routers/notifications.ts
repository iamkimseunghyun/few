import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { notifications, users } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const notificationsRouter = createTRPCRouter({
  // Get notifications for current user
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      
      const whereConditions = [
        eq(notifications.userId, ctx.userId),
        ...(cursor ? [sql`${notifications.createdAt} < ${new Date(cursor)}`] : []),
      ];
      
      const notificationsList = await db
        .select({
          notification: notifications,
          fromUser: users,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.relatedId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1);
      
      const hasNextPage = notificationsList.length > limit;
      const items = hasNextPage ? notificationsList.slice(0, -1) : notificationsList;
      const nextCursor = hasNextPage
        ? items[items.length - 1]?.notification.createdAt.toISOString()
        : null;
      
      return {
        items: items.map(({ notification, fromUser }) => ({
          ...notification,
          fromUser: notification.relatedType === 'user' ? fromUser : null,
        })),
        nextCursor,
      };
    }),
    
  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const [result] = await db
        .select({ count: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.isRead, false)
          )
        );
      
      return result?.count || 0;
    }),
    
  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.userId)
          )
        );
      
      return { success: true };
    }),
    
  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, ctx.userId));
      
      return { success: true };
    }),
    
  // Delete notification
  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.userId)
          )
        );
      
      return { success: true };
    }),
});