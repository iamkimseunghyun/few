import { Skeleton, SkeletonText, SkeletonAvatar } from '@/modules/shared/ui/components/Skeleton';

export function DiaryListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <DiaryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DiaryCardSkeleton() {
  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>

      <Skeleton className="aspect-square w-full" />

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8 ml-auto" />
        </div>

        <SkeletonText />

        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>

        <Skeleton className="h-3 w-24" />
      </div>
    </article>
  );
}

export function DiaryDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative">
          <Skeleton className="aspect-square w-full rounded-lg" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonAvatar className="h-12 w-12" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          <SkeletonText />

          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>

            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>

            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <SkeletonAvatar className="h-8 w-8" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}