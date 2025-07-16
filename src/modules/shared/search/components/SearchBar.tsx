'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useDebounce } from '@/modules/shared/hooks/useDebounce';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Search results
  const { data: searchResults, isLoading } = api.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 1 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="이벤트, 리뷰, 아티스트 검색..."
          className="w-full rounded-lg border border-border bg-background px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && debouncedQuery.length > 1 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              검색 중...
            </div>
          ) : searchResults ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Events */}
              {searchResults.events.length > 0 && (
                <div>
                  <h3 className="border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
                    이벤트
                  </h3>
                  {searchResults.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium text-foreground">{event.name}</p>
                        {event.dates?.start && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.dates.start).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                      {event.category && (
                        <span className="text-xs text-muted-foreground">{event.category}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {searchResults.reviews.length > 0 && (
                <div>
                  <h3 className="border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
                    리뷰
                  </h3>
                  {searchResults.reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/reviews/${review.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="block px-4 py-2 hover:bg-muted"
                    >
                      <p className="font-medium text-foreground line-clamp-1">
                        {review.title || review.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.user?.username} • {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {/* No results */}
              {searchResults.events.length === 0 && searchResults.reviews.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다.
                </div>
              )}

              {/* View all results */}
              <Link
                href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={() => {
                  setIsOpen(false);
                }}
                className="block border-t border-border px-4 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
              >
                전체 검색 결과 보기
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}