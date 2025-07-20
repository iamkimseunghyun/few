import { track } from '@vercel/analytics';
import { sendGAEvent } from '@next/third-parties/google';

// Analytics 이벤트 타입 정의
export type AnalyticsEvent = {
  // 사용자 행동 이벤트
  'click_event': { eventId: string; eventName: string };
  'view_event_detail': { eventId: string; eventName: string; category: string };
  'share_event': { eventId: string; method: 'copy' | 'kakao' | 'twitter' };
  
  // 리뷰 관련 이벤트
  'start_review': { eventId: string };
  'submit_review': { eventId: string; rating: number };
  'like_review': { reviewId: string };
  
  // 검색 이벤트
  'search': { query: string; resultCount: number };
  'filter_category': { category: string };
  
  // 사용자 행동
  'sign_up': { method: 'email' | 'google' };
  'sign_in': { method: 'email' | 'google' };
  'profile_complete': Record<string, never>;
  
  // 다이어리 이벤트
  'create_diary': { eventId: string };
  'upload_diary_photo': { count: number };
};

// 이벤트 추적 함수
export function trackEvent<T extends keyof AnalyticsEvent>(
  eventName: T,
  properties: AnalyticsEvent[T]
) {
  // Vercel Analytics로 전송
  track(eventName, properties);
  
  // Google Analytics로 전송
  if (typeof window !== 'undefined' && window.gtag) {
    sendGAEvent('event', eventName, properties);
  }
}

// 페이지뷰 추적 (Vercel Analytics는 자동으로 추적함)
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    sendGAEvent('page_view', {
      page_path: url,
    });
  }
}

// 사용 예시:
// trackEvent('click_event', { eventId: '123', eventName: '서울재즈페스티벌' });
// trackEvent('submit_review', { eventId: '123', rating: 5 });
// trackEvent('search', { query: '페스티벌', resultCount: 10 });