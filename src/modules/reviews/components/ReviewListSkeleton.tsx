import { Skeleton, SkeletonText, SkeletonAvatar } from '@/modules/shared/ui/components/Skeleton';

export function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      <Skeleton className="h-6 w-3/4 mb-2" />
      
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="grid gap-2 mb-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      <SkeletonText className="mb-4" />

      <div className="flex gap-2 mb-4">
        <Skeleton className="h-48 w-32" />
        <Skeleton className="h-48 w-32" />
        <Skeleton className="h-48 w-32" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </article>
  );
}