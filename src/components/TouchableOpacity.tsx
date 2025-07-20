'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TouchableOpacityProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  activeOpacity?: number;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export const TouchableOpacity = ({ 
  children, 
  className, 
  activeOpacity = 0.7, 
  disabled = false, 
  ref,
  ...props 
}: TouchableOpacityProps) => {
    return (
      <div
        ref={ref}
        className={cn(
          'transition-opacity duration-150 ease-out',
          'active:transition-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{
          '--active-opacity': activeOpacity,
        } as React.CSSProperties}
        {...props}
      >
        <style jsx>{`
          div:active:not(:disabled) {
            opacity: var(--active-opacity);
          }
        `}</style>
        {children}
      </div>
    );
  };