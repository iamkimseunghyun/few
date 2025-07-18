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

  // 디버그 모드
  debug: process.env.NODE_ENV === 'development',

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

    // 개발 환경 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Edge Event:', event);
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