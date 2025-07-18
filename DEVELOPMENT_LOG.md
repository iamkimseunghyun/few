# few 개발 로그 & 프로젝트 현황

## 🚀 Quick Start

### 프로덕션

- **URL**: https://few-theta.vercel.app/
- **배포일**: 2025-07-16
- **상태**: MVP 완성 ✅

### 개발 환경 설정

> **📦 Package Manager**: 이제 Bun을 사용합니다! (npm 대신)

```bash
# 0. Bun 설치 (아직 없다면)
curl -fsSL https://bun.sh/install | bash

# 1. 환경 변수 설정
cp .env.local
# Clerk, Neon Database URL, Cloudinary 설정 필요

# 2. 의존성 설치
bun install

# 3. 데이터베이스 셋업
bun run db:setup
bun run db:migrate
bun run db:seed

# 4. 개발 서버 실행
bun run dev
```

### 주요 명령어

```bash
# 관리자 설정
bun run set-admin <email-or-username>

# 데이터베이스 관리
bun run db:studio          # Drizzle Studio 실행
bun run db:push            # 스키마 푸시
bun run db:migrate         # 마이그레이션 실행

# 개발
bun run dev                # 개발 서버 (http://localhost:3030)
bun run build              # 프로덕션 빌드
bun run lint               # ESLint 실행

# 패키지 관리
bun add <package>          # 패키지 추가
bun remove <package>       # 패키지 제거
bun update                 # 패키지 업데이트
```

### Bun 사용의 장점
- ⚡ **빠른 패키지 설치**: npm보다 3-10배 빠른 의존성 설치
- 🔧 **내장 기능**: TypeScript, JSX, .env 파일 자동 지원
- 📦 **효율적인 캐시**: 더 작은 디스크 사용량
- 🚀 **빠른 스크립트 실행**: 개발 서버 시작이 더 빠름

### 주의사항
- Next.js 빌드 시간은 npm과 동일 (Next.js가 Node.js 기반이므로)

### 핵심 페이지

- 홈: `/`
- 이벤트 목록: `/events`
- 리뷰 목록: `/reviews`
- 리뷰 작성: `/reviews/new` (로그인 필요)
- 프로필: `/profile` (로그인 필요)
- 관리자: `/admin` (관리자 권한 필요)

---

## 2025-07-18 - Bun 패키지 매니저로 전환

### 전환 이유
- npm의 느린 설치 속도와 deprecation warning 문제
- Bun의 뛰어난 성능과 개발자 경험
- TypeScript, JSX 내장 지원으로 빠른 개발

### 변경 사항
- 모든 `npm` 명령어를 `bun`으로 변경
- `package-lock.json` → `bun.lockb` (바이너리 락파일)
- 더 빠른 의존성 설치 및 스크립트 실행

## 2025-07-18 - 런타임 에러 완전 해결 ✅

### 문제 분석
- "Event handlers cannot be passed to Client Component props" 에러가 계속 발생
- Sentry 대시보드에서 확인한 에러 정보:
  - 에러 위치: 홈페이지(`/`) 로딩 시
  - 문제 요소: `{onClick: function onClick, className: ..., children: ...}`
  - digest: '2724926399'

### 근본 원인 발견
- **문제**: `app/layout.tsx`에서 Server Component인 RootLayout이 Client Component인 `ClerkProvider`를 직접 사용
- Server Component에서 `headers()` 함수를 호출하면서 Client Component에 전달하려고 시도
- Next.js 15와 React 19의 엄격한 Server/Client Component 경계 검사로 인한 에러

### 해결 방법 (Provider 분리 패턴 적용)
1. **`src/app/providers.tsx` 생성**
   ```typescript
   'use client';
   
   export function Providers({ children }: { children: React.ReactNode }) {
     return (
       <ClerkProvider>
         <ThemeProvider>
           <TRPCReactProvider>
             {children}
           </TRPCReactProvider>
         </ThemeProvider>
       </ClerkProvider>
     );
   }
   ```

