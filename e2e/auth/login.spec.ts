import { test, expect } from '@playwright/test';

test.describe('로그인/로그아웃', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('로그인 버튼이 표시되고 클릭 시 로그인 페이지로 이동해야 한다', async ({ page, isMobile }) => {
    // 모바일에서는 로그인 버튼이 헤더에 없으므로 직접 이동
    if (isMobile) {
      await page.goto('/sign-in');
    } else {
      // 데스크톱에서는 로그인 버튼 확인 및 클릭
      const loginButton = page.locator('a[href="/sign-in"]:has-text("로그인")');
      await expect(loginButton).toBeVisible();
      await loginButton.click();
    }
    
    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/sign-in/);
    
    // Clerk SignIn 컴포넌트가 로드되었는지 확인 - "Sign in to festival-review" 헤딩을 확인
    await expect(page.locator('h1:has-text("Sign in to festival-review")')).toBeVisible({ timeout: 10000 });
  });

  test('인증이 필요한 페이지 접근 시 로그인 페이지로 리다이렉트되어야 한다', async ({ page }) => {
    // 리뷰 작성 페이지 접근 시도
    await page.goto('/reviews/new');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });
  });

  test('Clerk 로그인 컴포넌트가 정상적으로 표시되어야 한다', async ({ page }) => {
    // 로그인 페이지로 직접 이동
    await page.goto('/sign-in');
    
    // Clerk SignIn 컴포넌트의 헤딩이 표시되는지 확인
    await expect(page.locator('h1:has-text("Sign in to festival-review")')).toBeVisible({ timeout: 10000 });
    
    // 이메일 입력 필드 확인
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput).toBeVisible();
    
    // 패스워드 입력 필드 확인
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Continue 버튼이 표시되는지 확인 (정확한 개수 체크)
    const continueButtons = await page.locator('button:has-text("Continue")').count();
    expect(continueButtons).toBeGreaterThan(0);
    
    // Google 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
  });
});