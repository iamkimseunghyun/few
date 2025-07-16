'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  type View,
  type Event as CalendarEvent,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import { type Event } from '@/lib/db/schema';
import Link from 'next/link';
import { EventModal } from './EventModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/EventCalendar.module.css';

const locales = {
  ko: ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventCalendarEvent extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Event;
}

const eventTypeColors = {
  페스티벌: '#8B5CF6', // Purple for festivals
  콘서트: '#3B82F6', // Blue for concerts
  내한공연: '#10B981', // Green for overseas tours
  공연: '#EC4899', // Pink for general performances
  전시: '#F59E0B', // Amber for exhibitions
  default: '#6B7280', // Gray for others
};

export function EventCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Calculate date range for query
  const dateRange = useMemo(() => {
    const start = subMonths(date, 1);
    const end = addMonths(date, 2);
    return { start, end };
  }, [date]);

  // Fetch locations for filter
  const { data: locations } = api.events.getLocations.useQuery();

  // Fetch events for the current view range
  const { data: eventsData, isLoading } = api.events.getByDateRange.useQuery({
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    locations: selectedLocations.length > 0 ? selectedLocations : undefined,
  }, {
    // Keep previous data while fetching new data
    keepPreviousData: true,
    // Cache data for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const events: EventCalendarEvent[] = useMemo(() => {
    if (!eventsData?.items) return [];

    return eventsData.items
      .filter((event) => event.dates?.start)
      .map((event) => ({
        id: event.id,
        title: event.name,
        start: new Date(event.dates!.start),
        end: event.dates?.end ? new Date(event.dates.end) : new Date(event.dates!.start),
        resource: event,
      }));
  }, [eventsData]);

  const handleSelectEvent = useCallback((event: EventCalendarEvent) => {
    setSelectedEvent(event.resource);
    setShowEventModal(true);
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const eventStyleGetter = useCallback((event: EventCalendarEvent) => {
    const category = event.resource.category as keyof typeof eventTypeColors;
    const backgroundColor = eventTypeColors[category] || eventTypeColors.default;
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        padding: '2px 6px',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      },
    };
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="mb-4 flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900">{label}</h2>
        <button
          onClick={() => onNavigate('NEXT')}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="ml-2 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          오늘
        </button>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onView(Views.MONTH)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === Views.MONTH
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          월
        </button>
        <button
          onClick={() => onView(Views.WEEK)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === Views.WEEK
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          주
        </button>
        <button
          onClick={() => onView(Views.DAY)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === Views.DAY
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          일
        </button>
      </div>
      </div>
      
      {/* 필터 토글 버튼 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          필터 {(selectedCategories.length > 0 || selectedLocations.length > 0) && 
            `(${selectedCategories.length + selectedLocations.length})`}
        </button>
        {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
          <button
            onClick={() => {
              setSelectedCategories([]);
              setSelectedLocations([]);
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            필터 초기화
          </button>
        )}
      </div>
      
      {/* 필터 패널 */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {/* 카테고리 필터 */}
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(eventTypeColors).filter(cat => cat !== 'default').map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <div 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ 
                      backgroundColor: selectedCategories.includes(category) 
                        ? 'white' 
                        : eventTypeColors[category as keyof typeof eventTypeColors] 
                    }} 
                  />
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* 지역 필터 */}
          {locations && locations.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">지역</h3>
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <button
                    key={location}
                    onClick={() => toggleLocation(location)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      selectedLocations.includes(location)
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
        messages={{
          today: '오늘',
          previous: '이전',
          next: '다음',
          month: '월',
          week: '주',
          day: '일',
          agenda: '일정',
          date: '날짜',
          time: '시간',
          event: '이벤트',
          noEventsInRange: '이 기간에는 이벤트가 없습니다.',
          showMore: (total) => `+${total} 더보기`,
        }}
        culture="ko"
        className="h-[600px]"
      />
      
      {/* Event type legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors.페스티벌 }} />
          <span className="text-gray-600">페스티벌</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors.콘서트 }} />
          <span className="text-gray-600">콘서트</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors.내한공연 }} />
          <span className="text-gray-600">내한공연</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors.공연 }} />
          <span className="text-gray-600">공연</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: eventTypeColors.전시 }} />
          <span className="text-gray-600">전시</span>
        </div>
      </div>
      
      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}