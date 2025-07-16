"use client";

import Image from "next/image";
import { type Event } from "@/lib/db/schema";

interface EventDetailProps {
  event: Event;
}

export function EventDetail({ event }: EventDetailProps) {
  const formatDates = (dates: { start: string; end: string } | null) => {
    if (!dates) return null;
    const start = new Date(dates.start).toLocaleDateString("ko-KR");
    const end = new Date(dates.end).toLocaleDateString("ko-KR");
    return start === end ? start : `${start} - ${end}`;
  };

  return (
    <div className="bg-white">
      {event.posterUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
          <Image
            src={event.posterUrl}
            alt={event.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{event.name}</h1>
          {event.category && (
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {event.category}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {event.dates && (
            <div>
              <h3 className="mb-1 font-medium text-gray-900">\uc77c\uc815</h3>
              <p className="text-gray-700">{formatDates(event.dates)}</p>
            </div>
          )}

          {event.location && (
            <div>
              <h3 className="mb-1 font-medium text-gray-900">\uc7a5\uc18c</h3>
              <p className="text-gray-700">{event.location}</p>
            </div>
          )}

          {event.lineup && event.lineup.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-gray-900">\ub77c\uc778\uc5c5</h3>
              <div className="flex flex-wrap gap-2">
                {event.lineup.map((artist) => (
                  <span
                    key={artist}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.venueInfo && (
            <div>
              <h3 className="mb-2 font-medium text-gray-900">\uacf5\uc5f0\uc7a5 \uc815\ubcf4</h3>
              <div className="space-y-1 text-sm text-gray-700">
                {event.venueInfo.name && (
                  <p>\uacf5\uc5f0\uc7a5: {event.venueInfo.name}</p>
                )}
                {event.venueInfo.capacity && (
                  <p>\uc218\uc6a9 \uc778\uc6d0: {event.venueInfo.capacity.toLocaleString()}\uba85</p>
                )}
                {event.venueInfo.sections && event.venueInfo.sections.length > 0 && (
                  <p>\uad6c\uc5ed: {event.venueInfo.sections.join(", ")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}