'use client';

import { type ReactNode, type MouseEvent } from 'react';
import Link from 'next/link';
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  href?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  children: ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  hideOnScroll?: boolean;
  showOnlyAtTop?: boolean;
  ariaLabel?: string;
}

export function FloatingActionButton({
  href,
  onClick,
  children,
  className = '',
  position = 'bottom-right',
  hideOnScroll = true,
  showOnlyAtTop = false,
  ariaLabel,
}: FloatingActionButtonProps) {
  const { isScrollingDown, isAtTop } = useScrollDirection();
  
  // Determine visibility
  let isVisible = true;
  if (hideOnScroll && isScrollingDown && !isAtTop) {
    isVisible = false;
  }
  if (showOnlyAtTop && !isAtTop) {
    isVisible = false;
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6',
  };

  const baseClasses = cn(
    'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 ease-out',
    'hover:scale-110 hover:shadow-xl active:scale-95',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    positionClasses[position],
    {
      'translate-y-0 opacity-100': isVisible,
      'translate-y-20 opacity-0 pointer-events-none': !isVisible,
    },
    className
  );

  const content = (
    <>
      {children}
      <span className="sr-only">{ariaLabel || 'Floating action button'}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}