'use client';

import { useState, useEffect, useRef } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounceMs?: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 5, debounceMs = 50 } = options;
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      setIsAtTop(scrollY < 10);
      
      if (Math.abs(scrollY - lastScrollY.current) < threshold) {
        ticking.current = false;
        return;
      }
      
      setIsScrollingDown(scrollY > lastScrollY.current);
      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        
        timeout.current = setTimeout(() => {
          window.requestAnimationFrame(updateScrollDirection);
        }, debounceMs);
        
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [threshold, debounceMs]);

  return { isScrollingDown, isAtTop };
}