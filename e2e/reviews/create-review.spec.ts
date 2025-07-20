import { test, expect } from '@playwright/test';

/**
 * 리뷰 작성 E2E 테스트
 * 
 * 주의사항:
 * 현재 Clerk 인증 시스템으로 인해 실제 로그인이 필요한 테스트는 포함되지 않았습니다.
 * Clerk의 보안 메커니즘과 세션 관리로 인해 Playwright에서 인증 상태를 적절히 모킹하는 것이
 * 어려우며, 실제 인증된 사용자의 기능을 테스트하려면 다음과 같은 방법이 필요합니다:
 * 
 * 1. Clerk의 테스트 모드 활용
 * 2. 실제 테스트 계정으로 로그인
 * 3. E2E 테스트용 별도의 인증 바이패스 설정
 * 
 * 따라서 현재는 비인증 상태에서의 동작만 테스트합니다.
 */
test.describe('리뷰 작성', () => {
  test('비로그인 상태에서 리뷰 작성 페이지 접근 시 로그인 페이지로 리다이렉트되어야 한다', async ({ page }) => {
    // 비로그인 상태에서 리뷰 작성 페이지 접근
    await page.goto('/reviews/new');
    
    // 로그인 페이지로 리다이렉트 확인
    // Clerk는 리다이렉트 시 원래 URL을 redirect_url 파라미터로 포함시킵니다
    await expect(page).toHaveURL(/\/sign-in/);
    
    // URL에 redirect_url 파라미터가 포함되어 있는지 확인
    const url = page.url();
    expect(url).toContain('redirect_url');
    expect(url).toContain('reviews%2Fnew');
  });

  // 인증이 필요한 테스트들:
  // - 리뷰 작성 폼 표시
  // - 필수 항목 검증
  // - 리뷰 작성 성공
  // 
  // 이러한 테스트들은 Clerk 인증 통합이 완료된 후 추가될 예정입니다.
});