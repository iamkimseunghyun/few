"use client";

import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { SearchBar } from "@/modules/shared/search/components/SearchBar";
import Link from "next/link";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: results, isLoading } = api.search.global.useQuery(
    {
      query,
    },
    {
      enabled: !!query,
    }
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">검색</h1>
        <SearchBar />
      </div>

      {query && (
        <div className="mb-4">
          <p className="text-gray-600">
            "{query}" 검색 결과{" "}
            {results && `(이벤트 ${results.events.length}개, 리뷰 ${results.reviews.length}개)`}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        </div>
      ) : results && (results.events.length > 0 || results.reviews.length > 0) ? (
        <div className="space-y-8">
          {/* Events Section */}
          {results.events.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">이벤트</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                      {event.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {event.dates?.start && (
                        <p>
                          📅 {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {event.dates.end && event.dates.end !== event.dates.start && (
                            <span>
                              {' ~ '}
                              {new Date(event.dates.end).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </p>
                      )}
                      {event.location && <p>📍 {event.location}</p>}
                    </div>
                    {event.category && (
                      <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        {event.category}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {results.reviews.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">리뷰</h2>
              <div className="space-y-4">
                {results.reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {review.title && (
                          <h3 className="font-medium text-gray-900 hover:text-purple-600 transition-colors">
                            {review.title}
                          </h3>
                        )}
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {review.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <span>{review.user?.username || '익명'}</span>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                          {review.event && (
                            <>
                              <span>•</span>
                              <span className="text-purple-600">{review.event.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.overallRating ? 'fill-yellow-400' : 'fill-gray-200'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg text-gray-900">
              검색 결과가 없습니다
            </p>
            <p className="text-sm text-gray-600">
              다른 키워드로 검색해보세요
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-gray-600">
            검색어를 입력하여 이벤트와 리뷰를 찾아보세요
          </p>
        </div>
      )}
    </div>
  );
}