# Sentry 설정 가이드

## Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 필수 환경 변수

1. **NEXT_PUBLIC_SENTRY_DSN**
   - Sentry 프로젝트의 DSN (Data Source Name)
   - 예: `https://xxxxx@o000000.ingest.sentry.io/0000000`
   - 클라이언트와 서버 모두에서 사용

2. **SENTRY_ORG**
   - Sentry 조직 slug
   - 예: `laaf`

3. **SENTRY_PROJECT**
   - Sentry 프로젝트 slug
   - 예: `javascript-nextjs`

4. **SENTRY_AUTH_TOKEN**
   - Source map 업로드를 위한 인증 토큰
   - Sentry 설정 > Account > API > Auth Tokens에서 생성
   - 필요한 권한: `project:releases`, `org:read`

## 테스트 방법

1. **개발 환경 테스트**
   ```bash
   # 로컬에서 테스트 에러 발생
   curl http://localhost:3030/api/test-error
   ```

2. **프로덕션 환경 테스트**
   ```bash
   # 배포 후 테스트
   curl https://few-theta.vercel.app/api/test-error
   ```

3. **Sentry 대시보드 확인**
   - https://sentry.io/organizations/[your-org]/issues/
   - 에러가 제대로 수집되는지 확인

## 주요 기능

1. **자동 에러 수집**
   - 클라이언트 사이드 에러
   - 서버 사이드 에러
   - Edge Runtime 에러
   - tRPC 에러

2. **성능 모니터링**
   - 페이지 로딩 시간
   - API 응답 시간
   - 웹 바이탈 메트릭

3. **Session Replay**
   - 에러 발생 시 사용자 행동 재현
   - 프로덕션에서만 활성화 (10% 샘플링)

4. **사용자 컨텍스트**
   - Clerk 인증 정보와 연동
   - 에러 발생 시 사용자 정보 자동 추적

## 문제 해결

### Vercel에서 에러가 수집되지 않는 경우

1. **환경 변수 확인**
   - Vercel 대시보드에서 모든 환경 변수가 설정되었는지 확인
   - 특히 `NEXT_PUBLIC_SENTRY_DSN`이 올바른지 확인

2. **Source Map 업로드 확인**
   - 빌드 로그에서 Sentry 관련 메시지 확인
   - `SENTRY_AUTH_TOKEN`이 올바른 권한을 가지고 있는지 확인

3. **미들웨어 경로 확인**
   - `/monitoring` 경로가 Next.js 미들웨어와 충돌하지 않는지 확인
   - `tunnelRoute` 설정이 광고 차단기를 우회하도록 도움

4. **Instrumentation Hook**
   - `instrumentation.ts` 파일이 있는지 확인
   - `next.config.ts`에서 `instrumentationHook: true` 설정 확인

## 추가 설정 (선택사항)

### 알림 설정
- Sentry 대시보드에서 이메일/Slack 알림 설정
- 중요한 에러에 대한 실시간 알림

### 릴리즈 추적
- Git 커밋과 연동하여 어떤 릴리즈에서 에러가 발생했는지 추적
- CI/CD 파이프라인에서 릴리즈 정보 전송

### 커스텀 컨텍스트
- 비즈니스 로직에 맞는 추가 정보 수집
- 예: 이벤트 ID, 리뷰 타입 등