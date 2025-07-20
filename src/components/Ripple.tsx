'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RippleProps {
  color?: string;
  duration?: number;
  className?: string;
}

interface RippleItem {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function Ripple({ 
  color = 'rgba(0, 0, 0, 0.1)', 
  duration = 600,
  className 
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addRipple = useCallback((event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    let x: number;
    let y: number;

    if ('touches' in event && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left - size / 2;
      y = event.touches[0].clientY - rect.top - size / 2;
    } else if ('clientX' in event) {
      x = event.clientX - rect.left - size / 2;
      y = event.clientY - rect.top - size / 2;
    } else {
      return;
    }

    const newRipple: RippleItem = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    timeoutRef.current = setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  }, [duration]);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleMouseDown = (e: Event) => {
      addRipple(e as unknown as MouseEvent);
    };

    const handleTouchStart = (e: Event) => {
      addRipple(e as unknown as TouchEvent);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleTouchStart);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [addRipple]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}