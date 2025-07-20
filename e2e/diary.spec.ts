import { test, expect } from '@playwright/test';

test.describe('다이어리 페이지 테스트', () => {
  test('다이어리 페이지에 접속할 수 있다', async ({ page }) => {
    await page.goto('/diary');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('음악 다이어리');
  });

  test('비로그인 상태에서 새 다이어리 버튼이 없어야 한다', async ({ page }) => {
    await page.goto('/diary');
    
    // 새 다이어리 버튼이 없어야 함
    await expect(page.locator('text=새 다이어리')).not.toBeVisible();
  });

  test('다이어리 피드가 표시되어야 한다', async ({ page }) => {
    await page.goto('/diary');
    
    // 피드 영역이 존재해야 함
    await expect(page.locator('div.mx-auto.max-w-2xl')).toBeVisible();
  });
});