import type { Event } from "@/lib/db/schema";

export interface EventWithStats extends Event {
  reviewCount: number;
  avgRating: number;
}

export interface EventsResponse {
  items: EventWithStats[];
  nextCursor?: string;
}

export interface EventFormData {
  name: string;
  category?: string;
  location?: string;
  dates?: {
    start: string;
    end: string;
  };
  description?: string;
  posterUrl?: string;
  ticketPriceRange?: string;
  capacity?: number;
  organizer?: string;
  website?: string;
}