'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  refreshHeight?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  refreshHeight = 60,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    if (scrollTop === 0) {
      startYRef.current = touch.clientY;
      isPullingRef.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || startYRef.current === null || disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, refreshHeight * 1.5);
      setPullDistance(distance);
      
      if (distance > threshold) {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    }
  }, [disabled, isRefreshing, threshold, refreshHeight]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    
    isPullingRef.current = false;
    startYRef.current = null;
    
    if (isReady) {
      setIsRefreshing(true);
      setPullDistance(refreshHeight);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsReady(false);
      }
    } else {
      setPullDistance(0);
      setIsReady(false);
    }
  }, [disabled, isRefreshing, isReady, onRefresh, refreshHeight]);

  useEffect(() => {
    if (disabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isReady,
  };
}