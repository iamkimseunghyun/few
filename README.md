# few - 음악 액티비티 공유 플랫폼

> 음악 캘린더라는 강력한 유틸리티를 중심으로, 음악 팬들의 경험이 연결되고 아카이빙되는 버티컬 소셜 네트워크

음악을 사랑하는 사람들이 공연 일정을 관리하고, 소중한 음악 경험을 기록하며, 비슷한 취향의 사람들과 연결되는 **소셜 뮤직 저널** 플랫폼입니다.

**프로덕션**: https://few-theta.vercel.app/

## 핵심 기능

### 🗓️ 공연 (Events) - Utility
- **통합 공연 캘린더**: 흩어진 공연 정보를 한 곳에서 관리
- **다양한 뷰**: 캘린더 뷰 / 리스트 뷰 전환
- **스마트 필터링**: 장르, 지역, 기간별 필터
- **북마크 기능**: '가고 싶어요'로 관심 공연 저장

### 📸 순간 (Moments) - Social
- **뮤직 피드**: 이미지 중심의 음악 경험 공유
- **순간 포스팅**: 최대 10장의 사진/영상으로 공연 기록
- **공연 태그**: 특정 공연과 연결된 모든 순간 모아보기
- **소셜 인터랙션**: 좋아요, 댓글, 팔로우

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **API**: tRPC v11
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **State Management**: TanStack Query v5
- **Image Storage**: Cloudflare Images
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics 4, Vercel Analytics
- **Testing**: Playwright (E2E)
- **Package Manager**: Bun (빠른 설치 및 실행)

## 빠른 시작 (Quick Start)

### 필독 문서
- **PRD** → PROJECT.md (제품 요구사항 정의서)
- **개발 로그** → DEVELOPMENT_LOG.md
- **상위 문서를 순서대로 읽고 숙지할 것**

### 사전 요구사항

```bash
# Bun 설치 (아직 없다면)
curl -fsSL https://bun.sh/install | bash
```

### 환경 설정

```bash
# 1. 환경 변수 설정
cp .env.example .env.local
# Clerk, Neon Database URL, Cloudflare 설정 필요

# 2. 의존성 설치 (⚡ 빠른 속도!)
bun install

# 3. 데이터베이스 셋업
bun run db:setup
bun run db:migrate
bun run db:seed

# 4. 개발 서버 실행
bun run dev
```

브라우저에서 http://localhost:3030 접속

## 상세 설정 가이드

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 실제 값을 입력하세요:

```bash
cp .env.example .env.local
```

