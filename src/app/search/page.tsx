import { Suspense } from 'react';
import { SearchResults } from "@/modules/search";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold text-foreground">검색</h1>
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground">검색 결과를 불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}