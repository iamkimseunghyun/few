'use client';

import { useInfiniteScroll } from '@/modules/shared/hooks/useInfiniteScroll';
import { LoadingSpinner } from './LoadingSpinner';

interface InfiniteFeedProps<T> {
  items: T[];
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  loader?: React.ReactNode;
  className?: string;
}

export function InfiniteFeed<T>({
  items,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  renderItem,
  loader,
  className = '',
}: InfiniteFeedProps<T>) {
  const { ref } = useInfiniteScroll({
    hasNextPage: hasMore,
    isFetchingNextPage: isLoading,
    fetchNextPage: onLoadMore,
    enabled: !isLoading,
  });

  return (
    <div className={className}>
      {items.map((item, index) => renderItem(item, index))}
      
      {/* Loading trigger for infinite scroll */}
      <div ref={ref} className="py-4">
        {isLoading && (
          loader || (
            <div className="flex justify-center">
              <LoadingSpinner size="sm" message="더 불러오는 중..." />
            </div>
          )
        )}
      </div>
    </div>
  );
}