import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 전역 설정
 * E2E 테스트 실행 전 Clerk 모킹 및 환경 설정
 */
async function globalSetup(config: FullConfig) {
  // 브라우저 실행
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Clerk 인증 관련 환경 변수 설정
  process.env.CLERK_SECRET_KEY = 'sk_test_mock';
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/sign-in';
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/sign-up';
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = '/';
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = '/';
  
  // 테스트 모드 설정
  process.env.TESTING = 'true';

  await browser.close();
}

export default globalSetup;