필요한 환경 변수:
- **Clerk 인증 키** (https://clerk.com에서 발급)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `WEBHOOK_SECRET`

- **PostgreSQL 데이터베이스 URL**
  - 예: `postgresql://username:password@localhost:5432/few_db`
  - Neon, Supabase 등의 호스팅 서비스 사용 가능

- **Cloudflare Images** (이미지 업로드)
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_IMAGES_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_HASH`

- **Sentry** (에러 모니터링)
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`

- **Google Analytics**
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 2. 데이터베이스 설정

```bash
# 데이터베이스 스키마 푸시
bun run db:push

# 데이터베이스 관리 UI 실행 (선택사항)
bun run db:studio

# 시드 데이터 생성 (선택사항)
bun run db:seed
```

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # 인증 관련 페이지
│   └── api/            # API 라우트
├── modules/            # 기능별 모듈
│   ├── auth/          # 인증 기능
│   ├── events/        # 공연 정보 (Utility)
│   ├── moments/       # 순간 포스팅 (Social) - 신규
│   ├── home/          # 홈 피드
│   ├── profile/       # 프로필
│   ├── reviews/       # 리뷰 (레거시, 참고용)
│   ├── music-diary/   # 음악 다이어리 (레거시, 참고용)
│   └── shared/        # 공통 컴포넌트
├── lib/               # 공통 라이브러리
│   ├── db/           # 데이터베이스 설정
│   ├── analytics.ts  # 분석 추적 유틸리티
│   └── trpc.ts       # tRPC 클라이언트
├── server/           # 서버 로직
│   ├── api/          # API 엔드포인트
│   └── routers/      # tRPC 라우터
└── e2e/              # Playwright E2E 테스트
```

## 스크립트

### 개발
```bash
bun run dev          # 개발 서버 실행 (포트 3030)
bun run build        # 프로덕션 빌드
bun run start        # 프로덕션 서버 실행
bun run lint         # 린트 검사
bun run type-check   # TypeScript 타입 검사
```

### 데이터베이스
```bash
bun run db:setup     # 초기 데이터베이스 설정
bun run db:push      # 데이터베이스 스키마 푸시
bun run db:studio    # Drizzle Studio 실행
bun run db:migrate   # 마이그레이션 실행
bun run db:seed      # 시드 데이터 생성
```

### 테스트
```bash
bun run test:e2e     # Playwright E2E 테스트 실행
bun run test:e2e:ui  # Playwright UI 모드로 테스트
```

### 관리
```bash
bun run set-admin <email-or-username>  # 관리자 권한 설정
bun run analyze                        # 번들 사이즈 분석
```

## 리빌딩 전략 (v3.0)

### 안정성 우선 접근
1. **기존 스키마 보존**: reviews, music_diaries 테이블은 수정하지 않음
2. **신규 스키마 생성**: moments 관련 새로운 테이블 생성
3. **점진적 전환**: 신규 기능은 moments 스키마만 사용
4. **데이터 마이그레이션**: 안정화 후 별도 진행

### 새로운 DB 스키마
- `moments` - 순간 포스팅 메인 테이블
- `moment_likes` - 좋아요 관계
- `moment_comments` - 댓글
- `moment_bookmarks` - 저장/북마크
- `user_preferences` - 음악 취향 정보
- `follows` - 팔로우 관계

## 성능 최적화

### React Query 캐싱 전략
- **STATIC**: 24시간 (정적 데이터)
- **DYNAMIC**: 5분 (자주 변경되는 데이터)
- **REALTIME**: 0 (실시간 데이터)
- **USER**: 10분 (사용자 데이터)

### 이미지 최적화
- **Cloudflare Images**: 자동 리사이징 및 최적화
- **반응형 이미지**: thumbnail, card, avatar, gallery, hero 변형
- **Lazy Loading**: 뷰포트 진입 시 로딩

### 번들 최적화
- **코드 스플리팅**: React, UI, Forms, Utils 청크 분리
- **동적 임포트**: 페이지별 컴포넌트 lazy loading
- **Tree Shaking**: 사용하지 않는 코드 자동 제거

## 모니터링 및 분석

### 에러 추적 (Sentry)
- 실시간 에러 모니터링
- 사용자 세션 재현
- 성능 메트릭 추적

### 사용자 분석
- **Google Analytics 4**: 사용자 행동 분석
- **Vercel Analytics**: 실시간 성능 메트릭
- **커스텀 이벤트**: 공연 조회, 순간 작성, 검색 사용 등

## 배포

### Vercel 배포
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 빌드 설정:
  - Framework: Next.js
  - Build Command: `bun run build`
  - Install Command: `bun install`

## 제품 로드맵

### Phase 1: MVP 리빌딩 (현재 → 3개월)
- ✅ **공연**: 통합 캘린더, 필터링, 북마크
- ✅ **순간**: 이미지 중심 피드, 공연 태그
- ✅ **프로필**: 통합 프로필, 팔로우 시스템
- 🚧 **정보 뱃지**: 유용한 정보 하이라이트

### Phase 2: 커뮤니티 활성화 (3-6개월)
- 음악 취향 매칭
- 공연 동행 찾기
- 24시간 스토리
- 아티스트 팬 공간

### Phase 3: 플랫폼 확장 (6개월+)
- 티켓 & 굿즈 아카이빙
- 음악 스트리밍 서비스 연동
- 페스티벌 캠핑 매칭
- AR 경험

## 기여하기

이 프로젝트는 현재 비공개로 개발 중입니다. 문의사항이 있으시면 이슈를 생성해주세요.

## 라이선스

All rights reserved. 이 프로젝트의 소스 코드는 저작권법에 의해 보호됩니다.

---

_"few는 음악 팬들의 필수 유틸리티이자, 음악을 사랑하는 사람들의 라이프스타일을 담는 소셜 공간입니다."_