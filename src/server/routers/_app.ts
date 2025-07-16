import { createTRPCRouter } from '@/server/trpc';
import { reviewsRouter } from '@/server/api/reviews';
import { homeRouter } from '@/server/api/home';
import { eventsRouter } from '@/server/api/events';
import { commentsRouter } from '@/server/api/comments';
import { notificationsRouter } from '@/server/api/notifications';
import { searchRouter } from '@/server/api/search';
import { usersRouter } from '@/server/api/users';
import { reviewsEnhancedRouter } from '@/server/api/reviewsEnhanced';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  reviews: reviewsRouter,
  home: homeRouter,
  events: eventsRouter,
  comments: commentsRouter,
  notifications: notificationsRouter,
  search: searchRouter,
  users: usersRouter,
  reviewsEnhanced: reviewsEnhancedRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;