'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  format, 
  startOfYear, 
  endOfYear,
  eachMonthOfInterval,
  eachDayOfInterval,
  isSameMonth,
  subDays,
  getDay
} from 'date-fns';
import { 
  MusicalNoteIcon,
  MapPinIcon,
  SparklesIcon,
  CalendarDaysIcon,
  PhotoIcon,
  ClockIcon,
  ChartBarIcon,
  HeartIcon,
  StarIcon,
  TrophyIcon,
  FireIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/trpc';
import { useAuth, useUser } from '@clerk/nextjs';
import type { musicDiaries } from '@/lib/db/schema';

interface DiaryInsightsProps {
  diaries: (typeof musicDiaries.$inferSelect)[];
}

export function DiaryInsights({ diaries }: DiaryInsightsProps) {
  const { userId } = useAuth();
  const { user } = useUser();

  // 리뷰 데이터 가져오기
  const { data: reviews } = api.reviews.getUserReviews.useQuery(undefined, {
    enabled: !!userId,
  });

  const { data: reviewerStats } = api.reviewsEnhanced.getReviewerStats.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const insights = useMemo(() => {
    // 기본 통계
    const totalDiaries = diaries.length;
    const totalReviews = reviews?.length || 0;
    const totalActivities = totalDiaries + totalReviews;
    
    const totalPhotos = diaries.reduce((sum, diary) => {
      const media = Array.isArray(diary.media) ? diary.media as {
        url: string;
        type: 'image' | 'video';
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
      }[] : [];
      return sum + media.filter(m => m.type === 'image').length;
    }, 0);

    const totalLikes = diaries.reduce((sum, diary) => sum + (diary.likeCount || 0), 0) + 
      (reviewerStats?.totalLikesReceived || 0);

    // 가장 많이 본 아티스트
    const artistCounts = new Map<string, number>();
    diaries.forEach(diary => {
      if (diary.artists && Array.isArray(diary.artists)) {
        (diary.artists as string[]).forEach(artist => {
          artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
        });
      }
    });
    // 리뷰에서도 아티스트 정보 추출 (태그에서)
    reviews?.forEach(review => {
      review.tags?.forEach(tag => {
        if (!tag.includes('장르') && !tag.includes('분위기')) {
          artistCounts.set(tag, (artistCounts.get(tag) || 0) + 1);
        }
      });
    });
    const topArtists = Array.from(artistCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // 가장 많이 방문한 장소
    const locationCounts = new Map<string, number>();
    diaries.forEach(diary => {
      if (diary.location) {
        locationCounts.set(diary.location, (locationCounts.get(diary.location) || 0) + 1);
      }
    });
    reviews?.forEach(review => {
      if (review.event?.location) {
        locationCounts.set(review.event.location, (locationCounts.get(review.event.location) || 0) + 1);
      }
    });
    const topLocations = Array.from(locationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // 활동 히트맵 데이터 (최근 1년)
    const today = new Date();
    const yearAgo = subDays(today, 365);
    const days = eachDayOfInterval({ start: yearAgo, end: today });
    
    const activityMap = new Map<string, number>();
    [...diaries, ...(reviews || [])].forEach(item => {
      const date = format(new Date(item.createdAt), 'yyyy-MM-dd');
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    const heatmapData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = activityMap.get(dateStr) || 0;
      return { date: day, count };
    });

    // 월별 활동
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    const monthlyActivity = months.map(month => {
      const diaryCount = diaries.filter(diary => 
        isSameMonth(new Date(diary.createdAt), month)
      ).length;
      const reviewCount = reviews?.filter(review => 
        isSameMonth(new Date(review.createdAt), month)
      ).length || 0;
      return { month, count: diaryCount + reviewCount, diaryCount, reviewCount };
    });

    // 시간대별 활동
    const hourCounts = new Array(24).fill(0);
    [...diaries, ...(reviews || [])].forEach(item => {
      const hour = new Date(item.createdAt).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // 베스트 콘텐츠
    const bestDiary = diaries.reduce((best, diary) => 
      (diary.likeCount || 0) > (best?.likeCount || 0) ? diary : best
    , diaries[0]);

    const bestReview = reviews?.reduce((best, review) => 
      (review.likeCount || 0) > (best?.likeCount || 0) ? review : best
    , reviews[0]);

    return {
      totalActivities,
      totalDiaries,
      totalReviews,
      totalPhotos,
      totalLikes,
      topArtists,
      topLocations,
      monthlyActivity,
      peakHour,
      heatmapData,
      bestDiary,
      bestReview,
      bestReviewCount: reviewerStats?.bestReviewCount || 0,
    };
  }, [diaries, reviews, reviewerStats]);

  const getActivityLevel = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-green-300';
    if (count === 2) return 'bg-green-400';
    if (count === 3) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getReviewerLevelBadge = (level: string) => {
    const badges = {
      seedling: '🌱',
      regular: '🌿',
      expert: '🌳',
      master: '⭐',
    };
    return badges[level as keyof typeof badges] || '';
  };

  if (diaries.length === 0 && (!reviews || reviews.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 mb-4 text-muted-foreground">
          <ChartBarIcon className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium mb-2">아직 분석할 데이터가 없어요</h3>
        <p className="text-muted-foreground">순간을 기록하면 인사이트를 볼 수 있어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 정보 */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.username || '프로필'}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {user?.username || '사용자'}
              {reviewerStats?.reviewerLevel && (
                <span className="text-lg">
                  {getReviewerLevelBadge(reviewerStats.reviewerLevel)}
                </span>
              )}
            </h2>
            <p className="text-muted-foreground">
              {user?.createdAt && format(new Date(user.createdAt), 'yyyy년 MM월')}부터 활동
            </p>
          </div>
        </div>

        {/* 종합 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {insights.totalActivities}
            </div>
            <p className="text-sm text-muted-foreground">총 활동</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{insights.totalDiaries}</div>
            <p className="text-sm text-muted-foreground">순간</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{insights.totalReviews}</div>
            <p className="text-sm text-muted-foreground">기록</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{insights.totalLikes}</div>
            <p className="text-sm text-muted-foreground">받은 좋아요</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">{insights.bestReviewCount}</div>
            <p className="text-sm text-muted-foreground">베스트 리뷰</p>
          </div>
        </div>
      </div>

      {/* 활동 히트맵 */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold mb-4">올해의 활동</h3>
        <div className="overflow-x-auto">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1 pb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className="w-3 h-3 text-[10px] flex items-center justify-center text-muted-foreground">
                {i % 2 === 0 ? day : ''}
              </div>
            ))}
            {insights.heatmapData.map((data, index) => {
              const dayOfWeek = getDay(data.date);
              return (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm ${getActivityLevel(data.count)}`}
                  title={`${format(data.date, 'yyyy년 MM월 dd일')}: ${data.count}개 활동`}
                  style={{ gridRow: dayOfWeek + 1 }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>적음</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getActivityLevel(level)}`} />
            ))}
          </div>
          <span>많음</span>
        </div>
      </div>

      {/* 월별 활동 그래프 */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold mb-4">월별 활동</h3>
        <div className="space-y-2">
          {insights.monthlyActivity.map(({ month, count, diaryCount, reviewCount }) => {
            const maxCount = Math.max(...insights.monthlyActivity.map(m => m.count));
            const diaryPercentage = maxCount > 0 ? (diaryCount / maxCount) * 100 : 0;
            const reviewPercentage = maxCount > 0 ? (reviewCount / maxCount) * 100 : 0;
            
            return (
              <div key={month.toISOString()} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-8">
                  {format(month, 'M월')}
                </span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-500"
                    style={{ width: `${diaryPercentage}%` }}
                  />
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                    style={{ width: `${reviewPercentage}%`, left: `${diaryPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded" />
            <span className="text-muted-foreground">순간</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded" />
            <span className="text-muted-foreground">기록</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 자주 본 아티스트 TOP 10 */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MusicalNoteIcon className="w-5 h-5 text-purple-600" />
            자주 본 아티스트 TOP 10
          </h3>
          {insights.topArtists.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 데이터가 없어요</p>
          ) : (
            <div className="space-y-3">
              {insights.topArtists.map(([artist, count], index) => (
                <div key={artist} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-orange-600' : 
                      'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{artist}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}회</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 자주 간 장소 */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-pink-600" />
            자주 간 장소
          </h3>
          {insights.topLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 데이터가 없어요</p>
          ) : (
            <div className="space-y-3">
              {insights.topLocations.map(([location, count], index) => (
                <div key={location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium line-clamp-1">{location}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}회</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 나의 하이라이트 */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-600" />
          나의 하이라이트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.bestDiary && (
            <Link
              href={`/diary/${insights.bestDiary.id}`}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">최고의 순간</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {insights.bestDiary.caption || '...'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HeartIcon className="w-4 h-4" />
                  {insights.bestDiary.likeCount}
                </span>
                <span>{format(new Date(insights.bestDiary.createdAt), 'yyyy.MM.dd')}</span>
              </div>
            </Link>
          )}
          
          {insights.bestReview && (
            <Link
              href={`/reviews/${insights.bestReview.id}`}
              className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <StarIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">최고의 기록</span>
              </div>
              <p className="text-sm font-medium line-clamp-1 mb-1">
                {insights.bestReview.title || insights.bestReview.event?.name}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {insights.bestReview.content}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HeartIcon className="w-4 h-4" />
                  {insights.bestReview.likeCount}
                </span>
                <span>{format(new Date(insights.bestReview.createdAt), 'yyyy.MM.dd')}</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* 활동 시간대 */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-blue-600" />
          활동 패턴
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{insights.peakHour}시</p>
            <p className="text-sm text-muted-foreground">가장 활발한 시간</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <PhotoIcon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{insights.totalPhotos}</p>
            <p className="text-sm text-muted-foreground">사진</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <CalendarDaysIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {diaries.length > 0 && format(new Date(diaries[diaries.length - 1].createdAt), 'M.d')}
            </p>
            <p className="text-sm text-muted-foreground">첫 기록</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <SparklesIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round(insights.totalActivities / 12)}
            </p>
            <p className="text-sm text-muted-foreground">월 평균 활동</p>
          </div>
        </div>
      </div>
    </div>
  );
}