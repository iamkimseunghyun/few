"use client";

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollOptions {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  enabled?: boolean;
}

export function useInfiniteScroll({
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (enabled && inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, enabled]);

  return {
    ref,
    inView,
  };
}