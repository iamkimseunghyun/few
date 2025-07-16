# Clerk 인증 설정 가이드

## 옵션 1: Clerk 계정 생성 및 설정 (추천)

### 1. Clerk 계정 생성
1. [https://clerk.com](https://clerk.com) 접속
2. "Get started for free" 클릭
3. GitHub 또는 이메일로 회원가입

### 2. 애플리케이션 생성
1. Dashboard에서 "Create application" 클릭
2. 애플리케이션 이름: "few" 입력
3. 로그인 방법 선택:
   - Email
   - Google
   - 기타 원하는 소셜 로그인

### 3. API 키 복사
1. Dashboard → API Keys 페이지로 이동
2. 다음 키들을 복사:
   - `Publishable key` (pk_test_로 시작)
   - `Secret key` (sk_test_로 시작)

### 4. 웹훅 설정 (선택사항)
1. Dashboard → Webhooks 페이지
2. "Add Endpoint" 클릭
3. Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
4. Events 선택:
   - `user.created`
   - `user.updated`
5. Signing Secret 복사

### 5. .env.local 파일 업데이트
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키입력
CLERK_SECRET_KEY=sk_test_실제키입력
WEBHOOK_SECRET=whsec_실제키입력
```

## 옵션 2: 인증 없이 테스트 (임시)

인증 기능을 임시로 비활성화하려면 다음 파일을 생성하세요:

`src/providers/auth-provider.tsx`:
```tsx
"use client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

그리고 layout.tsx에서 ClerkProvider를 AuthProvider로 교체하세요.

---

**참고**: 프로덕션 환경에서는 반드시 Clerk 인증을 설정해야 합니다!