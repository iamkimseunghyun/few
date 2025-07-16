import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  username: varchar('username', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  imageUrl: text('image_url'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  // Reviewer stats
  reviewCount: integer('review_count').default(0).notNull(),
  totalLikesReceived: integer('total_likes_received').default(0).notNull(),
  bestReviewCount: integer('best_review_count').default(0).notNull(),
  reviewerLevel: varchar('reviewer_level', { length: 20 }).default('seedling').notNull(), // seedling, regular, expert, master
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 256 }).notNull(),
  category: varchar('category', { length: 50 }), // festival, concert, etc.
  location: text('location'),
  dates: json('dates').$type<{ start: string; end: string }>(), // JSON for date range
  description: text('description'),
  lineup: json('lineup').$type<string[]>(), // Array of artist names
  posterUrl: text('poster_url'),
  ticketPriceRange: varchar('ticket_price_range', { length: 255 }),
  capacity: integer('capacity'),
  organizer: varchar('organizer', { length: 255 }),
  website: text('website'),
  venueInfo: json('venue_info').$type<{
    name?: string;
    capacity?: number;
    sections?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: text('event_id')
    .references(() => events.id),
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
  imageUrls: json('image_urls').$type<string[]>(),
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

export const eventBookmarks = pgTable('event_bookmarks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueBookmark: uniqueIndex('unique_event_bookmark').on(table.userId, table.eventId),
}));

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

// Comments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const comments = pgTable('comments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  reviewId: text('review_id')
    .references(() => reviews.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  parentId: text('parent_id').references(() => comments.id), // for replies
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  type: varchar('type', { length: 50 }).notNull(), // like, comment, reply, follow
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedId: text('related_id'), // reviewId, commentId, etc.
  relatedType: varchar('related_type', { length: 50 }), // review, comment, user
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewLike = typeof reviewLikes.$inferSelect;
export type NewReviewLike = typeof reviewLikes.$inferInsert;
export type ReviewBookmark = typeof reviewBookmarks.$inferSelect;
export type NewReviewBookmark = typeof reviewBookmarks.$inferInsert;
export type EventBookmark = typeof eventBookmarks.$inferSelect;
export type NewEventBookmark = typeof eventBookmarks.$inferInsert;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type NewReviewReport = typeof reviewReports.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
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

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type NewReviewHelpful = typeof reviewHelpful.$inferInsert;
