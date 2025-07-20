import { test, expect } from '@playwright/test';

test.describe('간단한 테스트', () => {
  test('홈페이지에 접속할 수 있다', async ({ page }) => {
    // 홈페이지 방문
    await page.goto('/');
    
    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/few - 우리의 취향과 꿀팁이 모이는 공간/);
    
    // 메인 컨텐츠가 있는지 확인
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('페이지 제목이 표시된다', async ({ page }) => {
    await page.goto('/');
    
    // h1 태그 찾기
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // 텍스트 내용 확인
    const headingText = await heading.textContent();
    console.log('페이지 제목:', headingText);
  });
});