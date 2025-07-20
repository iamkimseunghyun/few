// Common styling constants for card components
import React from 'react';

export const cardStyles = {
  // Container styles
  container: 'border-b border-border bg-background p-4 last:border-0 sm:p-6',
  
  // Header styles
  header: {
    wrapper: 'mb-3 flex items-start justify-between',
    userInfo: 'flex items-center gap-2 sm:gap-3',
    avatar: 'relative h-8 w-8 overflow-hidden rounded-full bg-muted sm:h-10 sm:w-10',
    username: 'truncate font-medium text-foreground text-sm sm:text-base',
    subtitle: 'truncate text-xs text-muted-foreground sm:text-sm',
    timestamp: 'text-xs text-muted-foreground sm:text-sm',
  },
  
  // Action button styles
  actions: {
    wrapper: 'flex items-center justify-between',
    buttonGroup: 'flex items-center gap-4',
    button: 'flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50',
    iconSize: 'h-5 w-5',
  },
  
  // Content styles
  content: {
    wrapper: 'space-y-3',
    text: 'text-sm',
    link: 'text-foreground/90 hover:text-foreground transition-colors',
  },
  
  // Media styles
  media: {
    wrapper: 'mb-4',
  },
  
  // Tag styles
  tags: {
    wrapper: 'flex flex-wrap gap-2',
    tag: 'rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground',
  },
  
  // Icon styles
  icons: {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    color: 'text-muted-foreground',
  },
  
  // Menu styles
  menu: {
    button: 'p-1 hover:bg-muted rounded transition-colors',
    dropdown: 'absolute right-0 mt-1 w-36 bg-background rounded-lg shadow-lg border z-20',
    item: 'block px-4 py-2 text-sm hover:bg-muted',
    itemDestructive: 'block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted',
  },
} as const;

// Common icon components with consistent styling
export const CardIcons = {
  Heart: ({ filled, className = '' }: { filled?: boolean; className?: string }) => (
    <svg
      className={`${cardStyles.actions.iconSize} ${filled ? 'fill-red-500 text-red-500' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  
  Bookmark: ({ filled, className = '' }: { filled?: boolean; className?: string }) => (
    <svg
      className={`${cardStyles.actions.iconSize} ${filled ? 'fill-foreground' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  ),
  
  Comment: ({ className = '' }: { className?: string }) => (
    <svg
      className={`${cardStyles.actions.iconSize} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
};