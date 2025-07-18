'use client';

import { VirtualizedList, VirtualizedGrid } from '@/components/VirtualizedList';
import { type ReactElement } from 'react';

interface VirtualizedInfiniteFeedProps<T> {
  items: T[];
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  renderItem: (item: T, index: number) => ReactElement;
  itemHeight?: number | ((index: number) => number);
  className?: string;
  emptyMessage?: string;
  gap?: number;
  overscan?: number;
}

export function VirtualizedInfiniteFeed<T>({
  items,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  renderItem,
  itemHeight = 200,
  className = '',
  emptyMessage = '항목이 없습니다.',
  gap = 16,
  overscan = 5,
}: VirtualizedInfiniteFeedProps<T>) {
  return (
    <VirtualizedList
      items={items}
      renderItem={renderItem}
      itemHeight={itemHeight}
      overscan={overscan}
      hasNextPage={hasMore}
      isFetchingNextPage={isLoading}
      fetchNextPage={onLoadMore}
      gap={gap}
      className={className}
      emptyMessage={emptyMessage}
    />
  );
}

interface VirtualizedInfiniteGridProps<T> {
  items: T[];
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  renderItem: (item: T, index: number) => ReactElement;
  columns?: number;
  rowHeight?: number;
  className?: string;
  emptyMessage?: string;
  gap?: number;
  responsive?: boolean;
}

export function VirtualizedInfiniteGrid<T>({
  items,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  renderItem,
  columns = 3,
  rowHeight = 300,
  className = '',
  emptyMessage = '항목이 없습니다.',
  gap = 16,
  responsive = true,
}: VirtualizedInfiniteGridProps<T>) {
  return (
    <VirtualizedGrid
      items={items}
      renderItem={renderItem}
      columns={columns}
      rowHeight={rowHeight}
      responsive={responsive}
      overscan={3}
      hasNextPage={hasMore}
      isFetchingNextPage={isLoading}
      fetchNextPage={onLoadMore}
      gap={gap}
      className={className}
      emptyMessage={emptyMessage}
    />
  );
}