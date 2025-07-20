import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

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
  reviewerLevel: varchar('reviewer_level', { length: 20 })
    .default('seedling')
    .notNull(), // seedling, regular, expert, master
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;