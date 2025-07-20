import { type Page, type BrowserContext } from '@playwright/test';
import { createClerkAuthCookies, TEST_ENV } from '../setup/test-env';

export class AuthHelper {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Clerk 인증을 모의하는 헬퍼
   * E2E 테스트를 위한 mock 인증 설정
   */
  async mockLogin(userId: string = TEST_ENV.TEST_USER.id) {
    // Clerk 세션 쿠키 설정
    const cookies = createClerkAuthCookies(userId);
    await this.context.addCookies(cookies);

    // Clerk 클라이언트 사이드 상태 설정
    await this.page.addInitScript((userId) => {
      // Clerk 전역 객체 모킹
      (window as any).__clerk_nav_ref = () => {};
      (window as any).__clerk_nav_resolves_to = '/';
      
      // Clerk 세션 스토리지 설정
      const clerkSession = {
        id: 'sess_mock_123',
        status: 'active',
        lastActiveAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: userId,
          primaryEmailAddressId: 'email_mock_123',
          primaryPhoneNumberId: null,
          primaryWeb3WalletId: null,
          imageUrl: 'https://img.clerk.com/preview.png',
          hasImage: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
      
      sessionStorage.setItem('__clerk_session', JSON.stringify(clerkSession));
      sessionStorage.setItem('__clerk_client_jwt', 'mock_client_jwt');
      
      // 추가 Clerk 관련 로컬 스토리지 설정
      localStorage.setItem('__clerk_db_jwt', 'mock_db_jwt');
    }, userId);
  }

  /**
   * 로그아웃
   */
  async logout() {
    await this.context.clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * 로그인 상태 확인
   */
  async isLoggedIn(): Promise<boolean> {
    const cookies = await this.context.cookies();
    return cookies.some(cookie => cookie.name === '__clerk_db_jwt' || cookie.name === '__session');
  }

  /**
   * 실제 로그인 플로우 (UI를 통한 로그인)
   * Clerk의 UI 컴포넌트를 통한 로그인
   */
  async loginViaUI(email: string, password: string) {
    await this.page.goto('/sign-in');
    
    // Clerk SignIn 컴포넌트가 로드될 때까지 대기
    await this.page.waitForSelector('[data-clerk-sign-in-root]');
    
    // 이메일 입력
    await this.page.fill('input[name="identifier"]', email);
    await this.page.click('button:has-text("Continue")');
    
    // 비밀번호 입력 단계 대기
    await this.page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button:has-text("Continue")');
    
    // 로그인 완료 및 리다이렉트 대기
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  /**
   * Clerk 테스트 토큰을 사용한 로그인 (CI/CD 환경용)
   * 환경 변수에 CLERK_TEST_TOKEN이 설정되어 있을 때 사용
   */
  async loginWithTestToken(testToken: string) {
    await this.context.addCookies([
      {
        name: '__clerk_test_token',
        value: testToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    
    await this.page.reload();
  }
}