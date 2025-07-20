'use client';

import { useMemo, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { musicDiaries } from '@/lib/db/schema';
import { api } from '@/lib/trpc';
import { EventModal } from '@/modules/events/components/EventModal';
import { categoryLabels, type EventCategory, type Event } from '@/lib/db/schema';

// 이벤트 카테고리별 색상
const eventTypeColors: Record<EventCategory, string> = {
  festival: '#8B5CF6',
  concert: '#3B82F6',
  performance: '#EC4899',
  exhibition: '#F59E0B',
  overseas_tour: '#10B981',
};

interface DiaryCalendarViewProps {
  mode?: 'diary' | 'event' | 'both';
  diaries?: (typeof musicDiaries.$inferSelect)[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function DiaryCalendarView({ 
  mode = 'diary',
  diaries = [], 
  selectedDate, 
  onDateSelect 
}: DiaryCalendarViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // 이벤트 데이터 가져오기 (event 모드일 때만)
  const dateRange = useMemo(() => {
    const start = subMonths(selectedDate, 1);
    const end = addMonths(selectedDate, 2);
    return { start, end };
  }, [selectedDate]);

  const { data: eventsData } = api.events.getByDateRange.useQuery(
    {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
    {
      enabled: mode === 'event' || mode === 'both',
      staleTime: 5 * 60 * 1000,
    }
  );

  // 날짜별 다이어리 카운트
  const diaryCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    if (mode === 'diary' || mode === 'both') {
      diaries.forEach(diary => {
        const dateKey = format(new Date(diary.createdAt), 'yyyy-MM-dd');
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
      });
    }
    return counts;
  }, [diaries, mode]);

  // 날짜별 이벤트 그룹화
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, Event[]>();
    
    if ((mode === 'event' || mode === 'both') && eventsData?.items) {
      eventsData.items.forEach(event => {
        if (event.dates?.start) {
          const startDate = new Date(event.dates.start);
          const endDate = event.dates.end ? new Date(event.dates.end) : startDate;
          
          // 이벤트가 걸쳐있는 모든 날짜에 추가
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dateKey = format(currentDate, 'yyyy-MM-dd');
            const existingEvents = grouped.get(dateKey) || [];
            grouped.set(dateKey, [...existingEvents, event]);
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          }
        }
      });
    }
    
    return grouped;
  }, [eventsData, mode]);

  // 선택된 날짜의 다이어리들
  const selectedDateDiaries = useMemo(() => {
    if (mode === 'diary' || mode === 'both') {
      return diaries.filter(diary => 
        isSameDay(new Date(diary.createdAt), selectedDate)
      );
    }
    return [];
  }, [diaries, selectedDate, mode]);

  // 선택된 날짜의 이벤트들
  const selectedDateEvents = useMemo(() => {
    if (mode === 'event' || mode === 'both') {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      return eventsByDate.get(dateKey) || [];
    }
    return [];
  }, [eventsByDate, selectedDate, mode]);

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    onDateSelect(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    onDateSelect(new Date());
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 캘린더 */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border p-6">
          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {format(selectedDate, 'yyyy년 MM월', { locale: ko })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                오늘
              </button>
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['월', '화', '수', '목', '금', '토', '일'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const diaryCount = diaryCountByDate.get(dateKey) || 0;
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={dateKey}
                  onClick={() => onDateSelect(day)}
                  className={`
                    relative aspect-square p-2 rounded-lg transition-all
                    ${isCurrentMonth ? 'hover:bg-muted' : 'opacity-30'}
                    ${isSelected ? 'bg-purple-600/10 ring-2 ring-purple-600' : ''}
                    ${isTodayDate && !isSelected ? 'ring-1 ring-muted-foreground' : ''}
                  `}
                  disabled={!isCurrentMonth}
                >
                  <span className={`
                    text-sm
                    ${isSelected ? 'font-bold text-purple-600' : ''}
                    ${isTodayDate && !isSelected ? 'font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* 인디케이터 영역 */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {/* 다이어리 인디케이터 */}
                    {diaryCount > 0 && (mode === 'diary' || mode === 'both') && (
                      <>
                        {Array.from({ length: Math.min(diaryCount, 3) }).map((_, i) => (
                          <div
                            key={`diary-${i}`}
                            className="w-1 h-1 rounded-full bg-purple-600"
                          />
                        ))}
                      </>
                    )}
                    
                    {/* 이벤트 인디케이터 */}
                    {dayEvents.length > 0 && (mode === 'event' || mode === 'both') && (
                      <>
                        {Array.from(new Set(dayEvents.map(e => e.category))).slice(0, 3).map((category, i) => (
                          <div
                            key={`event-${i}`}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: eventTypeColors[category as EventCategory] }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 카테고리 범례 (이벤트 모드일 때만) */}
          {(mode === 'event' || mode === 'both') && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {Object.entries(categoryLabels).map(([value, label]) => (
                <div key={value} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: eventTypeColors[value as EventCategory],
                    }}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 선택된 날짜의 목록 */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">
            {format(selectedDate, 'MM월 dd일 EEEE', { locale: ko })}
          </h3>

          {selectedDateDiaries.length === 0 && selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {mode === 'diary' ? '이 날짜에 기록된 순간이 없습니다.' : 
               mode === 'event' ? '이 날짜에 예정된 이벤트가 없습니다.' :
               '이 날짜에 예정된 일정이 없습니다.'}
            </p>
          ) : (
            <div className="space-y-3">
              {/* 이벤트 목록 */}
              {(mode === 'event' || mode === 'both') && selectedDateEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  className="w-full text-left p-3 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: eventTypeColors[event.category as EventCategory] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {categoryLabels[event.category as EventCategory]}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium line-clamp-1">
                    {event.name}
                  </p>
                  
                  {event.location && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      📍 {event.location}
                    </p>
                  )}
                  
                  {event.ticketPriceRange && (
                    <p className="text-xs text-muted-foreground">
                      💸 {event.ticketPriceRange}
                    </p>
                  )}
                </button>
              ))}
              
              {/* 다이어리 목록 */}
              {(mode === 'diary' || mode === 'both') && selectedDateDiaries.map(diary => {
                const media = Array.isArray(diary.media) ? diary.media as {
                  url: string;
                  type: 'image' | 'video';
                  thumbnailUrl?: string;
                  width?: number;
                  height?: number;
                  duration?: number;
                }[] : [];
                
                return (
                  <a
                    key={diary.id}
                    href={`/diary/${diary.id}`}
                    className="block p-3 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(diary.createdAt), 'HH:mm')}
                      </span>
                      {!diary.isPublic && (
                        <span className="text-xs text-muted-foreground">🔒</span>
                      )}
                    </div>
                    
                    {diary.artists && (diary.artists as string[]).length > 0 && (
                      <p className="text-sm font-medium line-clamp-1">
                        {(diary.artists as string[]).join(', ')}
                      </p>
                    )}
                    
                    {diary.caption && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {diary.caption}
                      </p>
                    )}
                    
                    {media.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <span>📷</span>
                        <span>{media.length}개 미디어</span>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Event Modal */}
    {(mode === 'event' || mode === 'both') && (
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
      />
    )}
  </>
  );
}