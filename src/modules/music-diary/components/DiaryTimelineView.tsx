'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPinIcon, 
  MusicalNoteIcon,
  LockClosedIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import type { musicDiaries } from '@/lib/db/schema';

interface DiaryTimelineViewProps {
  diaries: (typeof musicDiaries.$inferSelect & {
    user?: { imageUrl: string | null; username: string | null } | null;
    event?: { name: string } | null;
  })[];
}

// 날씨 아이콘 매핑
const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  foggy: '🌫️',
};

// 무드 색상 매핑
const moodColors: Record<string, string> = {
  excited: 'from-yellow-400 to-orange-500',
  happy: 'from-pink-400 to-rose-500',
  peaceful: 'from-blue-400 to-cyan-500',
  melancholy: 'from-purple-400 to-indigo-500',
  energetic: 'from-green-400 to-emerald-500',
};

export function DiaryTimelineView({ diaries }: DiaryTimelineViewProps) {
  // 월별로 그룹화
  const groupedDiaries = useMemo(() => {
    const groups = new Map<string, typeof diaries>();
    
    diaries.forEach(diary => {
      const monthKey = format(new Date(diary.createdAt), 'yyyy-MM');
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(diary);
    });

    // 날짜 역순으로 정렬
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        monthKey: key,
        month: parseISO(key + '-01'),
        items: items.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
  }, [diaries]);

  if (diaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 mb-4 text-muted-foreground">
          <PhotoIcon className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium mb-2">아직 기록된 순간이 없어요</h3>
        <p className="text-muted-foreground mb-4">첫 번째 순간을 기록해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedDiaries.map(({ monthKey, month, items }) => (
        <div key={monthKey}>
          {/* 월 헤더 */}
          <div className="sticky top-32 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2 mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {format(month, 'yyyy년 MM월', { locale: ko })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length}개의 순간
            </p>
          </div>

          {/* 타임라인 아이템들 */}
          <div className="space-y-4">
            {items.map((diary) => {
              const media = Array.isArray(diary.media) ? diary.media as {
                url: string;
                type: 'image' | 'video';
                thumbnailUrl?: string;
                width?: number;
                height?: number;
                duration?: number;
              }[] : [];
              const isPrivate = !diary.isPublic;
              const weather = diary.weather as string | null;
              const mood = diary.mood as string | null;
              
              return (
                <Link 
                  key={diary.id}
                  href={`/diary/${diary.id}`}
                  className="block group"
                >
                  <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    {/* 날짜/시간 */}
                    <div className="flex-shrink-0 w-20 text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {format(new Date(diary.createdAt), 'dd')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(diary.createdAt), 'EEE', { locale: ko })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(diary.createdAt), 'HH:mm')}
                      </div>
                    </div>

                    {/* 컨텐츠 */}
                    <div className="flex-1 min-w-0">
                      {/* 헤더 정보 */}
                      <div className="flex items-start gap-3 mb-2">
                        {/* 이벤트/아티스트 정보 */}
                        <div className="flex-1">
                          {diary.event && (
                            <h3 className="font-semibold text-foreground line-clamp-1">
                              {diary.event.name}
                            </h3>
                          )}
                          {diary.artists && (diary.artists as string[]).length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MusicalNoteIcon className="w-4 h-4" />
                              <span className="line-clamp-1">
                                {(diary.artists as string[]).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 메타 정보 */}
                        <div className="flex items-center gap-2 text-sm">
                          {isPrivate && (
                            <span className="text-muted-foreground">
                              <LockClosedIcon className="w-4 h-4" />
                            </span>
                          )}
                          {weather && (
                            <span>{weatherIcons[weather] || weather}</span>
                          )}
                        </div>
                      </div>

                      {/* 위치 정보 */}
                      {diary.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{diary.location}</span>
                        </div>
                      )}

                      {/* 캡션/내용 */}
                      {diary.caption && (
                        <p className="text-sm text-foreground line-clamp-2 mb-3">
                          {diary.caption}
                        </p>
                      )}

                      {/* 미디어 미리보기 */}
                      {media.length > 0 && (
                        <div className="flex gap-2 overflow-hidden">
                          {media.slice(0, 4).map((item, index) => (
                            <div 
                              key={index}
                              className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0"
                            >
                              {item.type === 'image' && (
                                <Image
                                  src={item.url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              )}
                              {item.type === 'video' && (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                          {media.length > 4 && (
                            <div className="flex items-center justify-center w-16 h-16 bg-muted rounded text-sm text-muted-foreground flex-shrink-0">
                              +{media.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 무드 인디케이터 */}
                      {mood && (
                        <div className="mt-3">
                          <div className={`inline-block h-1 w-20 rounded-full bg-gradient-to-r ${moodColors[mood] || 'from-gray-400 to-gray-500'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}