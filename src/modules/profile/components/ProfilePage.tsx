'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/trpc';
import { ReviewCard } from '@/modules/reviews';
import { DiaryCard } from '@/modules/music-diary/components/DiaryCard';
import type { ReviewWithDetails } from '@/modules/reviews/types';
import { 
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';

interface ProfilePageProps {
  profileUserId: string;
}

export function ProfilePage({ profileUserId }: ProfilePageProps) {
  const { userId: currentUserId } = useAuth();
  const isOwnProfile = currentUserId === profileUserId;
  const [activeTab, setActiveTab] = useState<'threads' | 'replies' | 'reposts'>('threads');
  const [isFollowing, setIsFollowing] = useState(false);

  // 사용자 정보 가져오기
  const { data: profileUser, isLoading: userLoading } = api.users.getById.useQuery(
    { id: profileUserId },
    { enabled: !!profileUserId }
  );

  // 사용자의 다이어리 가져오기
  const { data: diariesData, isLoading: diariesLoading } = api.musicDiary.getUserDiaries.useQuery(
    { userId: profileUserId },
    { enabled: !!profileUserId }
  );

  // 사용자의 리뷰 가져오기
  const { data: reviews, isLoading: reviewsLoading } = api.reviews.getUserReviews.useQuery(
    { userId: profileUserId },
    { enabled: !!profileUserId }
  );

  // 통계 정보
  const { data: reviewerStats } = api.reviewsEnhanced.getReviewerStats.useQuery(
    { userId: profileUserId },
    { enabled: !!profileUserId }
  );

  const diaries = diariesData || [];
  const allContent = [...(diaries || []), ...(reviews || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (userLoading || diariesLoading || reviewsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">사용자를 찾을 수 없습니다</h1>
          <Link href="/" className="text-muted-foreground hover:text-foreground underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const getReviewerLevelBadge = (level: string) => {
    const badges = {
      seedling: '🌱',
      regular: '🌿',
      expert: '🌳',
      master: '⭐',
    };
    return badges[level as keyof typeof badges] || '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Threads 스타일 프로필 헤더 */}
      <div className="mx-auto max-w-2xl">
        <div className="p-4 sm:p-6">
          {/* 프로필 정보 섹션 */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {profileUser.username || '사용자'}
                  {reviewerStats?.reviewerLevel && (
                    <span className="text-lg">
                      {getReviewerLevelBadge(reviewerStats.reviewerLevel)}
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  @{profileUser.username?.toLowerCase() || 'user'}
                </p>
              </div>
              <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                {profileUser.imageUrl ? (
                  <Image
                    src={profileUser.imageUrl}
                    alt={profileUser.username || '프로필'}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {profileUser.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
            </div>


            {/* 통계 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>
                <strong className="text-foreground">{allContent.length}</strong> 게시물
              </span>
              <span>
                <strong className="text-foreground">{reviewerStats?.totalLikesReceived || 0}</strong> 좋아요
              </span>
              {reviewerStats?.bestReviewCount ? (
                <span>
                  <strong className="text-foreground">{reviewerStats.bestReviewCount}</strong> 베스트
                </span>
              ) : null}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/settings/profile"
                    className="flex-1 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    프로필 편집
                  </Link>
                  <Link
                    href="/diary?view=insights"
                    className="flex-1 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    인사이트 보기
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex-1 px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isFollowing
                      ? 'border hover:bg-muted'
                      : 'bg-foreground text-background hover:opacity-90'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinusIcon className="w-4 h-4" />
                      팔로잉
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      팔로우
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('threads')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'threads'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                스레드
                {activeTab === 'threads' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'replies'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                답글
                {activeTab === 'replies' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reposts')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'reposts'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                리포스트
                {activeTab === 'reposts' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div>
          {activeTab === 'threads' ? (
            <div>
              {allContent.length > 0 ? (
                allContent.map((item) => {
                  // 다이어리인지 리뷰인지 확인
                  const isDiary = 'media' in item;
                  
                  if (isDiary) {
                    return (
                      <div key={`diary-${item.id}`} className="border-b">
                        <DiaryCard 
                          diary={item} 
                          user={profileUser}
                          isLiked={false}
                          isSaved={false}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={`review-${item.id}`} className="border-b">
                        <ReviewCard review={{
                          ...item,
                          user: profileUser,
                          isLiked: false,
                          isBookmarked: false
                        } as ReviewWithDetails} />
                      </div>
                    );
                  }
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="text-center">
                    <CalendarDaysIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      아직 작성한 콘텐츠가 없습니다
                    </p>
                    {isOwnProfile && (
                      <p className="text-sm text-muted-foreground">
                        첫 순간을 기록해보세요!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'replies' ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <p className="text-muted-foreground">
                  답글이 표시됩니다
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <p className="text-muted-foreground">
                  리포스트가 표시됩니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

