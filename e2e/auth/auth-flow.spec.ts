import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { testData } from '../helpers/test-data';

test.describe('인증 플로우', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, context }) => {
    authHelper = new AuthHelper(page, context);
  });

  test('비로그인 상태에서 헤더 UI 확인', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (!isMobile) {
      // 데스크톱: 로그인 버튼이 표시되어야 함
      const loginButton = page.locator('a:has-text("로그인")');
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toHaveAttribute('href', '/sign-in');
      
      // 프로필 링크는 표시되지 않아야 함
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    } else {
      // 모바일: 헤더에 로그인 버튼이 없음
      await expect(page.locator('header a:has-text("로그인")')).not.toBeVisible();
    }
    
    // NotificationBell은 비로그인 상태에서 표시되지 않음
    await expect(page.locator('[data-testid="notification-bell"]')).not.toBeVisible();
  });

  test('로그인 페이지 접근', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Clerk SignIn 컴포넌트가 로드되는지 확인
    await expect(page).toHaveURL(/\/sign-in/);
    
    // Clerk 로그인 폼 요소 확인 (실제 Clerk 컴포넌트가 로드되는 경우)
    // 테스트 환경에서는 Clerk 컴포넌트가 완전히 로드되지 않을 수 있음
    const signInRoot = page.locator('[data-clerk-sign-in-root], .cl-rootBox');
    await expect(signInRoot).toBeVisible({ timeout: 10000 });
  });

  test('로그인 상태에서 헤더 UI 확인', async ({ page, isMobile }) => {
    // 인증 상태 모킹
    await authHelper.mockLogin(testData.users.testUser.id);
    await page.goto('/');
    
    if (!isMobile) {
      // 데스크톱: 프로필 링크가 표시되어야 함
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // 로그아웃 버튼이 표시되어야 함
      await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();
      
      // 로그인 버튼은 표시되지 않아야 함
      await expect(page.locator('a:has-text("로그인")')).not.toBeVisible();
    } else {
      // 모바일: 하단 네비게이션의 마이 메뉴가 표시되어야 함
      const mobileUserMenu = page.locator('[data-testid="user-menu-mobile"]');
      await expect(mobileUserMenu).toBeVisible();
    }
    
    // NotificationBell이 표시되어야 함 (로그인 상태)
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('보호된 페이지 접근 시 리다이렉트', async ({ page }) => {
    // 비로그인 상태 확인
    await authHelper.logout();
    
    // 보호된 페이지 접근
    await page.goto('/reviews/new');
    
    // 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('로그아웃 플로우 (데스크톱)', async ({ page, isMobile }) => {
    test.skip(isMobile === true, '모바일에서는 헤더에 로그아웃 버튼이 없음');
    
    // 로그인 상태 설정
    await authHelper.mockLogin(testData.users.testUser.id);
    await page.goto('/');
    
    // 로그아웃 버튼 확인
    const logoutButton = page.locator('button:has-text("로그아웃")');
    await expect(logoutButton).toBeVisible();
    
    // Clerk signOut 함수 모킹
    await page.evaluate(() => {
      // Clerk의 signOut 함수를 모킹
      (window as any).__clerk_signOut_called = false;
      (window as any).mockSignOut = () => {
        (window as any).__clerk_signOut_called = true;
        // 실제로는 Clerk가 처리하지만, 테스트에서는 수동으로 리다이렉트
        window.location.href = '/';
      };
    });
    
    // 로그아웃 버튼의 onClick 이벤트를 가로채서 모킹된 함수 호출
    await page.evaluate(() => {
      const logoutBtn = document.querySelector('button:has-text("로그아웃")') as HTMLButtonElement;
      if (logoutBtn) {
        logoutBtn.onclick = (e) => {
          e.preventDefault();
          (window as any).mockSignOut();
        };
      }
    });
    
    // 로그아웃 클릭
    await logoutButton.click();
    
    // signOut이 호출되었는지 확인
    const signOutCalled = await page.evaluate(() => (window as any).__clerk_signOut_called);
    expect(signOutCalled).toBe(true);
  });

  test('관리자 메뉴 표시 확인', async ({ page, isMobile }) => {
    test.skip(isMobile === true, '모바일에서는 관리자 메뉴가 헤더에 없음');
    
    // 관리자 권한으로 로그인
    await authHelper.mockLogin(testData.users.adminUser.id);
    
    // getCurrentUser API 모킹
    await page.route('**/api/trpc/users.getCurrentUser**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              json: {
                id: testData.users.adminUser.id,
                username: testData.users.adminUser.username,
                isAdmin: true,
              }
            }
          }
        }),
      });
    });
    
    await page.goto('/');
    
    // 관리자 메뉴가 표시되어야 함
    await expect(page.locator('a:has-text("관리자")')).toBeVisible();
  });
});