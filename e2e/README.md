# E2E 테스트 가이드

## Clerk 인증 모킹

이 프로젝트는 Clerk를 사용한 인증을 구현하고 있으며, E2E 테스트에서는 실제 Clerk 서비스 대신 모킹을 사용합니다.

### 주요 파일 구조

```
e2e/
├── auth/
│   ├── login.spec.ts         # 기본 로그인/로그아웃 테스트
│   └── auth-flow.spec.ts     # 전체 인증 플로우 테스트
├── fixtures/
│   └── clerk-fixtures.ts     # Clerk 모킹을 위한 Playwright fixtures
├── helpers/
│   ├── auth.helper.ts        # 인증 관련 헬퍼 함수
│   └── test-data.ts          # 테스트 데이터
├── setup/
│   ├── clerk-mock.ts         # Clerk 모킹 설정
│   └── test-env.ts           # 테스트 환경 변수
└── global-setup.ts           # Playwright 전역 설정
```

### Clerk 모킹 방식

1. **쿠키 기반 세션 모킹**
   - `__clerk_db_jwt`: 서버 사이드 인증 토큰
   - `__session`: 세션 ID
   - `__client_uat`: 클라이언트 인증 시간

2. **API 엔드포인트 모킹**
   - `/v1/client`: 클라이언트 세션 정보
   - `/v1/environment`: Clerk 환경 설정

3. **클라이언트 사이드 상태 모킹**
   - `__clerk_ssr_state`: SSR 상태
   - `__CLERK_INTERNAL_STATE__`: React Context 상태

### 테스트 작성 가이드

#### 기본 인증 테스트

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

test('로그인 상태 테스트', async ({ page, context }) => {
  const authHelper = new AuthHelper(page, context);
  
  // 로그인 상태 설정
  await authHelper.mockLogin('user-id');
  await page.goto('/');
  
  // 로그인 UI 확인
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

#### 모바일/데스크톱 대응

```typescript
test('반응형 UI 테스트', async ({ page, isMobile }) => {
  if (isMobile) {
    // 모바일 전용 테스트
    await expect(page.locator('[data-testid="user-menu-mobile"]')).toBeVisible();
  } else {
    // 데스크톱 전용 테스트
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  }
});
```

### 주의사항

1. **Clerk 컴포넌트 로딩**
   - Clerk의 SignIn/SignUp 컴포넌트는 실제 환경과 다르게 동작할 수 있음
   - `[data-clerk-sign-in-root]` 선택자 사용 권장

2. **모바일 UI 차이점**
   - 헤더에 로그인/로그아웃 버튼 없음
   - 하단 네비게이션 바 사용
   - 프로필 페이지에서 로그아웃 가능

3. **API 모킹**
   - TRPC 엔드포인트도 필요시 모킹 필요
   - 특히 `users.getCurrentUser`는 관리자 권한 확인에 사용

### 테스트 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# 특정 테스트 파일 실행
npm run test:e2e auth-flow.spec.ts

# 디버그 모드
npm run test:e2e --debug

# UI 모드
npm run test:e2e --ui
```

### 트러블슈팅

1. **Clerk 컴포넌트가 로드되지 않는 경우**
   - `waitForSelector` 타임아웃 증가
   - 대체 선택자 사용 (`.cl-rootBox`)

2. **세션이 유지되지 않는 경우**
   - 쿠키 도메인 확인 (`localhost` vs `127.0.0.1`)
   - `sameSite` 정책 확인

3. **모바일 테스트 실패**
   - viewport 크기 확인
   - 모바일 전용 선택자 사용