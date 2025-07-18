import { type DefaultOptions } from '@tanstack/react-query';

// 캐싱 전략 상수
export const CACHE_TIME = {
  // 정적 데이터 (이벤트 정보, 카테고리 등)
  STATIC: {
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  },
  // 자주 변경되는 데이터 (리뷰, 댓글 등)
  DYNAMIC: {
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  },
  // 실시간성이 중요한 데이터 (알림, 채팅 등)
  REALTIME: {
    staleTime: 0, // 항상 fresh 데이터 요청
    gcTime: 1000 * 60 * 5, // 5분
  },
  // 사용자 데이터 (프로필, 설정 등)
  USER: {
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 60, // 1시간
  },
};

// React Query 기본 옵션
export const defaultQueryOptions: DefaultOptions = {
  queries: {
    // 기본 캐싱 전략
    staleTime: CACHE_TIME.DYNAMIC.staleTime,
    gcTime: CACHE_TIME.DYNAMIC.gcTime,
    
    // 네트워크 재연결 시 refetch
    refetchOnReconnect: true,
    
    // 윈도우 포커스 시 refetch 비활성화 (성능 최적화)
    refetchOnWindowFocus: false,
    
    // 백그라운드에서 refetch 활성화
    refetchInterval: false,
    refetchIntervalInBackground: false,
    
    // 재시도 전략
    retry: (failureCount, error) => {
      // 4xx 에러는 재시도하지 않음
      const httpStatus = (error as { data?: { httpStatus?: number } })?.data?.httpStatus;
      if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
        return false;
      }
      // 최대 3번 재시도
      return failureCount < 3;
    },
    
    // 재시도 지연 시간 (exponential backoff)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // 구조적 공유를 통한 리렌더링 최적화
    structuralSharing: true,
    
    // 쿼리 함수 에러 시 콘솔 에러 표시
    throwOnError: false,
  },
  
  mutations: {
    // mutation 재시도는 1번만
    retry: 1,
    
    // mutation 에러 시 콘솔 에러 표시하지 않음
    throwOnError: false,
  },
};

// 쿼리 키 팩토리
export const queryKeys = {
  all: ['all'] as const,
  
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    upcoming: () => [...queryKeys.events.all, 'upcoming'] as const,
    popular: () => [...queryKeys.events.all, 'popular'] as const,
    calendar: (year: number, month: number) => [...queryKeys.events.all, 'calendar', year, month] as const,
  },
  
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
    byEvent: (eventId: string) => [...queryKeys.reviews.all, 'byEvent', eventId] as const,
    byUser: (userId: string) => [...queryKeys.reviews.all, 'byUser', userId] as const,
    best: () => [...queryKeys.reviews.all, 'best'] as const,
  },
  
  users: {
    all: ['users'] as const,
    profile: (userId: string) => [...queryKeys.users.all, 'profile', userId] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    followers: (userId: string) => [...queryKeys.users.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.users.all, 'following', userId] as const,
  },
  
  comments: {
    all: ['comments'] as const,
    byReview: (reviewId: string) => [...queryKeys.comments.all, 'byReview', reviewId] as const,
    byDiary: (diaryId: string) => [...queryKeys.comments.all, 'byDiary', diaryId] as const,
  },
  
  diaries: {
    all: ['diaries'] as const,
    lists: () => [...queryKeys.diaries.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.diaries.lists(), filters] as const,
    details: () => [...queryKeys.diaries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.diaries.details(), id] as const,
    byEvent: (eventId: string) => [...queryKeys.diaries.all, 'byEvent', eventId] as const,
    byUser: (userId: string) => [...queryKeys.diaries.all, 'byUser', userId] as const,
  },
  
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
  
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, 'results', query] as const,
  },
} as const;