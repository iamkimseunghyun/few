interface SkeletonLoaderProps {
  variant: "text" | "card" | "avatar" | "button" | "image";
  className?: string;
  count?: number;
}

export function SkeletonLoader({ 
  variant, 
  className = "",
  count = 1 
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variantClasses = {
    text: "h-4 w-full",
    card: "h-48 w-full rounded-lg",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-lg",
    image: "aspect-square w-full rounded-lg",
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} />
        ))}
      </>
    );
  }

  return <div className={skeletonClass} />;
}

export function ReviewCardSkeleton() {
  return (
    <div className="border-b border-gray-100 bg-white p-4 sm:p-6">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <SkeletonLoader variant="avatar" />
          <div className="space-y-2">
            <SkeletonLoader variant="text" className="h-4 w-24" />
            <SkeletonLoader variant="text" className="h-3 w-32" />
          </div>
        </div>
        <SkeletonLoader variant="text" className="h-3 w-16" />
      </div>
      <div className="mb-3">
        <SkeletonLoader variant="text" className="h-4 w-20" />
      </div>
      <div className="mb-4 space-y-2">
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" className="w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
        <SkeletonLoader variant="image" />
        <SkeletonLoader variant="image" />
        <SkeletonLoader variant="image" className="hidden sm:block" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="button" className="h-8 w-16" />
        <SkeletonLoader variant="button" className="h-8 w-16" />
        <SkeletonLoader variant="button" className="h-8 w-16" />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <SkeletonLoader variant="image" className="aspect-[16/9]" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <SkeletonLoader variant="text" className="h-5 w-3/4" />
          <SkeletonLoader variant="button" className="h-6 w-16" />
        </div>
        <SkeletonLoader variant="text" className="h-3 w-1/2" />
        <SkeletonLoader variant="text" className="h-3 w-2/3" />
      </div>
    </div>
  );
}