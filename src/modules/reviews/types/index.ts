import type { Review, User, Event } from "@/lib/db/schema";

export interface ReviewWithRelations extends Review {
  user: User | null;
  event: Event | null;
}

export interface ReviewWithDetails {
  // All properties from Review
  id: string;
  userId: string;
  eventId: string | null;
  eventName?: string;
  title: string;
  content: string;
  overallRating: number;
  soundRating: number | null;
  viewRating: number | null;
  safetyRating: number | null;
  operationRating: number | null;
  seatOrArea: string | null;
  tags: string[] | null;
  imageUrls: string[] | null;
  mediaItems?: Array<{
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    duration?: number;
  }>;
  helpfulCount: number;
  isBestReview: boolean;
  bestReviewDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  user: User | null;
  event: Event | null;
  
  // Computed fields
  likeCount: number;
  commentCount: number;
  
  // UI state
  isLiked?: boolean;
  isBookmarked?: boolean;
  isHelpful?: boolean;
}

export interface ReviewFormData {
  title: string;
  eventId?: string;
  eventName?: string;
  overallRating: number;
  soundRating?: number;
  viewRating?: number;
  safetyRating?: number;
  operationRating?: number;
  seatOrArea?: string;
  content: string;
  tags?: string[];
  imageUrls?: string[];
}