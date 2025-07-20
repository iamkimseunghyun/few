// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a client-side error occurs.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Export required for Next.js 15
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Only initialize Sentry if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV,
  
  // 성능 모니터링 샘플링 비율 (프로덕션에서는 낮춰야 함)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Trace propagation targets
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/few-theta\.vercel\.app/,
    /^\//,
  ],
  
  // 세션 리플레이 설정 (프로덕션에서만 활성화)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  // 디버그 모드 비활성화 (너무 많은 로그 방지)
  debug: false,

  // 무시할 에러 패턴
  ignoreErrors: [
    // 브라우저 확장 프로그램 관련 에러
    'top.GLOBALS',
    // 네트워크 관련 일시적 에러
    'NetworkError',
    'Network request failed',
    // 사용자가 페이지를 떠날 때 발생하는 에러
    'Non-Error promise rejection captured',
    // ResizeObserver 관련 무해한 에러
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Next.js dev server 관련 에러
    'NEXT_HTTP_ERROR_FALLBACK',
    'Failed to symbolicate event with Next.js dev server',
    'Cannot read properties of undefined (reading \'originalCodeFrame\')',
  ],

  // 추가 컨텍스트 정보
  beforeSend(event) {
    // 개발 환경에서는 특정 에러만 Sentry로 전송
    if (process.env.NODE_ENV === 'development') {
      // 404 에러는 무시
      if (event.exception?.values?.[0]?.value?.includes('404')) {
        return null;
      }
      
      // Next.js dev server 관련 에러는 무시
      if (event.exception?.values?.[0]?.value?.includes('symbolicate') ||
          event.exception?.values?.[0]?.value?.includes('originalCodeFrame')) {
        return null;
      }
    }

    // 민감한 정보 제거
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    // 사용자 정보 수집 (이메일 제외)
    if (event.user?.email) {
      event.user.email = undefined;
    }

    return event;
  },

  // 통합 설정
  integrations: [
    // 브라우저 추적
    Sentry.browserTracingIntegration(),
    // 세션 리플레이
    Sentry.replayIntegration({
      // 마스킹 설정
      maskAllText: false,
      maskAllInputs: true,
      // 네트워크 요청 기록
      networkDetailAllowUrls: [
        window.location.origin,
      ],
    }),
  ],

  // 브레드크럼 설정
  beforeBreadcrumb(breadcrumb) {
    // 콘솔 로그는 개발 환경에서만
    if (breadcrumb.category === 'console' && process.env.NODE_ENV === 'production') {
      return null;
    }
    
    // 민감한 데이터가 포함될 수 있는 fetch 요청 본문 제거
    if (breadcrumb.category === 'fetch' && breadcrumb.data?.request) {
      delete breadcrumb.data.request;
    }

    return breadcrumb;
  },
  });
}