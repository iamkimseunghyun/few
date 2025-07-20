# Card Component Styling Guide

This guide documents the unified styling approach for DiaryCard and ReviewCard components to ensure visual consistency across the application.

## Core Principles

1. **Semantic Color Usage**: Use theme-aware color tokens (e.g., `text-muted-foreground`, `bg-background`) instead of hardcoded colors
2. **Consistent Spacing**: Unified padding and margins across all card components
3. **Interactive Feedback**: TouchFeedback wrapper for all interactive elements
4. **Responsive Design**: Mobile-first approach with sm: breakpoints

## Component Structure

### Container
```jsx
<article className="border-b border-border bg-background p-4 last:border-0 sm:p-6">
```

### Header Section
- **Avatar**: `h-8 w-8 sm:h-10 sm:w-10` with rounded-full
- **Username**: `text-sm sm:text-base` with font-medium
- **Subtitle**: `text-xs sm:text-sm` with text-muted-foreground
- **Timestamp**: `text-xs sm:text-sm` with text-muted-foreground

### Action Buttons
All action buttons follow this pattern:
```jsx
<TouchFeedback type="opacity" activeOpacity={0.6}>
  <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
    <Icon className="h-5 w-5" />
    <span>{count}</span>
  </button>
</TouchFeedback>
```

### Content Sections
- **Text**: Base text uses default foreground color
- **Tags/Moments**: `rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground`
- **Links**: `text-foreground/90 hover:text-foreground transition-colors`

## Color Tokens

Replace hardcoded colors with theme-aware tokens:
- `gray-600` → `muted-foreground`
- `gray-900` → `foreground`
- `gray-100` → `muted`
- `gray-50` → `muted`
- `white` → `background`
- `red-600` → `destructive`
- `purple-600` → `primary`
- `pink-600` → Use tag styling instead

## Icon Standards

- Action icons: `h-5 w-5`
- Decorative icons: `w-4 h-4`
- Icon color: Inherit from parent text color

## Implementation Checklist

- [x] DiaryCard: Updated all color tokens to semantic values
- [x] DiaryCard: Added TouchFeedback to all interactive elements
- [x] DiaryCard: Unified tag/moment styling with ReviewCard
- [x] ReviewCard: Added TouchFeedback to comment link and report button
- [x] ReviewCard: Ensured consistent color token usage
- [x] Created shared constants file for reusable styles
- [ ] Future: Consider extracting common card components (header, actions, etc.)

## Usage Example

```tsx
import { cardStyles, CardIcons } from '@/modules/shared/ui/constants/card-styles';
import { TouchFeedback } from '@/components/TouchFeedback';

// Use consistent styling
<article className={cardStyles.container}>
  <div className={cardStyles.header.wrapper}>
    {/* Header content */}
  </div>
  
  <div className={cardStyles.actions.wrapper}>
    <TouchFeedback type="opacity" activeOpacity={0.6}>
      <button className={cardStyles.actions.button}>
        <CardIcons.Heart filled={isLiked} />
        <span>{likeCount}</span>
      </button>
    </TouchFeedback>
  </div>
</article>
```