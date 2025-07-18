import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { musicDiaries, diaryLikes, diaryComments, diarySaves } from '@/lib/db/schema/music-diary';
import { users, follows } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notificationHelpers } from '@/server/utils/notifications';

const mediaSchema = z.object({
  url: z.string(),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
});

const createDiarySchema = z.object({
  eventId: z.string().optional(),
  caption: z.string().optional(),
  location: z.string().optional(),
  media: z.array(mediaSchema).min(1).max(10),
  artists: z.array(z.string()).optional(),
  setlist: z.array(z.string()).optional(),
  moments: z.array(z.string()).optional(),
  mood: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const musicDiaryRouter = createTRPCRouter({
  // Create a new diary entry
  create: protectedProcedure
    .input(createDiarySchema)
    .mutation(async ({ ctx, input }) => {
      const diary = await db
        .insert(musicDiaries)
        .values({
          userId: ctx.userId,
          ...input,
        })
        .returning();

      return diary[0];
    }),

  // Get diary feed (with pagination)
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        cursor: z.string().optional(),
        userId: z.string().optional(), // Filter by specific user
        feedType: z.enum(['all', 'following']).optional().default('all'),
        sortBy: z.enum(['recent', 'popular']).optional().default('recent'),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, userId, feedType, sortBy } = input;
      const currentUserId = ctx.userId;

      const whereConditions = [
        eq(musicDiaries.isPublic, true),
        ...(userId ? [eq(musicDiaries.userId, userId)] : []),
      ];

      // Add following filter if needed
      if (feedType === 'following' && currentUserId) {
        whereConditions.push(
          sql`${musicDiaries.userId} IN (
            SELECT ${follows.followingId} 
            FROM ${follows} 
            WHERE ${follows.followerId} = ${currentUserId}
          )`
        );
      }

      // Add cursor condition based on sort type
      if (cursor) {
        if (sortBy === 'popular') {
          const [likeCount, createdAt] = cursor.split('_');
          whereConditions.push(
            sql`(${musicDiaries.likeCount} < ${likeCount}::int 
              OR (${musicDiaries.likeCount} = ${likeCount}::int 
                AND ${musicDiaries.createdAt} < ${createdAt}::timestamp))`
          );
        } else {
          whereConditions.push(sql`${musicDiaries.createdAt} < ${cursor}`);
        }
      }

      // Select query with proper ordering
      const orderByClause = sortBy === 'popular' 
        ? [desc(musicDiaries.likeCount), desc(musicDiaries.createdAt)]
        : [desc(musicDiaries.createdAt)];

      const diariesQuery = db
        .select({
          diary: musicDiaries,
          user: users,
          isLiked: currentUserId
            ? sql<boolean>`EXISTS (
                SELECT 1 FROM ${diaryLikes} 
                WHERE ${diaryLikes.diaryId} = ${musicDiaries.id} 
                AND ${diaryLikes.userId} = ${sql.raw(`'${currentUserId}'`)}
              )`
            : sql<boolean>`false`,
          isSaved: currentUserId
            ? sql<boolean>`EXISTS (
                SELECT 1 FROM ${diarySaves} 
                WHERE ${diarySaves.diaryId} = ${musicDiaries.id} 
                AND ${diarySaves.userId} = ${sql.raw(`'${currentUserId}'`)}
              )`
            : sql<boolean>`false`,
        })
        .from(musicDiaries)
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(...orderByClause)
        .limit(limit + 1);

      const diaries = await diariesQuery;

      const hasNextPage = diaries.length > limit;
      const items = hasNextPage ? diaries.slice(0, -1) : diaries;
      
      // Generate cursor based on sort type
      let nextCursor = null;
      if (hasNextPage && items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = sortBy === 'popular'
          ? `${lastItem.diary.likeCount}_${lastItem.diary.createdAt.toISOString()}`
          : lastItem.diary.createdAt.toISOString();
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Get single diary entry
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const diary = await db
        .select({
          diary: musicDiaries,
          user: users,
          isLiked: ctx.userId
            ? sql<boolean>`EXISTS (
                SELECT 1 FROM ${diaryLikes} 
                WHERE ${diaryLikes.diaryId} = ${musicDiaries.id} 
                AND ${diaryLikes.userId} = ${sql.raw(`'${ctx.userId}'`)}
              )`
            : sql<boolean>`false`,
          isSaved: ctx.userId
            ? sql<boolean>`EXISTS (
                SELECT 1 FROM ${diarySaves} 
                WHERE ${diarySaves.diaryId} = ${musicDiaries.id} 
                AND ${diarySaves.userId} = ${sql.raw(`'${ctx.userId}'`)}
              )`
            : sql<boolean>`false`,
        })
        .from(musicDiaries)
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(eq(musicDiaries.id, input.id))
        .limit(1);

      if (!diary[0]) {
        throw new Error('Diary entry not found');
      }

      // Increment view count
      await db
        .update(musicDiaries)
        .set({
          viewCount: sql`${musicDiaries.viewCount} + 1`,
        })
        .where(eq(musicDiaries.id, input.id));

      return diary[0];
    }),

  // Toggle like
  toggleLike: protectedProcedure
    .input(z.object({ diaryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(diaryLikes)
        .where(
          and(
            eq(diaryLikes.diaryId, input.diaryId),
            eq(diaryLikes.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Unlike
        await db
          .delete(diaryLikes)
          .where(eq(diaryLikes.id, existing[0].id));

        await db
          .update(musicDiaries)
          .set({
            likeCount: sql`${musicDiaries.likeCount} - 1`,
          })
          .where(eq(musicDiaries.id, input.diaryId));

        return { liked: false };
      } else {
        // Like
        await db.insert(diaryLikes).values({
          diaryId: input.diaryId,
          userId: ctx.userId,
        });

        await db
          .update(musicDiaries)
          .set({
            likeCount: sql`${musicDiaries.likeCount} + 1`,
          })
          .where(eq(musicDiaries.id, input.diaryId));

        // Create notification
        const helpers = notificationHelpers({ db });
        await helpers.onDiaryLiked(input.diaryId, ctx.userId);

        return { liked: true };
      }
    }),

  // Toggle save (bookmark)
  toggleSave: protectedProcedure
    .input(z.object({ diaryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(diarySaves)
        .where(
          and(
            eq(diarySaves.diaryId, input.diaryId),
            eq(diarySaves.userId, ctx.userId)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Unsave
        await db
          .delete(diarySaves)
          .where(eq(diarySaves.id, existing[0].id));

        return { saved: false };
      } else {
        // Save
        await db.insert(diarySaves).values({
          diaryId: input.diaryId,
          userId: ctx.userId,
        });

        return { saved: true };
      }
    }),

  // Add comment
  addComment: protectedProcedure
    .input(
      z.object({
        diaryId: z.string(),
        content: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await db
        .insert(diaryComments)
        .values({
          diaryId: input.diaryId,
          userId: ctx.userId,
          content: input.content,
        })
        .returning();

      // Update comment count
      await db
        .update(musicDiaries)
        .set({
          commentCount: sql`${musicDiaries.commentCount} + 1`,
        })
        .where(eq(musicDiaries.id, input.diaryId));

      // Create notification
      const helpers = notificationHelpers({ db });
      await helpers.onDiaryCommented(input.diaryId, ctx.userId, input.content);

      return comment[0];
    }),

  // Get comments
  getComments: publicProcedure
    .input(
      z.object({
        diaryId: z.string(),
        limit: z.number().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { diaryId, limit, cursor } = input;

      const whereConditions = [
        eq(diaryComments.diaryId, diaryId),
        ...(cursor ? [sql`${diaryComments.createdAt} < ${cursor}`] : []),
      ];

      const comments = await db
        .select({
          comment: diaryComments,
          user: users,
        })
        .from(diaryComments)
        .leftJoin(users, eq(diaryComments.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(diaryComments.createdAt))
        .limit(limit + 1);

      const hasNextPage = comments.length > limit;
      const items = hasNextPage ? comments.slice(0, -1) : comments;
      const nextCursor = hasNextPage
        ? items[items.length - 1]?.comment.createdAt.toISOString()
        : null;

      return {
        items: items.map(({ comment, user }) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: user ? {
            id: user.id,
            name: user.username,
            imageUrl: user.imageUrl,
          } : null,
        })),
        nextCursor,
      };
    }),

  // Delete diary entry
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const diary = await db
        .select()
        .from(musicDiaries)
        .where(eq(musicDiaries.id, input.id))
        .limit(1);

      if (!diary[0] || diary[0].userId !== ctx.userId) {
        throw new Error('Unauthorized');
      }

      // 이미지 및 비디오 삭제 로직 추가
      if (diary[0].media && diary[0].media.length > 0) {
        const { deleteFromCloudflare, extractImageId } = await import('@/lib/cloudflare-images');
        const { deleteFromCloudflareStream, extractVideoId } = await import('@/lib/cloudflare-stream');
        
        const deletePromises = diary[0].media.map(async (item) => {
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
            // 미디어 삭제 실패해도 다이어리는 삭제 진행
          }
        });
        
        await Promise.allSettled(deletePromises);
      }

      await db.delete(musicDiaries).where(eq(musicDiaries.id, input.id));

      return { success: true };
    }),

  // Update diary entry
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: createDiarySchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const diary = await db
        .select()
        .from(musicDiaries)
        .where(eq(musicDiaries.id, input.id))
        .limit(1);

      if (!diary[0] || diary[0].userId !== ctx.userId) {
        throw new Error('Unauthorized');
      }

      const updated = await db
        .update(musicDiaries)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(musicDiaries.id, input.id))
        .returning();

      return updated[0];
    }),

  // Get saved diaries
  getSaved: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        limit: z.number().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const targetUserId = input.userId || ctx.userId;

      const whereConditions = [
        eq(diarySaves.userId, targetUserId),
        ...(cursor ? [sql`${diarySaves.createdAt} < ${cursor}`] : []),
      ];

      const savedDiaries = await db
        .select({
          diary: musicDiaries,
          user: users,
          savedAt: diarySaves.createdAt,
        })
        .from(diarySaves)
        .innerJoin(musicDiaries, eq(diarySaves.diaryId, musicDiaries.id))
        .leftJoin(users, eq(musicDiaries.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(diarySaves.createdAt))
        .limit(limit + 1);

      const hasNextPage = savedDiaries.length > limit;
      const items = hasNextPage ? savedDiaries.slice(0, -1) : savedDiaries;
      const nextCursor = hasNextPage
        ? items[items.length - 1]?.savedAt.toISOString()
        : null;

      return {
        items,
        nextCursor,
      };
    }),
    
  getUserDiaries: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const diaries = await db
        .select({
          id: musicDiaries.id,
          userId: musicDiaries.userId,
          eventId: musicDiaries.eventId,
          media: musicDiaries.media,
          caption: musicDiaries.caption,
          location: musicDiaries.location,
          artists: musicDiaries.artists,
          setlist: musicDiaries.setlist,
          moments: musicDiaries.moments,
          mood: musicDiaries.mood,
          likeCount: musicDiaries.likeCount,
          commentCount: musicDiaries.commentCount,
          viewCount: musicDiaries.viewCount,
          isPublic: musicDiaries.isPublic,
          createdAt: musicDiaries.createdAt,
          updatedAt: musicDiaries.updatedAt,
        })
        .from(musicDiaries)
        .where(
          and(
            eq(musicDiaries.userId, input.userId),
            eq(musicDiaries.isPublic, true)
          )
        )
        .orderBy(desc(musicDiaries.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      const diariesWithLikes = await Promise.all(
        diaries.map(async (diary) => {
          let isLiked = false;
          let isSaved = false;
          
          if (ctx.userId) {
            const [like] = await db
              .select()
              .from(diaryLikes)
              .where(
                and(
                  eq(diaryLikes.diaryId, diary.id),
                  eq(diaryLikes.userId, ctx.userId)
                )
              );
            isLiked = !!like;
            
            const [save] = await db
              .select()
              .from(diarySaves)
              .where(
                and(
                  eq(diarySaves.diaryId, diary.id),
                  eq(diarySaves.userId, ctx.userId)
                )
              );
            isSaved = !!save;
          }
          
          return {
            ...diary,
            isLiked,
            isSaved,
          };
        })
      );
      
      return diariesWithLikes;
    }),
    
  getSavedDiaries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const savedDiaries = await db
        .select({
          diary: musicDiaries,
          savedAt: diarySaves.createdAt,
        })
        .from(diarySaves)
        .innerJoin(musicDiaries, eq(diarySaves.diaryId, musicDiaries.id))
        .where(eq(diarySaves.userId, ctx.userId))
        .orderBy(desc(diarySaves.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      const diariesWithMeta = await Promise.all(
        savedDiaries.map(async ({ diary, savedAt }) => {
          // Get user info
          const user = await db.query.users.findFirst({
            where: eq(users.id, diary.userId),
          });
          
          // Check if liked
          const [like] = await db
            .select()
            .from(diaryLikes)
            .where(
              and(
                eq(diaryLikes.diaryId, diary.id),
                eq(diaryLikes.userId, ctx.userId)
              )
            );
          
          return {
            ...diary,
            user,
            isLiked: !!like,
            isSaved: true,
            savedAt,
          };
        })
      );
      
      return diariesWithMeta;
    }),
});