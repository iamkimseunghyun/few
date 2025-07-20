import { pgTable, text, varchar, json, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { events } from './events';

// Music diary entries (like Instagram posts)
export const musicDiaries = pgTable('music_diaries', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: text('event_id').references(() => events.id), // Optional event link
  
  // Content
  caption: text('caption'), // Post caption/description
  location: text('location'), // Location tag
  
  // Media files (support multiple images/videos)
  media: json('media').$type<{
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string; // For videos
    width?: number;
    height?: number;
    duration?: number; // For videos in seconds
  }[]>().notNull(),
  
  // Music/Event specific
  artists: json('artists').$type<string[]>(), // Tagged artists
  setlist: json('setlist').$type<string[]>(), // Songs performed
  moments: json('moments').$type<string[]>(), // Special moments tags (#앵콜무대 #떼창)
  mood: varchar('mood', { length: 50 }), // 감동적인, 신나는, 뭉클한, etc.
  weather: varchar('weather', { length: 50 }), // sunny, cloudy, rainy, snowy, etc.
  
  // Social features
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  
  // Privacy
  isPublic: boolean('is_public').default(true).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Diary likes
export const diaryLikes = pgTable('diary_likes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  diaryId: text('diary_id')
    .references(() => musicDiaries.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Diary comments
export const diaryComments = pgTable('diary_comments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  diaryId: text('diary_id')
    .references(() => musicDiaries.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Diary saves (bookmarks)
export const diarySaves = pgTable('diary_saves', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  diaryId: text('diary_id')
    .references(() => musicDiaries.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Media processing queue (for video thumbnails, compression, etc.)
export const mediaQueue = pgTable('media_queue', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  diaryId: text('diary_id')
    .references(() => musicDiaries.id, { onDelete: 'cascade' })
    .notNull(),
  originalUrl: text('original_url').notNull(),
  processedUrl: text('processed_url'),
  thumbnailUrl: text('thumbnail_url'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, completed, failed
  metadata: json('metadata').$type<{
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    format?: string;
    [key: string]: unknown;
  }>(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

// Type exports for TypeScript
export type MusicDiary = typeof musicDiaries.$inferSelect;
export type NewMusicDiary = typeof musicDiaries.$inferInsert;
export type DiaryLike = typeof diaryLikes.$inferSelect;
export type NewDiaryLike = typeof diaryLikes.$inferInsert;
export type DiaryComment = typeof diaryComments.$inferSelect;
export type NewDiaryComment = typeof diaryComments.$inferInsert;
export type DiarySave = typeof diarySaves.$inferSelect;
export type NewDiarySave = typeof diarySaves.$inferInsert;
export type MediaQueue = typeof mediaQueue.$inferSelect;
export type NewMediaQueue = typeof mediaQueue.$inferInsert;