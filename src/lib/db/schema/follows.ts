import { pgTable, text, timestamp, unique, index, check } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const follows = pgTable('follows', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  followerId: text('follower_id').references(() => users.id).notNull(),
  followingId: text('following_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // 중복 팔로우 방지를 위한 unique constraint
  uniqueFollow: unique('unique_follow').on(table.followerId, table.followingId),
  
  // 자기 자신을 팔로우하지 못하도록 하는 check constraint
  checkNoSelfFollow: check('check_no_self_follow', sql`${table.followerId} != ${table.followingId}`),
  
  // 성능 개선을 위한 인덱스
  followerIdIdx: index('idx_follows_follower_id').on(table.followerId),
  followingIdIdx: index('idx_follows_following_id').on(table.followingId),
  createdAtIdx: index('idx_follows_created_at').on(table.createdAt.desc()),
}));

// Type exports for TypeScript
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;