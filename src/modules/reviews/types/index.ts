import type { Review, User, Event } from "@/lib/db/schema";

export interface ReviewWithRelations extends Review {
  user: User | null;
  event: Event | null;
}

export interface ReviewWithDetails extends Review {
  user: User | null;
  event: Event | null;
  eventName?: string | null;
  likeCount: number;
  commentCount: number;
  helpfulCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isHelpful?: boolean;
  isBestReview?: boolean;
  bestReviewDate?: Date | null;
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