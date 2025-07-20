import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { events } from './events';

export const reviews = pgTable('reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: text('event_id').references(() => events.id),
  eventName: varchar('event_name', { length: 256 }), // For free-form event names
  title: varchar('title', { length: 256 }).notNull(),
  // Ratings (1-5 scale)
  overallRating: integer('overall_rating').notNull(),
  soundRating: integer('sound_rating'),
  viewRating: integer('view_rating'),
  safetyRating: integer('safety_rating'),
  operationRating: integer('operation_rating'),
  // Details
  seatOrArea: varchar('seat_or_area', { length: 100 }),
  content: text('content').notNull(),
  imageUrls: json('image_urls').$type<string[]>(), // Deprecated - use mediaItems
  mediaItems: json('media_items').$type<Array<{
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    duration?: number;
  }>>().default([]),
  tags: json('tags').$type<string[]>(),
  // Review quality metrics
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  isBestReview: boolean('is_best_review').default(false).notNull(),
  bestReviewDate: timestamp('best_review_date'),
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Review interactions
export const reviewLikes = pgTable('review_likes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  reviewId: text('review_id')
    .references(() => reviews.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviewBookmarks = pgTable('review_bookmarks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  reviewId: text('review_id')
    .references(() => reviews.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviewReports = pgTable('review_reports', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  reviewId: text('review_id')
    .references(() => reviews.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  reason: varchar('reason', { length: 50 }).notNull(), // spam, inappropriate, etc.
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, reviewed, resolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Review helpful votes
export const reviewHelpful = pgTable('review_helpful', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  reviewId: text('review_id')
    .references(() => reviews.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewLike = typeof reviewLikes.$inferSelect;
export type NewReviewLike = typeof reviewLikes.$inferInsert;
export type ReviewBookmark = typeof reviewBookmarks.$inferSelect;
export type NewReviewBookmark = typeof reviewBookmarks.$inferInsert;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type NewReviewReport = typeof reviewReports.$inferInsert;
export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type NewReviewHelpful = typeof reviewHelpful.$inferInsert;