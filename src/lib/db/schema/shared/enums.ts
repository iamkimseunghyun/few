import { pgEnum } from 'drizzle-orm/pg-core';

// 이벤트 카테고리 enum 정의 (DB와 완전 일치)
export const eventCategoryEnum = pgEnum('event_category', [
  'festival',
  'concert',
  'performance',
  'exhibition',
  'overseas_tour',
]);

// TypeScript 타입 정의
export type EventCategory =
  | 'festival'
  | 'concert'
  | 'performance'
  | 'exhibition'
  | 'overseas_tour';

// 카테고리 라벨 매핑 (표시용)
export const categoryLabels: Record<EventCategory, string> = {
  festival: '페스티벌',
  concert: '콘서트',
  performance: '공연',
  exhibition: '전시',
  overseas_tour: '내한공연',
};

// Media type enum (from music-diary)
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);