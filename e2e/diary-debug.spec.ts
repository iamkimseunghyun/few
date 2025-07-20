import { test, expect } from '@playwright/test';

test.describe('다이어리 페이지 디버깅', () => {
  test('다이어리 페이지 상태 확인', async ({ page }) => {
    // 콘솔 로그 캡처
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });

    // 네트워크 요청 캡처
    page.on('request', request => {
      if (request.url().includes('api/trpc')) {
        console.log('API Request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('api/trpc')) {
        console.log('API Response:', response.url(), response.status());
      }
    });

    await page.goto('/diary');
    await page.waitForTimeout(3000); // 3초 대기

    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'diary-page.png', fullPage: true });

    // 현재 DOM 상태 확인
    const hasSkeletons = await page.locator('.animate-pulse').count();
    console.log('Skeleton elements:', hasSkeletons);

    const hasEmptyState = await page.locator('text=아직 다이어리가 없습니다').isVisible().catch(() => false);
    console.log('Empty state visible:', hasEmptyState);

    const diaryCards = await page.locator('article').count();
    console.log('Diary cards found:', diaryCards);

    // VirtualizedList 컨테이너 확인
    const virtualContainer = await page.locator('.overflow-auto').first();
    const boundingBox = await virtualContainer.boundingBox();
    console.log('Virtual container size:', boundingBox);
  });
});