2. **`app/layout.tsx` 수정**
   - `async` 함수에서 일반 함수로 변경
   - `headers()` 호출 및 관련 코드 제거
   - 모든 Provider를 `<Providers>` 컴포넌트로 교체
   - Server Component 유지하면서 metadata 설정 가능

3. **`src/lib/trpc-client.tsx` 수정**
   - `headers` prop 제거
   - 더 간단한 구조로 개선

### 성과
- ✅ "Event handlers cannot be passed to Client Component props" 에러 완전 해결
- ✅ Server Component의 이점 유지 (SEO, 성능)
- ✅ 코드 구조 개선 (Provider 로직 분리)
- ✅ Next.js 15 & React 19 호환성 확보

## 2025-07-18 - 코드 품질 개선 및 빌드 오류 수정

### 수행한 작업

1. **ESLint 오류 수정 (50개 이상)**
   - 모든 `<img>` 태그를 Next.js `<Image>` 컴포넌트로 교체
   - 사용하지 않는 변수 및 import 제거
   - TypeScript `any` 타입을 구체적인 타입으로 변경
   - React Hook 규칙 위반 수정

2. **TypeScript 타입 오류 해결**
   - `ReviewWithDetails` 인터페이스에서 존재하지 않는 필드 제거
   - API 응답 구조와 컴포넌트 기대값 불일치 수정
   - Zod 스키마와 실제 데이터 구조 동기화
   - NonNullable 유틸리티 타입 활용으로 null 처리 개선

3. **주요 파일 수정 내역**
   - `/src/lib/trpc-server.ts`: AbortSignal 타입 이슈 해결
   - `/src/modules/reviews/types/index.ts`: DB 스키마와 타입 동기화
   - `/src/modules/music-diary/components/`: API 응답 구조 접근 방식 수정
   - `/src/server/api/routers/`: 누락된 필드 추가 및 SQL 쿼리 개선

### 성과
- ESLint: 0 errors, 0 warnings ✅
- TypeScript 빌드: 성공 ✅
- 모든 이미지 최적화 완료 ✅

## 2025-01-17 ~ 2025-07-17 - 다이어리 기능 구현 & 모바일 최적화

### 다이어리 (음악 일기) 기능 - 완성 ✅

1. **핵심 기능**
   - 이벤트 참여 일기 작성 (사진, 동영상 포함)
   - 공개/비공개 설정
   - 셋리스트 기록
   - 댓글 및 좋아요
   - 이미지/동영상 캐러셀

2. **기술적 특징**
   - Cloudflare Images & Stream 연동
   - 미디어 업로드 최적화
   - 반응형 캐러셀 UI

3. **DB 스키마**
   - `music_diaries` 테이블 추가
   - `diary_comments`, `diary_likes` 관계 테이블
   - 미디어 메타데이터 JSON 저장

4. **성능 최적화**
   - 이미지 리사이징 API 활용
   - 비디오 스트리밍 최적화
   - 캐러셀 transform 애니메이션

5. **UI/UX 개선**
   - 모달 기반 상세 보기
   - 스와이프 제스처 지원
   - 반응형 그리드 레이아웃

6. **성능 최적화**
   - 이미지 lazy loading
   - 캐러셀 transform 애니메이션
   - 중복 트랜지션 방지
   - SSR 호환성 보장

#### 기술적 특징
- **tRPC v11**: 타입 안전한 API
- **Drizzle ORM**: PostgreSQL 스키마 관리
- **Next.js 15.3.5**: App Router, 인터셉팅 라우트
- **Tailwind CSS v4**: 반응형 디자인
- **React 19**: use() hook 활용

### 2025-01-17 - 모바일 UX 개선 & 성능 최적화

#### 주요 작업

