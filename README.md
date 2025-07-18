# few - 페스티벌 리뷰 앱

> 우리의 취향과 꿀팁이 모이는 공간

라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티 플랫폼입니다.

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **API**: tRPC
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **State Management**: TanStack Query
- **Package Manager**: Bun (빠른 설치 및 실행)

## 빠른 시작 (Quick Start)

### 사전 요구사항

```bash
# Bun 설치 (아직 없다면)
curl -fsSL https://bun.sh/install | bash
```

### 환경 설정

```bash
# 1. 환경 변수 설정
cp .env.local.example .env.local

# 2. 의존성 설치 (빠른 속도!)
bun install

# 3. 데이터베이스 초기화
bun run db:push

# 4. 개발 서버 실행
bun run dev
```

### 데이터베이스 옵션

1. **Neon** (추천): https://neon.tech 에서 무료 PostgreSQL 인스턴스 생성
2. **Supabase**: https://supabase.com 에서 무료 프로젝트 생성
3. **Docker**: 로컬에서 PostgreSQL 실행

## 상세 설정 가이드

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 실제 값을 입력하세요:

```bash
cp .env.example .env.local
```

필요한 환경 변수:
- **Clerk 인증 키** (https://clerk.com에서 발급)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 대시보드에서 API Keys에서 확인
  - `CLERK_SECRET_KEY`: Clerk 대시보드에서 API Keys에서 확인
  - `WEBHOOK_SECRET`: Clerk Webhooks 설정 시 생성

- **PostgreSQL 데이터베이스 URL**
  - 예: `postgresql://username:password@localhost:5432/few_db`
  - 또는 Supabase, Neon 등의 호스팅 서비스 사용 가능

> **참고**: 데이터베이스 설정 없이도 앱은 실행되지만, 데이터 저장 기능은 작동하지 않습니다.

### 2. 의존성 설치

```bash
bun install
```

### 3. 데이터베이스 설정

```bash
# 데이터베이스 스키마 푸시
bun run db:push

# 데이터베이스 관리 UI 실행 (선택사항)
bun run db:studio

# 시드 데이터 생성 (선택사항)
bun run db:seed
```

### 4. 개발 서버 실행

```bash
bun run dev
```

http://localhost:3030에서 앱을 확인할 수 있습니다.

## 주요 기능

- **구조화된 리뷰 작성**: 음향, 시야, 안전, 운영 등 세부 경험 기록
- **소셜 인증**: Clerk를 통한 간편한 소셜 로그인
- **홈 피드**: 최신 리뷰를 탐색할 수 있는 피드
- **사용자 프로필**: 작성한 리뷰 관리

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # 인증 관련 페이지
│   └── api/            # API 라우트
├── features/           # 기능별 모듈
│   ├── auth/          # 인증 기능
│   ├── events/        # 이벤트 기능
│   ├── home/          # 홈 피드
│   └── reviews/       # 리뷰 기능
├── lib/               # 공통 라이브러리
│   └── db/           # 데이터베이스 설정
└── server/           # 서버 로직
    └── routers/      # tRPC 라우터
```

## 스크립트

- `bun run dev` - 개발 서버 실행 (포트 3030)
- `bun run build` - 프로덕션 빌드
- `bun run start` - 프로덕션 서버 실행
- `bun run lint` - 린트 검사
- `bun run db:push` - 데이터베이스 스키마 푸시
- `bun run db:studio` - Drizzle Studio 실행
- `bun run db:migrate` - 마이그레이션 실행
- `bun run db:seed` - 시드 데이터 생성

## Bun vs npm 성능 비교

- **의존성 설치**: 3-10배 빠름 ⚡
- **개발 서버 시작**: 더 빠른 콜드 스타트
- **캐시 효율성**: 더 작은 디스크 사용량
- **내장 기능**: TypeScript, .env 파일 자동 지원
- **빌드 시간**: 동일 (Next.js는 Node.js 기반)

## Clerk 웹훅 설정

Clerk 대시보드에서 웹훅 엔드포인트를 설정하세요:
- Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`
