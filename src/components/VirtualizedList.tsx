'use client';

import { useRef, useCallback, type ReactElement } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll } from '@/modules/shared/hooks/useInfiniteScroll';
import { LoadingSpinner } from '@/modules/shared/ui/components/LoadingSpinner';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactElement;
  itemHeight?: number | ((index: number) => number);
  overscan?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  gap?: number;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  estimatedItemSize?: number;
}

function VirtualizedListInner<T>({
    items,
    renderItem,
    itemHeight = 200,
    overscan = 5,
    hasNextPage = false,
    isFetchingNextPage = false,
    fetchNextPage,
    gap = 16,
    className = '',
    emptyMessage = '항목이 없습니다.',
  }: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> }) {
    const parentRef = useRef<HTMLDivElement>(null);
    const scrollRef = parentRef;

    // 가상화 설정
    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => (scrollRef as React.RefObject<HTMLDivElement>).current,
      estimateSize: useCallback(
        (index: number) => {
          if (typeof itemHeight === 'function') {
            return itemHeight(index);
          }
          return itemHeight;
        },
        [itemHeight]
      ),
      overscan,
      gap,
    });

    // 무한 스크롤 설정
    const { ref: observerRef } = useInfiniteScroll({
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage: fetchNextPage || (() => {}),
    });

    // 빈 상태
    if (items.length === 0 && !isFetchingNextPage) {
      return (
        <div className="flex h-64 items-center justify-center text-gray-500">
          {emptyMessage}
        </div>
      );
    }

    const virtualItems = virtualizer.getVirtualItems();

    return (
      <div ref={scrollRef} className={`relative h-full overflow-auto ${className}`}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderItem(item, virtualItem.index)}
              </div>
            );
          })}
        </div>

        {/* 로딩 인디케이터 */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasNextPage && <div ref={observerRef} className="h-10" />}
      </div>
    );
}

// Type-safe wrapper component
const VirtualizedListComponent = <T,>(props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> }) => {
  return <VirtualizedListInner {...props} />;
};

VirtualizedListComponent.displayName = 'VirtualizedList';

export const VirtualizedList = VirtualizedListComponent as <T>(props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> }) => ReactElement;

// 그리드 레이아웃을 위한 가상화 컴포넌트
interface VirtualizedGridProps<T> extends Omit<VirtualizedListProps<T>, 'itemHeight'> {
  columns: number;
  rowHeight: number;
  responsive?: boolean;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns: defaultColumns,
  rowHeight,
  responsive = true,
  overscan = 3,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  gap = 16,
  className = '',
  emptyMessage = '항목이 없습니다.',
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // 반응형 컬럼 수 계산
  const getColumns = useCallback(() => {
    if (!responsive || !parentRef.current) return defaultColumns;
    
    const width = parentRef.current.offsetWidth;
    if (width < 640) return 1; // 모바일
    if (width < 1024) return 2; // 태블릿
    return defaultColumns; // 데스크톱
  }, [defaultColumns, responsive]);

  // 행 단위로 아이템 그룹화
  const rows = [];
  const columns = getColumns();
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  const renderRow = useCallback(
    (row: T[], rowIndex: number) => (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {row.map((item, colIndex) => (
          <div key={rowIndex * columns + colIndex}>
            {renderItem(item, rowIndex * columns + colIndex)}
          </div>
        ))}
      </div>
    ),
    [columns, gap, renderItem]
  );

  return (
    <VirtualizedList
      ref={parentRef}
      items={rows}
      renderItem={renderRow}
      itemHeight={rowHeight}
      overscan={overscan}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      gap={gap}
      className={className}
      emptyMessage={emptyMessage}
    />
  );
}