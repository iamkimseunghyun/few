import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { eventCategoryEnum } from './shared/enums';
import { users } from './users';

export const events = pgTable('events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 256 }).notNull(),
  category: eventCategoryEnum('category'), // enum 사용
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

export const eventBookmarks = pgTable(
  'event_bookmarks',
  {
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
  },
  (table) => ({
    uniqueBookmark: uniqueIndex('unique_event_bookmark').on(
      table.userId,
      table.eventId
    ),
  })
);

// Type exports for TypeScript
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventBookmark = typeof eventBookmarks.$inferSelect;
export type NewEventBookmark = typeof eventBookmarks.$inferInsert;