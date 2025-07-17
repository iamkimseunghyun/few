import { z } from 'zod';
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import { events, reviews, eventBookmarks } from '@/lib/db/schema';
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { dateRangeSchema, idInput, paginationInput } from './schemas';

const createEventSchema = z.object({
  name: z.string().min(1).max(256),
  category: z.string().max(50).optional(),
  location: z.string().max(500).optional(),
  dates: dateRangeSchema.optional(),
  description: z.string().max(2000).optional(),
  lineup: z.array(z.string()).max(100).optional(),
  posterUrl: z.string().url().optional(),
  ticketPriceRange: z.string().max(100).optional(),
  capacity: z.number().positive().optional(),
  organizer: z.string().max(200).optional(),
  website: z.string().url().optional(),
});

const updateEventSchema = createEventSchema.partial();

export const eventsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      paginationInput
        .extend({
          category: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.cursor ? parseInt(input.cursor) : 0;

      const whereConditions = [];

      if (input?.category) {
        whereConditions.push(eq(events.category, input.category));
      }

      if (input?.search) {
        const searchPattern = `%${input.search}%`;
        whereConditions.push(
          or(
            like(events.name, searchPattern),
            like(events.location, searchPattern)
            // like(events.description, searchPattern)
          )
        );
      }

      const where =
        whereConditions.length > 0
          ? whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions)
          : undefined;

      const eventsList = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
          avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.overall_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        })
        .from(events)
        .where(where)
        .orderBy(desc(events.createdAt))
        .limit(limit + 1)
        .offset(offset);

      const hasMore = eventsList.length > limit;
      if (hasMore) {
        eventsList.pop();
      }

      return {
        items: eventsList.map(({ event, reviewCount, avgRating }) => ({
          ...event,
          reviewCount,
          avgRating,
        })),
        nextCursor: hasMore ? String(offset + limit) : undefined,
      };
    }),

  getById: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select({
        event: events,
        reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.overall_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        avgSoundRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.sound_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
            AND ${reviews}.sound_rating IS NOT NULL
          )`,
        avgViewRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.view_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
            AND ${reviews}.view_rating IS NOT NULL
          )`,
        avgSafetyRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.safety_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
            AND ${reviews}.safety_rating IS NOT NULL
          )`,
        avgOperationRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.operation_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
            AND ${reviews}.operation_rating IS NOT NULL
          )`,
      })
      .from(events)
      .where(eq(events.id, input.id))
      .limit(1);

    if (!result.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '이벤트를 찾을 수 없습니다.',
      });
    }

    const { event, ...stats } = result[0];
    return {
      ...event,
      stats,
    };
  }),

  create: adminProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(events).values(input).returning();
      const event = Array.isArray(result) ? result[0] : result;

      return event;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateEventSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const result = await ctx.db
        .update(events)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();

      const updatedEvent = Array.isArray(result) ? result[0] : result;

      if (!updatedEvent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '이벤트를 찾을 수 없습니다.',
        });
      }

      return updatedEvent;
    }),

  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    // Check if event has reviews
    const reviewCount = await ctx.db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.eventId, input.id));

    if (reviewCount[0].count > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: '리뷰가 있는 이벤트는 삭제할 수 없습니다.',
      });
    }

    const result = await ctx.db
      .delete(events)
      .where(eq(events.id, input.id))
      .returning();

    const deletedEvent = Array.isArray(result) ? result[0] : result;

    if (!deletedEvent) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '이벤트를 찾을 수 없습니다.',
      });
    }

    return deletedEvent;
  }),

  // Get upcoming events
  getUpcoming: publicProcedure
    .input(paginationInput.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const today = new Date().toISOString();

      const upcomingEvents = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        })
        .from(events)
        .where(sql`${events.dates}->>'start' >= ${today}`)
        .orderBy(sql`${events.dates}->>'start' ASC`)
        .limit(limit);

      return upcomingEvents.map(({ event, reviewCount }) => ({
        ...event,
        reviewCount,
      }));
    }),

  // Get popular events (most reviewed)
  getPopular: publicProcedure
    .input(paginationInput.optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;

      const popularEvents = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
          avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.overall_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        })
        .from(events)
        .orderBy(
          sql`(
          SELECT COUNT(*) FROM ${reviews}
          WHERE ${reviews}.event_id = ${events}.id
        ) DESC`
        )
        .limit(limit);

      return popularEvents.map(({ event, reviewCount, avgRating }) => ({
        ...event,
        reviewCount,
        avgRating,
      }));
    }),

  // Get events by date range
  getByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        categories: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [
        sql`${events.dates}->>'start' <= ${input.endDate}`,
        sql`COALESCE(${events.dates}->>'end', ${events.dates}->>'start') >= ${input.startDate}`
      ];

      // Add category filter if provided
      if (input.categories && input.categories.length > 0) {
        whereConditions.push(
          sql`${events.category} = ANY(${input.categories})`
        );
      }

      // Add location filter if provided
      if (input.locations && input.locations.length > 0) {
        whereConditions.push(
          sql`${events.location} = ANY(${input.locations})`
        );
      }

      const eventsList = await ctx.db
        .select({
          event: events,
          reviewCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
          avgRating: sql<number>`(
            SELECT COALESCE(AVG(${reviews}.overall_rating), 0)::float
            FROM ${reviews}
            WHERE ${reviews}.event_id = ${events}.id
          )`,
        })
        .from(events)
        .where(and(...whereConditions))
        .orderBy(sql`${events.dates}->>'start' ASC`);

      return {
        items: eventsList.map(({ event, reviewCount, avgRating }) => ({
          ...event,
          reviewCount,
          avgRating,
        })),
      };
    }),

  // Get unique locations
  getLocations: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .selectDistinct({ location: events.location })
      .from(events)
      .where(sql`${events.location} IS NOT NULL AND ${events.location} != ''`)
      .orderBy(events.location);

    return result
      .map(r => r.location)
      .filter((location): location is string => location !== null);
  }),

  // Toggle bookmark
  toggleBookmark: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const existingBookmark = await ctx.db
        .select()
        .from(eventBookmarks)
        .where(
          and(
            eq(eventBookmarks.eventId, input.id),
            eq(eventBookmarks.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existingBookmark.length > 0) {
        // Remove bookmark
        await ctx.db
          .delete(eventBookmarks)
          .where(eq(eventBookmarks.id, existingBookmark[0].id));
        return { bookmarked: false };
      } else {
        // Add bookmark
        await ctx.db
          .insert(eventBookmarks)
          .values({
            eventId: input.id,
            userId: ctx.userId,
          });
        return { bookmarked: true };
      }
    }),

  // Get bookmarked events
  getBookmarked: protectedProcedure
    .input(paginationInput.optional())
    .query(async ({ ctx, input }) => {
      const { limit = 20, cursor } = input || {};

      const bookmarkedEvents = await ctx.db
        .select({
          event: events,
          bookmarkCreatedAt: eventBookmarks.createdAt,
        })
        .from(eventBookmarks)
        .innerJoin(events, eq(eventBookmarks.eventId, events.id))
        .where(eq(eventBookmarks.userId, ctx.userId))
        .orderBy(desc(eventBookmarks.createdAt))
        .limit(limit + 1)
        .offset(cursor ? parseInt(cursor) : 0);

      let nextCursor: typeof cursor | undefined = undefined;
      const items = bookmarkedEvents.slice(0, limit);
      
      if (bookmarkedEvents.length > limit) {
        nextCursor = cursor ? String(parseInt(cursor) + limit) : String(limit);
      }

      return {
        items: items.map(item => ({
          ...item.event,
          bookmarkCreatedAt: item.bookmarkCreatedAt,
        })),
        nextCursor,
      };
    }),

  // Check if event is bookmarked
  isBookmarked: protectedProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const bookmark = await ctx.db
        .select()
        .from(eventBookmarks)
        .where(
          and(
            eq(eventBookmarks.eventId, input.id),
            eq(eventBookmarks.userId, ctx.userId)
          )
        )
        .limit(1);

      return bookmark.length > 0;
    }),
});
