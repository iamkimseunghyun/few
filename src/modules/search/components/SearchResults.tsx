"use client";

import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { SearchBar } from "@/modules/shared/search/components/SearchBar";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Star, User } from "lucide-react";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: results, isLoading } = api.search.global.useQuery(
    {
      query,
      limit: 20,
    },
    {
      enabled: !!query,
    }
  );

  const getTotalCount = () => {
    if (!results) return 0;
    return (
      results.events.length +
      results.reviews.length +
      (results.users?.length || 0) +
      (results.diaries?.length || 0)
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">검색</h1>
        <SearchBar />
      </div>

      {query && (
        <div className="mb-4">
          <p className="text-muted-foreground">
            &ldquo;{query}&rdquo; 검색 결과{" "}
            {results && (
              <span>
                (
                {
                  [
                    results.events.length > 0 && `이벤트 ${results.events.length}개`,
                    results.reviews.length > 0 && `리뷰 ${results.reviews.length}개`,
                    results.users?.length > 0 && `사용자 ${results.users.length}명`,
                    results.diaries?.length > 0 && `다이어리 ${results.diaries.length}개`
                  ].filter(Boolean).join(', ')
                }
                )
              </span>
            )}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        </div>
      ) : results && getTotalCount() > 0 ? (
        <div className="space-y-8">
          {/* Users Section */}
          {results.users && results.users.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">사용자</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                  >
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.username}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-foreground">
                        {user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        리뷰 {user.reviewCount || 0}개
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Diaries Section */}
          {results.diaries && results.diaries.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">다이어리</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.diaries.map((diary) => (
                  <Link
                    key={diary.id}
                    href={`/diary/${diary.id}`}
                    className="block rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {diary.media?.[0] && (
                      <div className="aspect-square relative">
                        <Image
                          src={diary.media[0].thumbnailUrl || diary.media[0].url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                        {diary.media.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            +{diary.media.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-medium text-foreground line-clamp-2">
                        {diary.caption || '캡션 없음'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{diary.user?.username}</span>
                        {diary.artists && diary.artists.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{diary.artists.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Events Section */}
          {results.events.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">이벤트</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {event.dates?.start && (
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.dates.start).toLocaleDateString('ko-KR', {
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
                      {event.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    {event.category && (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
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
              <h2 className="mb-4 text-xl font-semibold text-foreground">리뷰</h2>
              <div className="space-y-4">
                {results.reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {review.title && (
                          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
                            {review.title}
                          </h3>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {review.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{review.user?.username || '익명'}</span>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                          {review.eventName && (
                            <>
                              <span>•</span>
                              <span className="text-primary">{review.eventName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.overallRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-muted text-muted'
                            }`}
                          />
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
            <p className="mb-2 text-lg text-foreground">
              검색 결과가 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              다른 키워드로 검색해보세요
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">
            검색어를 입력하여 이벤트, 리뷰, 사용자, 다이어리를 찾아보세요
          </p>
        </div>
      )}
    </div>
  );
}