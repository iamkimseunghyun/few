'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc';
import { Button } from '@/modules/shared/ui/components/Button';
import { toast } from '@/modules/shared/hooks/useToast';
import {
  CalendarDaysIcon,
  MusicalNoteIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DiaryCard } from '@/modules/music-diary/components/DiaryCard';
import { FollowList } from './FollowList';
import { ReviewCard } from '@/modules/reviews';
import type { ReviewWithDetails } from '@/modules/reviews/types';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { userId: currentUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<'diaries' | 'reviews' | 'bookmarks' | 'events' | 'saved'>('diaries');
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);
  
  const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );
  
  const { data: diaries, isLoading: diariesLoading } = api.musicDiary.getUserDiaries.useQuery(
    { userId, limit: 20 },
    { enabled: !!userId && activeTab === 'diaries' }
  );
  
  const { data: savedDiaries, isLoading: savedLoading } = api.musicDiary.getSavedDiaries.useQuery(
    { limit: 20 },
    { enabled: !!userId && activeTab === 'saved' && userId === currentUserId }
  );
  
  const { data: reviews, isLoading: reviewsLoading } = api.reviews.getUserReviews.useQuery(
    undefined,
    { enabled: !!userId && activeTab === 'reviews' && userId === currentUserId }
  );
  
  const { data: bookmarkedReviews, isLoading: bookmarksLoading } = api.reviews.getBookmarked.useQuery(
    {},
    { enabled: !!userId && activeTab === 'bookmarks' && userId === currentUserId }
  );
  
  const { data: bookmarkedEvents, isLoading: eventsLoading } = api.events.getBookmarked.useQuery(
    {},
    { enabled: !!userId && activeTab === 'events' && userId === currentUserId }
  );
  
  const { mutate: toggleFollow, isPending: isFollowPending } = api.user.toggleFollow.useMutation({
    onSuccess: (data) => {
      // Refetch profile to update follow status and counts
      utils.user.getProfile.invalidate({ userId });
      if (data.following) {
        toast.success(`${profile?.user.username || '사용자'}님을 팔로우했습니다.`);
      } else {
        toast.info(`${profile?.user.username || '사용자'}님의 팔로우를 취소했습니다.`);
      }
    },
    onError: () => {
      toast.error('팔로우 요청에 실패했습니다.');
    },
  });
  
  const utils = api.useUtils();
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }
  
  const isOwnProfile = currentUserId === userId;
  
  // Determine what data to display based on active tab
  let displayData: unknown[] | null = null;
  let isLoading = false;
  
  switch (activeTab) {
    case 'diaries':
      displayData = diaries || null;
      isLoading = diariesLoading;
      break;
    case 'saved':
      displayData = savedDiaries || null;
      isLoading = savedLoading;
      break;
    case 'reviews':
      displayData = reviews || null;
      isLoading = reviewsLoading;
      break;
    case 'bookmarks':
      displayData = bookmarkedReviews?.items || null;
      isLoading = bookmarksLoading;
      break;
    case 'events':
      displayData = bookmarkedEvents?.items || null;
      isLoading = eventsLoading;
      break;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white border-b">
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200">
                {profile.user.imageUrl && (
                  <Image
                    src={profile.user.imageUrl}
                    alt={profile.user.username}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-2xl font-bold">{profile.user.username}</h1>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center sm:justify-start">
                    {isOwnProfile ? (
                      <Button variant="outline" size="sm">
                        <Cog6ToothIcon className="w-4 h-4 mr-1" />
                        프로필 편집
                      </Button>
                    ) : (
                      <Button
                        onClick={() => toggleFollow({ targetUserId: userId })}
                        disabled={isFollowPending || !currentUserId}
                        variant={profile.isFollowing ? 'outline' : 'default'}
                        size="sm"
                      >
                        {isFollowPending ? '처리 중...' : profile.isFollowing ? '팔로잉' : '팔로우'}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-semibold">{profile.diaryCount}</p>
                    <p className="text-sm text-gray-600">다이어리</p>
                  </div>
                  <button 
                    onClick={() => setShowFollowList('followers')}
                    className="text-center sm:text-left hover:opacity-80 transition-opacity"
                  >
                    <p className="text-lg font-semibold">{profile.followerCount}</p>
                    <p className="text-sm text-gray-600">팔로워</p>
                  </button>
                  <button 
                    onClick={() => setShowFollowList('following')}
                    className="text-center sm:text-left hover:opacity-80 transition-opacity"
                  >
                    <p className="text-lg font-semibold">{profile.followingCount}</p>
                    <p className="text-sm text-gray-600">팔로잉</p>
                  </button>
                </div>
                
                {/* Additional Info */}
                <div className="flex flex-col gap-2 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>
                      {formatDistanceToNow(new Date(profile.user.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })} 가입
                    </span>
                  </div>
                  {profile.favoriteArtists && profile.favoriteArtists.length > 0 && (
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <MusicalNoteIcon className="w-4 h-4" />
                      <span className="text-purple-600">
                        {profile.favoriteArtists.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('diaries')}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'diaries'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              다이어리 {profile.diaryCount > 0 && `(${profile.diaryCount})`}
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'reviews'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  작성한 리뷰 {reviews && `(${reviews.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'saved'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  저장한 다이어리 {savedDiaries && `(${savedDiaries.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'bookmarks'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  북마크한 리뷰 {bookmarkedReviews?.items && `(${bookmarkedReviews.items.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'events'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  관심 이벤트 {bookmarkedEvents?.items && `(${bookmarkedEvents.items.length})`}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="pb-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Diaries Tab */}
              {activeTab === 'diaries' && (
                displayData && displayData.length > 0 ? (
                  <div className="divide-y sm:space-y-4 sm:divide-y-0">
                    {(displayData as NonNullable<typeof diaries>).map((diary) => (
                      <DiaryCard
                        key={diary.id}
                        diary={diary}
                        user={profile.user}
                        isLiked={diary.isLiked || false}
                        isSaved={diary.isSaved || false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">아직 작성한 다이어리가 없습니다.</p>
                  </div>
                )
              )}
              
              {/* Saved Diaries Tab */}
              {activeTab === 'saved' && (
                displayData && displayData.length > 0 ? (
                  <div className="divide-y sm:space-y-4 sm:divide-y-0">
                    {(displayData as NonNullable<typeof savedDiaries>).map((item) => (
                      <DiaryCard
                        key={item.id}
                        diary={item}
                        user={item.user || null}
                        isLiked={item.isLiked || false}
                        isSaved={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">저장한 다이어리가 없습니다.</p>
                  </div>
                )
              )}
              
              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                displayData && displayData.length > 0 ? (
                  <div className="space-y-4">
                    {(displayData as NonNullable<typeof reviews>).map((review) => (
                      <div key={review.id} className="rounded-lg border border-gray-200 bg-white">
                        <ReviewCard review={{
                          ...review,
                          isLiked: false,
                          isBookmarked: false
                        } as ReviewWithDetails} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">아직 작성한 리뷰가 없습니다.</p>
                  </div>
                )
              )}
              
              {/* Bookmarked Reviews Tab */}
              {activeTab === 'bookmarks' && (
                displayData && displayData.length > 0 ? (
                  <div className="space-y-4">
                    {(displayData as NonNullable<typeof bookmarkedReviews>['items']).map((review) => (
                      <div key={review.id} className="rounded-lg border border-gray-200 bg-white">
                        <ReviewCard review={{
                          ...review,
                          isLiked: false,
                          isBookmarked: true
                        } as ReviewWithDetails} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">북마크한 리뷰가 없습니다.</p>
                  </div>
                )
              )}
              
              {/* Events Tab */}
              {activeTab === 'events' && (
                displayData && displayData.length > 0 ? (
                  <div className="space-y-4">
                    {(displayData as NonNullable<typeof bookmarkedEvents>['items']).map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
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
                          </div>
                          {event.category && (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                              {event.category}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">관심 이벤트가 없습니다.</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Follow List Modal */}
      {showFollowList && (
        <FollowList
          userId={userId}
          type={showFollowList}
          isOpen={true}
          onClose={() => setShowFollowList(null)}
        />
      )}
    </div>
  );
}