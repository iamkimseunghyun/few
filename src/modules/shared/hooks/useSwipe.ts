import { useRef, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocity?: number; // Minimum velocity for swipe (default: 0.5)
  preventDefaultTouchmoveEvent?: boolean;
  trackTouch?: boolean;
}

export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const {
    threshold = 50,
    velocity = 0.5,
    preventDefaultTouchmoveEvent = false,
    trackTouch = true,
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);
  const trackingTouch = useRef(false);

  useEffect(() => {
    if (!trackTouch) return;

    const handleTouchStart = (e: TouchEvent) => {
      trackingTouch.current = true;
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: new Date().getTime(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!trackingTouch.current) return;

      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }

      touchEnd.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: new Date().getTime(),
      };
    };

    const handleTouchEnd = () => {
      if (!trackingTouch.current) return;

      if (!touchStart.current || !touchEnd.current) {
        trackingTouch.current = false;
        return;
      }

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const deltaTime = touchEnd.current.time - touchStart.current.time;
      const velocityX = Math.abs(deltaX / deltaTime);
      const velocityY = Math.abs(deltaY / deltaTime);

      // Determine if it's a horizontal or vertical swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (
        isHorizontal &&
        Math.abs(deltaX) > threshold &&
        velocityX > velocity
      ) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (
        !isHorizontal &&
        Math.abs(deltaY) > threshold &&
        velocityY > velocity
      ) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      trackingTouch.current = false;
      touchStart.current = null;
      touchEnd.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, {
      passive: !preventDefaultTouchmoveEvent,
    });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, velocity, preventDefaultTouchmoveEvent, trackTouch]);
}

// Hook for swipeable elements
export function useSwipeElement(
  elementRef: React.RefObject<HTMLElement | null>,
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    velocity = 0.5,
    preventDefaultTouchmoveEvent = false,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStart: { x: number; y: number; time: number } | null = null;
    let touchEnd: { x: number; y: number; time: number } | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: new Date().getTime(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }

      touchEnd = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: new Date().getTime(),
      };
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const deltaTime = touchEnd.time - touchStart.time;
      const velocityX = Math.abs(deltaX / deltaTime);
      const velocityY = Math.abs(deltaY / deltaTime);

      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (
        isHorizontal &&
        Math.abs(deltaX) > threshold &&
        velocityX > velocity
      ) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (
        !isHorizontal &&
        Math.abs(deltaY) > threshold &&
        velocityY > velocity
      ) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStart = null;
      touchEnd = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, {
      passive: !preventDefaultTouchmoveEvent,
    });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers, threshold, velocity, preventDefaultTouchmoveEvent]);
}
