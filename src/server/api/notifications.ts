import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { notifications, users, reviews, comments } from "@/lib/db/schema";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { idInput, paginationInput } from "./schemas";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      paginationInput.extend({
        onlyUnread: z.boolean().default(false),
        types: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 20, cursor, onlyUnread = false, types } = input || {};
      const offset = cursor ? parseInt(cursor) : 0;

      let whereConditions = [eq(notifications.userId, ctx.userId)];
      
      if (onlyUnread) {
        whereConditions.push(eq(notifications.isRead, false));
      }
      
      if (types && types.length > 0) {
        whereConditions.push(inArray(notifications.type, types));
      }

      const where = and(...whereConditions);

      const notificationsList = await ctx.db
        .select({
          notification: notifications,
          relatedUser: users,
        })
        .from(notifications)
        .leftJoin(
          users,
          sql`CASE 
            WHEN ${notifications.type} IN ('like', 'comment', 'reply', 'follow') 
            THEN ${notifications.relatedId}::text = ${users.id}
            ELSE false
          END`
        )
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1)
        .offset(offset);

      const hasMore = notificationsList.length > limit;
      if (hasMore) {
        notificationsList.pop();
      }

      return {
        items: notificationsList.map(({ notification, relatedUser }) => ({
          ...notification,
          relatedUser,
        })),
        nextCursor: hasMore ? String(offset + limit) : undefined,
      };
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const [result] = await ctx.db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.isRead, false)
          )
        );

      return result.count;
    }),

  markAsRead: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.userId)
          )
        )
        .returning({ id: notifications.id });

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "알림을 찾을 수 없습니다.",
        });
      }

      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const result = await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, ctx.userId),
            eq(notifications.isRead, false)
          )
        )
        .returning({ id: notifications.id });

      return { 
        success: true,
        count: result.length,
      };
    }),

  delete: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.userId)
          )
        )
        .returning({ id: notifications.id });

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "알림을 찾을 수 없습니다.",
        });
      }

      return { success: true };
    }),

  deleteAll: protectedProcedure
    .input(
      z.object({
        onlyRead: z.boolean().default(false),
      }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      const whereConditions = [eq(notifications.userId, ctx.userId)];
      
      if (input?.onlyRead) {
        whereConditions.push(eq(notifications.isRead, true));
      }

      const result = await ctx.db
        .delete(notifications)
        .where(and(...whereConditions))
        .returning({ id: notifications.id });

      return { 
        success: true,
        count: result.length,
      };
    }),

  // Get notification preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      // For now, return default preferences
      // In the future, this could be stored in a user_preferences table
      return {
        email: {
          enabled: false,
          likes: true,
          comments: true,
          replies: true,
          follows: true,
        },
        push: {
          enabled: false,
          likes: true,
          comments: true,
          replies: true,
          follows: true,
        },
      };
    }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        email: z.object({
          enabled: z.boolean(),
          likes: z.boolean(),
          comments: z.boolean(),
          replies: z.boolean(),
          follows: z.boolean(),
        }).partial(),
        push: z.object({
          enabled: z.boolean(),
          likes: z.boolean(),
          comments: z.boolean(),
          replies: z.boolean(),
          follows: z.boolean(),
        }).partial(),
      }).partial()
    )
    .mutation(async ({ ctx, input }) => {
      // For now, just return success
      // In the future, save to user_preferences table
      return { 
        success: true,
        preferences: input,
      };
    }),
});