1. **모바일 UX 최적화**
   - **하단 네비게이션 바 구현**
     - 5-column grid 레이아웃 (홈, 이벤트, 작성, 검색, 프로필)
     - 플로팅 중앙 작성 버튼
     - 현재 페이지 하이라이트
     - React Native WebView 환경 고려
   
   - **스와이프 제스처 추가**
     - `useSwipe` 커스텀 훅 구현
     - 터치 이벤트 기반 방향 감지
     - 카테고리 필터 스와이프 네비게이션
     - 속도 임계값 기반 제스처 인식

2. **리뷰 자동 저장 기능**
   - **LocalStorage 기반 드래프트 저장**
     - `useLocalStorage` 커스텀 훅 (SSR safe)
     - `useReviewDraft` 전용 훅 구현
     - 3초 디바운스 자동 저장
   
   - **드래프트 복구 UI**
     - 모달 기반 복구 확인
     - 저장 시간 표시
     - 임시 저장 상태 인디케이터

3. **이미지 최적화**
   - **Next.js Image 컴포넌트 전환**
     - 모든 이미지를 최적화된 컴포넌트로 교체
     - 반응형 sizes 속성 적용
     - WebP 포맷 자동 변환
   
   - **Blur Placeholder 구현**
     - `BlurImage` 컴포넌트 생성
     - Base64 SVG blur 데이터 URL 생성
     - 이미지 로딩 중 부드러운 전환 효과
   
   - **성능 개선**
     - Lazy loading 적용
     - srcset을 통한 다양한 해상도 제공
     - 이미지 우선순위 설정 (LCP 최적화)

4. **공개 라우팅 구현** (오전 작업)
   - 미들웨어 수정: `/events`, `/reviews` 비로그인 접근 허용
   - 이벤트 목록, 상세페이지 공개
   - 리뷰 목록, 상세페이지 공개
   - 로그인 상태에 따른 조건부 UI (리뷰 작성, 북마크 등)

5. **카테고리 한글화 통일** (오전 작업)
   - 전체 앱에서 카테고리 한글 표시 통일
   - `categoryLabels` 매핑 추가 (festival→페스티벌, concert→콘서트 등)
   - 홈페이지, 이벤트 목록, 캘린더, 관리자 페이지 적용
   - 모바일 헤더용 카테고리 약어 추가 (F, C, O, P, E)

6. **카테고리 필터 버그 수정** (오전 작업)
   - `EventCategory` enum 타입 정의 및 일관성 확보
   - 캘린더 필터링 로직 수정 (string[] → EventCategory[])
   - 관리자 대시보드 카테고리 필터 개선
   - DB 스키마와 TypeScript 타입 동기화

7. **데이터베이스 안정화 추가 작업** (오전 작업)
   - Neon serverless 드라이버 관련 타입 호환성 문제 해결
   - `comments.ts` returning() 타입 이슈 수정
   - 데이터베이스 연결 설정 단순화

### 2025-07-17 - Neon DB 마이그레이션 & 안정화

#### 주요 작업

1. **Neon DB 마이그레이션 완료**
   - Supabase → Neon 완전 이전
   - 모든 프로덕션 데이터 이전 (Users: 4개, Events: 9개, Reviews: 6개 등)
   - 서버리스 환경 최적화, 자동 connection pooling

2. **데이터베이스 구조 개선**
   - `src/lib/db/server.ts` 제거, `index.ts`로 통합
   - SQL 쿼리 최적화 (테이블 참조 명확화)
   - 누락된 필드 추가 (description, ticketPriceRange 등)

3. **API 안정성 향상**
   - 인증 미들웨어 개선 (userId만 체크)
   - SQL 서브쿼리 버그 수정
   - 50개 이상의 ESLint 오류 해결

### 2025-07-16 - MVP 완성 & Vercel 배포 🎉

#### 구현 완료된 기능
1. **사용자 인증** (Clerk)
   - 소셜 로그인 (Google, Kakao)
   - 프로필 관리

