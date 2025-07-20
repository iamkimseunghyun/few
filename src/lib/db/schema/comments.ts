import {
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { reviews } from './reviews';

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

// Type exports for TypeScript
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;