import { type QueryClient } from '@tanstack/react-query';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';
import { queryKeys, CACHE_TIME } from '@/lib/react-query-config';
import { headers } from 'next/headers';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

// 서버 사이드에서 사용할 caller 생성
const createCaller = createCallerFactory(appRouter);

/**
 * 서버 사이드에서 tRPC API를 호출하기 위한 caller 생성
 */
async function getServerCaller() {
  // Next.js 서버 컴포넌트에서 헤더 가져오기
  const requestHeaders = await headers();
  
  // 서버 컨텍스트 생성 - FetchCreateContextFnOptions 형식에 맞게 수정
  const context = await createContext({
    req: {
      headers: requestHeaders,
    },
  } as FetchCreateContextFnOptions);
  
  return createCaller(context);
}

/**
 * 이벤트 상세 페이지 진입 시 필요한 데이터들을 프리페칭
 */
export async function prefetchEventDetails(
  queryClient: QueryClient,
  eventId: string
) {
  const caller = await getServerCaller();

  // 이벤트 상세 정보 프리페칭
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => caller.events.getById({ id: eventId }),
    staleTime: CACHE_TIME.STATIC.staleTime,
    gcTime: CACHE_TIME.STATIC.gcTime,
  });

  // 해당 이벤트의 리뷰들 프리페칭
  await queryClient.prefetchQuery({
    queryKey: queryKeys.reviews.list({ eventId }),
    queryFn: () => caller.reviews.getAll({ eventId }),
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
  });

  // 해당 이벤트의 다이어리들은 프리페칭하지 않음 (eventId 필터 미지원)
}

/**
 * 리뷰 상세 페이지 진입 시 필요한 데이터들을 프리페칭
 */
export async function prefetchReviewDetails(
  queryClient: QueryClient,
  reviewId: string
) {
  const caller = await getServerCaller();

  // 리뷰 상세 정보 프리페칭
  await queryClient.prefetchQuery({
    queryKey: queryKeys.reviews.detail(reviewId),
    queryFn: () => caller.reviews.getById({ id: reviewId }),
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
  });

  // 해당 리뷰의 댓글들 프리페칭
  await queryClient.prefetchQuery({
    queryKey: ['comments', 'getByReviewId', { reviewId }],
    queryFn: () => caller.comments.getByReviewId({ reviewId }),
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
  });
}

/**
 * 홈페이지 진입 시 필요한 데이터들을 프리페칭
 */
export async function prefetchHomeData(queryClient: QueryClient) {
  const caller = await getServerCaller();

  await Promise.all([
    // 인기 이벤트
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.popular(),
      queryFn: () => caller.events.getPopular(),
      staleTime: CACHE_TIME.DYNAMIC.staleTime * 2,
      gcTime: CACHE_TIME.DYNAMIC.gcTime * 2,
    }),

    // 다가오는 이벤트
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.upcoming(),
      queryFn: () => caller.events.getUpcoming(),
      staleTime: CACHE_TIME.DYNAMIC.staleTime,
      gcTime: CACHE_TIME.DYNAMIC.gcTime,
    }),

    // 베스트 리뷰
    queryClient.prefetchQuery({
      queryKey: queryKeys.reviews.best(),
      queryFn: () => caller.reviewsEnhanced.getBestReviews({ limit: 10 }),
      staleTime: CACHE_TIME.DYNAMIC.staleTime * 2,
      gcTime: CACHE_TIME.DYNAMIC.gcTime * 2,
    }),
  ]);
}

/**
 * 사용자 프로필 페이지 진입 시 필요한 데이터들을 프리페칭
 */
export async function prefetchUserProfile(
  queryClient: QueryClient,
  userId: string
) {
  const caller = await getServerCaller();

  await Promise.all([
    // 사용자 프로필 정보
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.profile(userId),
      queryFn: () => caller.user.getProfile({ userId }),
      staleTime: CACHE_TIME.USER.staleTime,
      gcTime: CACHE_TIME.USER.gcTime,
    }),

    // 사용자가 작성한 리뷰
    queryClient.prefetchQuery({
      queryKey: ['reviews', 'getUserReviews', { userId }],
      queryFn: () => caller.reviews.getUserReviews({ userId }),
      staleTime: CACHE_TIME.DYNAMIC.staleTime,
      gcTime: CACHE_TIME.DYNAMIC.gcTime,
    }),

    // 사용자가 작성한 다이어리 (첫 페이지만)
    queryClient.prefetchInfiniteQuery({
      queryKey: ['musicDiary', 'getFeed', { userId, limit: 20 }],
      queryFn: ({ pageParam }) => 
        caller.musicDiary.getFeed({ 
          userId, 
          limit: 20,
          cursor: pageParam as string | undefined,
        }),
      staleTime: CACHE_TIME.DYNAMIC.staleTime,
      gcTime: CACHE_TIME.DYNAMIC.gcTime,
      initialPageParam: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    }),
  ]);
}

/**
 * 이벤트 목록 페이지 프리페칭
 */
export async function prefetchEventsList(
  queryClient: QueryClient,
  filters?: {
    category?: 'festival' | 'concert' | 'performance' | 'exhibition' | 'overseas_tour';
    startDate?: string;
    endDate?: string;
  }
) {
  const caller = await getServerCaller();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['events', 'getAll', filters],
    queryFn: ({ pageParam }) => 
      caller.events.getAll({ 
        ...filters,
        limit: 20,
        cursor: pageParam as string | undefined,
      }),
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
    initialPageParam: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
  });
}

/**
 * 리뷰 목록 페이지 프리페칭
 */
export async function prefetchReviewsList(
  queryClient: QueryClient,
  filters?: {
    eventId?: string;
    sortBy?: 'latest' | 'popular';
  }
) {
  const caller = await getServerCaller();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['reviews', 'getAll', filters],
    queryFn: ({ pageParam }) => 
      caller.reviews.getAll({ 
        ...filters,
        limit: 20,
        cursor: pageParam as string | undefined,
      }),
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
    initialPageParam: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
  });
}