2. **이벤트 관리**
   - 이벤트 목록/상세 보기
   - 카테고리별 필터링
   - 관리자 CRUD

3. **리뷰 시스템**
   - 다면 평가 (종합/음향/시야/안전/운영)
   - 이미지 업로드 (Cloudinary)
   - 좋아요/북마크
   - 베스트 리뷰 선정

4. **커뮤니티 기능**
   - 댓글 시스템
   - 팔로우/팔로잉
   - 알림 시스템

5. **검색 기능**
   - 통합 검색 (이벤트/리뷰/사용자)
   - 실시간 검색 결과

---

## 🎯 다음 진행 가능한 작업들

### 우선순위 높음 ⭐⭐⭐

1. **성능 최적화**
   - [ ] React Query 설정 최적화로 API 응답 캐싱 개선
   - [ ] 번들 사이즈 최적화 (코드 스플리팅, tree shaking)
   - [ ] Cloudflare Images 리사이징 API 활용한 이미지 최적화
   - [ ] 무한 스크롤에 가상화(virtualization) 적용

2. **테스트 구축**
   - [ ] E2E 테스트 - Playwright 설정 및 핵심 시나리오 테스트 구현
   - [ ] 단위 테스트 - 중요 컴포넌트와 훅 테스트 작성
   - [ ] 통합 테스트 - API 라우트 테스트 구현

3. **모니터링 구축**
   - [ ] Sentry 재설정 - 에러 모니터링 활성화
   - [ ] Analytics 설정 - Google Analytics 또는 Vercel Analytics 추가
   - [ ] Web Vitals 측정 - 성능 모니터링 구현

### 중간 우선순위 ⭐⭐

4. **UX 개선**
   - [ ] 온보딩 플로우 - 신규 사용자 가이드
   - [ ] 고급 검색 필터 - 날짜, 지역, 가격대별 필터
   - [ ] 리뷰 템플릿 - 카테고리별 맞춤형 리뷰 양식
   - [ ] 소셜 공유 - 리뷰/다이어리 SNS 공유 기능

5. **접근성 개선**
   - [ ] 키보드 네비게이션 개선
   - [ ] 스크린 리더 지원 강화
   - [ ] 고대비 모드 추가
   - [ ] 폰트 크기 조절 기능

### 낮은 우선순위 ⭐

6. **신규 기능**
   - [ ] 티켓 마켓플레이스 - 안전거래 시스템
   - [ ] 이벤트 알림 - 관심 아티스트/장소 기반
   - [ ] 커뮤니티 포럼 - 자유 토론 공간
   - [ ] 포인트/뱃지 시스템 - 활동 보상

7. **관리자 기능 강화**
   - [ ] 대시보드 통계 - 상세 분석 차트
   - [ ] 일괄 작업 - 다중 선택 관리
   - [ ] 신고 관리 시스템
   - [ ] 자동화 규칙 설정

## 📝 기술 스택 상세

- **Frontend**: Next.js 15.3.5, React 19, TypeScript
- **Styling**: Tailwind CSS v4, CSS Modules
- **State**: TanStack Query v5, Zustand
- **Backend**: tRPC v11, Drizzle ORM
- **Database**: Neon (PostgreSQL)
- **Auth**: Clerk
- **Media**: Cloudinary (이미지), Cloudflare Stream (동영상)
- **Deployment**: Vercel
- **Monitoring**: Sentry (설정 필요)

## 🔧 주요 설정 파일

- `.env.local` - 환경 변수
- `drizzle.config.ts` - DB 설정
- `next.config.js` - Next.js 설정
- `tailwind.config.ts` - 스타일 설정

## 📚 참고 문서

- [Next.js 15 문서](https://nextjs.org/docs)
- [tRPC v11 문서](https://trpc.io/docs)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Clerk 문서](https://clerk.com/docs)