// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV,
  
  // 성능 모니터링 샘플링 비율
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 프로파일링 (Node.js 16+ 필요)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 디버그 모드
  debug: process.env.NODE_ENV === 'development',

  // 서버 사이드 특화 설정
  integrations: [
    // HTTP 통합 (요청/응답 추적)
    Sentry.httpIntegration(),
  ],

  // 무시할 에러
  ignoreErrors: [
    // 404 에러는 무시
    'NEXT_NOT_FOUND',
    // 인증 관련 예상된 에러
    'UNAUTHORIZED',
    'FORBIDDEN',
  ],

  // 무시할 트랜잭션
  ignoreTransactions: [
    // 헬스체크 엔드포인트
    '/api/health',
    // 정적 파일
    '/_next/static',
    '/_next/image',
    '/favicon.ico',
  ],

  // 추가 컨텍스트
  beforeSend(event, hint) {
    // 개발 환경 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Event:', event);
      console.error('Error:', hint.originalException);
    }

    // 민감한 정보 제거
    if (event.request) {
      // 헤더에서 민감한 정보 제거
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // 쿼리 파라미터에서 민감한 정보 제거
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]*/g,
          'token=***'
        );
      }
    }

    // 데이터베이스 에러 처리
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'code' in error) {
      // PostgreSQL 에러 코드 추가
      if (typeof error.code === 'string' && error.code.startsWith('P')) {
        event.tags = {
          ...event.tags,
          database_error: error.code,
        };
      }
    }

    return event;
  },

  // 트랜잭션 이름 정규화
  beforeSendTransaction(event) {
    // 동적 라우트 정규화
    if (event.transaction) {
      // 사용자 ID 정규화
      event.transaction = event.transaction.replace(
        /\/profile\/[\w-]+/,
        '/profile/[userId]'
      );
      // 이벤트 ID 정규화
      event.transaction = event.transaction.replace(
        /\/events\/[\w-]+/,
        '/events/[id]'
      );
      // 리뷰 ID 정규화
      event.transaction = event.transaction.replace(
        /\/reviews\/[\w-]+/,
        '/reviews/[id]'
      );
    }

    return event;
  },
  });
}