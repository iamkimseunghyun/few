import { test as base } from '@playwright/test';

/**
 * Clerk 인증 모킹을 위한 확장된 테스트 타입
 */
export const test = base.extend({
  // Clerk 인증 상태를 모킹하기 위한 페이지 초기화
  page: async ({ page }, use) => {
    // Clerk 관련 요청을 인터셉트하여 모킹
    await page.route('**/v1/client**', async (route) => {
      // Clerk API 요청을 모킹하여 로그인 상태 시뮬레이션
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            sessions: [{
              id: 'sess_mock_123',
              status: 'active',
              user: {
                id: 'test-user-123',
                primary_email_address_id: 'email_mock_123',
                image_url: 'https://img.clerk.com/preview.png',
              }
            }],
            user: {
              id: 'test-user-123',
              primary_email_address_id: 'email_mock_123',
              image_url: 'https://img.clerk.com/preview.png',
            }
          }
        }),
      });
    });

    // Clerk 클라이언트 사이드 스크립트 모킹
    await page.addInitScript(() => {
      // Clerk 전역 객체 생성
      (window as any).Clerk = {
        loaded: true,
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
        },
        signOut: async () => {
          // 로그아웃 시뮬레이션
          (window as any).Clerk.session = null;
          (window as any).Clerk.user = null;
          window.location.href = '/';
        }
      };

      // Clerk 훅 모킹
      (window as any).__clerk_ssr_state = {
        sessionId: 'sess_mock_123',
        userId: 'test-user-123',
        orgId: null,
        orgRole: null,
        orgSlug: null,
      };
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';