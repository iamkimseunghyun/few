import { test as base, Page } from '@playwright/test';
import { TEST_ENV } from '../setup/test-env';

/**
 * Clerk 모킹을 위한 확장된 테스트 픽스처
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // 인증된 페이지 픽스처
  authenticatedPage: async ({ page }, use) => {
    // Clerk API 엔드포인트 모킹
    await page.route('**/v1/client**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            sessions: [{
              id: TEST_ENV.TEST_SESSION.id,
              status: 'active',
              user: TEST_ENV.TEST_USER,
              last_active_at: TEST_ENV.TEST_SESSION.lastActiveAt,
              expire_at: TEST_ENV.TEST_SESSION.expireAt,
            }],
            user: TEST_ENV.TEST_USER,
          }
        }),
      });
    });

    // Clerk 환경 엔드포인트 모킹
    await page.route('**/v1/environment**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_config: {
            single_session_mode: false,
            url_based_session_syncing: true,
          },
          display_config: {
            branded: false,
            instance_environment_type: 'development',
          },
          user_settings: {
            sign_up: {
              captcha_enabled: false,
            },
          },
        }),
      });
    });

    // Clerk 클라이언트 사이드 스크립트 주입
    await page.addInitScript(() => {
      // Clerk 상태 모킹
      (window as any).__clerk_ssr_state = {
        sessionId: 'sess_mock_123',
        userId: 'test-user-123',
        orgId: null,
        orgRole: null,
        orgSlug: null,
      };

      // React Context를 통한 Clerk 상태 모킹
      (window as any).__CLERK_INTERNAL_STATE__ = {
        isLoaded: true,
        session: {
          id: 'sess_mock_123',
          status: 'active',
          user: {
            id: 'test-user-123',
            primaryEmailAddressId: 'email_mock_123',
            imageUrl: 'https://img.clerk.com/preview.png',
          }
        },
        user: {
          id: 'test-user-123',
          primaryEmailAddressId: 'email_mock_123',
          imageUrl: 'https://img.clerk.com/preview.png',
        }
      };
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';