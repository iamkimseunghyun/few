/**
 * E2E 테스트 환경 설정
 * Clerk 인증을 위한 환경 변수 및 모킹 설정
 */

export const TEST_ENV = {
  // Clerk 테스트 환경 설정
  CLERK_PUBLISHABLE_KEY: 'pk_test_mock',
  CLERK_SECRET_KEY: 'sk_test_mock',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_mock',
  
  // 테스트 사용자 정보
  TEST_USER: {
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    imageUrl: 'https://img.clerk.com/preview.png',
  },
  
  // 테스트 세션 정보
  TEST_SESSION: {
    id: 'sess_mock_123',
    status: 'active',
    lastActiveAt: new Date().toISOString(),
    expireAt: new Date(Date.now() + 3600000).toISOString(),
  }
};

/**
 * Clerk 인증 쿠키 생성
 */
export function createClerkAuthCookies(userId: string = TEST_ENV.TEST_USER.id) {
  const sessionData = {
    sub: userId,
    sess: TEST_ENV.TEST_SESSION.id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return [
    {
      name: '__clerk_db_jwt',
      value: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(sessionData)).toString('base64')}`,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const,
    },
    {
      name: '__session',
      value: TEST_ENV.TEST_SESSION.id,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const,
    },
    {
      name: '__client_uat',
      value: Math.floor(Date.now() / 1000).toString(),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ];
}