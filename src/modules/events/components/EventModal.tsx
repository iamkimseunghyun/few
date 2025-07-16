'use client';

import { type Event } from '@/lib/db/schema';
import Link from 'next/link';

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!isOpen || !event) return null;

  const eventTypeColors = {
    페스티벌: '#8B5CF6',
    콘서트: '#3B82F6',
    내한공연: '#10B981',
    공연: '#EC4899',
    전시: '#F59E0B',
    default: '#6B7280',
  };

  const categoryColor = event.category 
    ? eventTypeColors[event.category as keyof typeof eventTypeColors] || eventTypeColors.default
    : eventTypeColors.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
            {event.category && (
              <span 
                className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: categoryColor }}
              >
                {event.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1 hover:bg-gray-100"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Date */}
          {event.dates && (
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-sm text-gray-600">
                {new Date(event.dates.start).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {event.dates.end && event.dates.end !== event.dates.start && (
                  <>
                    <span className="mx-1">~</span>
                    {new Date(event.dates.end).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-gray-600">{event.location}</span>
            </div>
          )}

          {/* Lineup */}
          {event.lineup && event.lineup.length > 0 && (
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">라인업</p>
                <div className="flex flex-wrap gap-1">
                  {event.lineup.slice(0, 5).map((artist, index) => (
                    <span
                      key={index}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {artist}
                    </span>
                  ))}
                  {event.lineup.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{event.lineup.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Venue Info */}
          {event.venueInfo?.name && (
            <div className="pt-2">
              <p className="text-sm text-gray-600">
                장소: {event.venueInfo.name}
                {event.venueInfo.capacity && ` (수용인원: ${event.venueInfo.capacity.toLocaleString()}명)`}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/events/${event.id}`}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            자세히 보기
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}