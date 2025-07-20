// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV,
  
  // Edge Runtime에서는 낮은 샘플링 비율 사용
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

  // 디버그 모드 비활성화 (너무 많은 로그 방지)
  debug: false,

  // Edge 특화 설정
  integrations: [
    // 기본 통합만 사용 (Edge Runtime 제한사항)
  ],

  // 무시할 에러
  ignoreErrors: [
    // 미들웨어에서 발생하는 리다이렉트는 무시
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],

  // 추가 컨텍스트
  beforeSend(event, hint) {
    // Edge Runtime 정보 추가
    event.tags = {
      ...event.tags,
      runtime: 'edge',
    };

    // 개발 환경에서는 특정 에러만 전송
    if (process.env.NODE_ENV === 'development') {
      // 404, 리다이렉트 관련 에러는 무시
      if (event.exception?.values?.[0]?.value?.includes('404') ||
          event.exception?.values?.[0]?.value?.includes('NEXT_NOT_FOUND') ||
          event.exception?.values?.[0]?.value?.includes('NEXT_REDIRECT')) {
        return null;
      }
    }

    // 민감한 정보 제거
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    return event;
  },
  });
}