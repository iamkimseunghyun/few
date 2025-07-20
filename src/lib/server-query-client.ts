import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';
import { CACHE_TIME } from './react-query-config';

/**
 * 서버 사이드에서 사용할 QueryClient 생성
 * React의 cache를 사용해서 요청 당 하나의 인스턴스만 생성
 */
export const createServerQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 서버에서는 리페칭 비활성화
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
        // 기본 캐시 시간 설정
        gcTime: CACHE_TIME.DYNAMIC.gcTime,
      },
    },
  });
});