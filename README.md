# few - 페스티벌 리뷰 앱

> 우리의 취향과 꿀팁이 모이는 공간

라이브 공연 및 페스티벌 참가자들이 경험을 즐기고 공유하는 커뮤니티 플랫폼입니다.

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **API**: tRPC
- **Database**: PostgreSQL + Drizzle ORM
- **State Management**: TanStack Query

## 빠른 시작 (Quick Start)

### 옵션 1: Docker로 로컬 개발 환경 설정

```bash
# 1. Docker로 PostgreSQL 실행
docker-compose up -d

# 2. 환경 변수 설정
cp .env.local.example .env.local

# 3. 의존성 설치
npm install

# 4. 데이터베이스 초기화
npm run db:push

# 5. 개발 서버 실행
npm run dev
```

### 옵션 2: Supabase로 클라우드 환경 설정

1. [Supabase](https://supabase.com)에서 무료 프로젝트 생성
2. Project Settings → Database에서 Connection String 복사
3. `.env.local` 파일에 DATABASE_URL 설정
4. 위의 3-5번 단계 실행

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
npm install
```

### 3. 데이터베이스 설정

package.json에 다음 스크립트를 추가하세요:
```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

그 다음 실행:
```bash
# 데이터베이스 마이그레이션 생성
npm run db:generate

# 마이그레이션 적용
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
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

- `npm run dev` - 개발 서버 실행 (포트 3030)
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - 린트 검사

## Clerk 웹훅 설정

Clerk 대시보드에서 웹훅 엔드포인트를 설정하세요:
- Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`
