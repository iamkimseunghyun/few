'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { type ReactNode } from 'react';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const { containerRef, isRefreshing, pullDistance, isReady } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  const refreshHeight = 60;
  const scale = Math.min(pullDistance / refreshHeight, 1);
  const rotation = pullDistance * 3;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          marginTop: `-${pullDistance}px`,
          transition: isRefreshing ? 'none' : 'all 0.2s ease-out',
        }}
      >
        <div
          className={`flex items-center justify-center rounded-full bg-white shadow-lg ${
            isReady ? 'text-emerald-600' : 'text-stone-400'
          }`}
          style={{
            width: '40px',
            height: '40px',
            transform: `scale(${scale})`,
            opacity: scale,
          }}
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}