import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('홈페이지가 정상적으로 로드되어야 한다', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('페스티벌 & 공연 캘린더');
    
    // 캘린더 섹션은 항상 표시됨
    await page.waitForSelector('.rbc-calendar, [class*="calendar"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // CTA 섹션은 항상 표시됨 - "당신의 공연 경험을 공유해주세요"
    await expect(page.locator('h2:has-text("당신의 공연 경험을 공유해주세요")')).toBeVisible();
    
    // CTA 버튼 확인
    await expect(page.locator('text=리뷰 작성하기')).toBeVisible();
  });

  test('캘린더가 표시되어야 한다', async ({ page }) => {
    // 캘린더 컨테이너가 있는지 확인
    await page.waitForSelector('.rbc-calendar, [class*="calendar"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // 날짜 정보가 표시되는지 확인 - "7월 2025" 형식
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString('ko-KR', { month: 'long' });
    const year = currentDate.getFullYear();
    const expectedDateText = `${monthName} ${year}`;
    
    // 날짜 텍스트가 h2 요소에 포함되어 있는지 확인
    const dateHeader = page.locator('h2').filter({ hasText: expectedDateText });
    await expect(dateHeader).toBeVisible();
    
    // 필터 버튼 확인
    await expect(page.locator('button:has-text("필터")')).toBeVisible();
    
    // 오늘 버튼 확인
    await expect(page.locator('button:has-text("오늘")')).toBeVisible();
    
    // 월/주/일 보기 버튼 확인
    await expect(page.locator('button:has-text("월")').first()).toBeVisible();
  });

  test('네비게이션이 작동해야 한다', async ({ page }) => {
    // 다가오는 이벤트 섹션이 있는 경우에만 테스트
    const eventsSectionExists = await page.locator('h2:has-text("다가오는 이벤트")').isVisible().catch(() => false);
    
    if (eventsSectionExists) {
      // 이벤트 페이지로 이동
      await page.click('a:has-text("모두 보기 →"):near(h2:has-text("다가오는 이벤트"))');
      await expect(page).toHaveURL(/\/events/);
      
      // 홈으로 돌아가기
      await page.click('a[href="/"]:has-text("few")');
      await expect(page).toHaveURL('/');
    } else {
      // 최신 리뷰 섹션으로 테스트
      const reviewsSectionExists = await page.locator('h2:has-text("최신 리뷰")').isVisible().catch(() => false);
      
      if (reviewsSectionExists) {
        await page.click('a:has-text("모두 보기 →"):near(h2:has-text("최신 리뷰"))');
        await expect(page).toHaveURL(/\/reviews/);
        
        // 홈으로 돌아가기
        await page.click('a[href="/"]:has-text("few")');
        await expect(page).toHaveURL('/');
      }
    }
  });

  test('모바일 반응형 디자인이 작동해야 한다', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서는 하단 네비게이션이 표시됨
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
    
    // 하단 네비게이션 메뉴 항목들 확인
    await expect(page.locator('nav.fixed.bottom-0 a:has-text("홈")')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 a:has-text("이벤트")')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 a:has-text("다이어리")')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 a:has-text("리뷰")')).toBeVisible();
    
    // 로그인한 경우 마이 메뉴가 보이는지 확인 (로그인 상태에 따라 다를 수 있음)
    const myMenuVisible = await page.locator('nav.fixed.bottom-0 a:has-text("마이")').isVisible().catch(() => false);
    
    // 데스크톱 네비게이션은 숨겨져야 함
    await expect(page.locator('nav.hidden.sm\\:flex')).not.toBeVisible();
    
    // 모바일 캘린더가 정상적으로 표시되는지 확인
    await page.waitForSelector('.rbc-calendar, [class*="calendar"]', { 
      state: 'visible',
      timeout: 10000 
    });
  });
});