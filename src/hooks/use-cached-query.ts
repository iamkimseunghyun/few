import { api } from '@/lib/trpc-client';

/**
 * 이벤트 관련 캐싱된 쿼리 훅
 */
export const useCachedEvents = {
  list: (filters?: Parameters<typeof api.events.getAll.useQuery>[0]) => {
    return api.events.getAll.useQuery(filters);
  },
  
  detail: (id: string) => {
    return api.events.getById.useQuery({ id });
  },
  
  upcoming: () => {
    return api.events.getUpcoming.useQuery();
  },
  
  popular: () => {
    return api.events.getPopular.useQuery();
  },
  
  bookmarked: () => {
    return api.events.getBookmarked.useQuery();
  },
};

/**
 * 리뷰 관련 캐싱된 쿼리 훅
 */
export const useCachedReviews = {
  list: (filters?: Parameters<typeof api.reviews.getAll.useQuery>[0]) => {
    return api.reviews.getAll.useQuery(filters);
  },
  
  detail: (id: string) => {
    return api.reviews.getById.useQuery({ id });
  },
  
  userReviews: (userId: string) => {
    return api.reviews.getUserReviews.useQuery({ userId });
  },
  
  bookmarked: () => {
    return api.reviews.getBookmarked.useQuery();
  },
  
  // reviewsEnhanced router를 사용해야 함
  best: (limit: number = 10) => {
    return api.reviewsEnhanced.getBestReviews.useQuery({ limit });
  },
};

/**
 * 사용자 관련 캐싱된 쿼리 훅
 */
export const useCachedUser = {
  current: () => {
    return api.users.getCurrentUser.useQuery();
  },
  
  profile: (userId: string) => {
    return api.user.getProfile.useQuery({ userId });
  },
  
  followers: (userId: string) => {
    return api.user.getFollowers.useQuery({ userId });
  },
  
  following: (userId: string) => {
    return api.user.getFollowing.useQuery({ userId });
  },
};

/**
 * 알림 관련 캐싱된 쿼리 훅
 */
export const useCachedNotifications = {
  list: (options?: { limit?: number; cursor?: string; onlyUnread?: boolean; types?: string[] }) => {
    return api.notifications.getAll.useQuery(options || {});
  },
  
  unreadCount: () => {
    return api.notifications.getUnreadCount.useQuery();
  },
};