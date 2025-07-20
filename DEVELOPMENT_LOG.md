# few 개발 로그 & 프로젝트 현황

## 2025-01-20 - 메인 페이지 캘린더 UI 개선 및 통합 ✅

### 작업 내용
- **캘린더 통합**: 다이어리 캘린더(DiaryCalendarView)를 메인 페이지에 적용
- **코드 중복 제거**: EventCalendar 컴포넌트 대신 DiaryCalendarView 재사용
- **모달 뷰포트 문제 해결**: React Portal을 사용한 모달 위치 수정

### 주요 변경사항

#### 1. DiaryCalendarView 확장
- `mode` prop 추가: 'diary' | 'event' | 'both' 모드 지원
- 이벤트 데이터 표시 기능 추가
- 날짜별 이벤트 그룹화 (여러 날에 걸친 이벤트 처리)
- 카테고리별 색상 인디케이터

#### 2. 메인 페이지 적용
```tsx
<DiaryCalendarView 
  mode="event"
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
/>
```

#### 3. EventModal 뷰포트 문제 해결
- **문제**: 모달이 페이지 전체 기준으로 중앙 정렬되어 스크롤 시 보이지 않음
- **해결**: React Portal (`createPortal`)을 사용하여 body에 직접 렌더링
- z-index: 9999로 설정하여 최상위 레이어에 표시
- 모달 열릴 때 body overflow hidden 적용으로 배경 스크롤 방지

### 기술적 성과
- ✅ 코드 재사용성 향상 (하나의 캘린더 컴포넌트로 통합)
- ✅ 일관된 UI/UX 제공
- ✅ 모달이 항상 뷰포트 중앙에 표시
- ✅ 향후 'both' 모드로 이벤트와 다이어리 동시 표시 가능

### 향후 계획
- **사용자 일정 등록 기능**: 사용자가 직접 공연/페스티벌 일정을 등록하고 편집할 수 있는 기능 추가 예정
  - 일정 생성 폼 (날짜, 장소, 카테고리, 라인업 등)
  - 일정 수정/삭제 기능
  - 사용자가 등록한 일정과 공식 일정 구분 표시
  - 일정 공유 기능 (공개/비공개 설정)

---

## 2025-01-20 - 다이어리 모달 미디어 표시 문제 해결 ✅

### 문제 상황
- 다이어리 모달에서 미디어(이미지)가 표시되지 않는 문제 발생
- 모달 레이아웃이 전체 화면을 활용하지 못하고 왼쪽으로 치우치는 문제

### 원인 분석
1. **DiaryMediaViewer와 MediaGallery의 중복**: 두 개의 서로 다른 미디어 표시 컴포넌트가 혼재
2. **Cloudflare Image ID 처리 불일치**: 
   - DiaryMediaViewer는 Cloudflare Image ID를 처리하려고 시도
   - MediaGallery는 일반 URL을 기대
   - 데이터베이스에는 `url` 필드로 저장되어 있음
3. **환경 변수 문제**: `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`가 설정되지 않으면 이미지 URL 생성 실패
4. **모달 레이아웃 문제**: Modal 컴포넌트의 flex 클래스로 인한 레이아웃 깨짐

### 해결 방법

#### 1. MediaGallery 컴포넌트로 통합
- DiaryMediaViewer 대신 이미 리뷰에서 잘 작동하는 MediaGallery 사용
- MediaGallery에 Cloudflare Images 지원 추가
- 이미지 URL 처리 헬퍼 함수 `processImageUrl` 구현

#### 2. 미디어 데이터 변환 로직 추가
```typescript
// MediaGallery를 위한 미디어 데이터 변환
const media = rawMedia.map(item => {
  if (item.url && item.type) return item;
  if (typeof item === 'string') return { url: item, type: 'image' };
  return {
    url: item.id || item.imageId || item,
    type: item.type || 'image',
    thumbnailUrl: item.thumbnailUrl
  };
});
```

#### 3. 모달 레이아웃 수정
- Modal 컴포넌트: 패딩을 overlay에 적용, wrapper는 전체 높이 활용
- DiaryModalContent: 모바일에서 `h-[60vh]`, 데스크톱에서 `h-full`
- 불필요한 높이 제약 제거

#### 4. Cloudflare Images 처리 개선
- 환경 변수가 없는 경우에도 일반 Image 컴포넌트로 폴백
- 디버깅 로그 추가로 문제 진단 용이성 향상

### 기술적 교훈
1. **컴포넌트 재사용성**: 이미 잘 작동하는 컴포넌트(MediaGallery)를 재활용하는 것이 효율적
2. **데이터 구조 일관성**: API 응답과 컴포넌트가 기대하는 데이터 구조를 일치시켜야 함
3. **환경 변수 폴백**: 환경 변수가 없을 때도 작동하도록 폴백 로직 구현 필요
4. **디버깅의 중요성**: console.log를 통한 데이터 구조 확인이 문제 해결의 핵심

### 성과
- ✅ 다이어리 모달에서 미디어가 정상적으로 표시됨
- ✅ 이미지 스와이프 기능 작동
- ✅ 모달이 전체 화면을 제대로 활용
- ✅ Cloudflare Images와 일반 이미지 URL 모두 지원

---

## 2025-01-19 - 순간(Diary) 페이지 소셜 플랫폼으로 전환 🎉

### 주요 작업 내용

#### 1. 플랫폼 방향성 재정립
- **기존**: 개인 일기장 형태의 순간 페이지
- **변경**: 인스타그램 스타일의 음악 경험 공유 소셜 플랫폼
- **PROJECT.md 기반**: "인스타그램 meets 음악 라이프" 컨셉 실현

#### 2. 순간 상세 페이지 인스타그램 스타일 개편
- **레이아웃 변경**:
  - 좌측: 대형 이미지 영역 (검은 배경)
  - 우측: 소셜 인터랙션 영역
- **소셜 기능 추가**:
  - 좋아요, 댓글, 공유, 저장 기능
  - 실시간 좋아요 수 업데이트
  - 댓글 섹션 통합
- **이미지 네비게이션**:
  - 좌우 화살표 버튼
  - 하단 인디케이터
  - 멀티 이미지 지원

#### 3. 모달 디자인 PC 인스타그램 스타일로 개선
- **DiaryModalContent 완전 재설계**
- **3:2 비율 레이아웃** (이미지:콘텐츠)
- **스크롤 가능한 콘텐츠 영역**
- **통일된 소셜 인터랙션 UI**

#### 4. 네비게이션 메뉴 개선
- **용어 변경**: 일정 → 공연
- **적용 범위**:
  - 데스크톱 헤더
  - 모바일 네비게이션
  - EventsListPage 타이틀 및 메시지

#### 5. 기본 공개 설정 변경 계획
- **현재**: 기본값 비공개 (defaultPrivate={true})
- **변경 예정**: 기본값 공개 (소셜 플랫폼 특성)
- **추가 예정**: 팔로우한 사람들의 순간 피드

### 기술적 개선사항
- DiaryDetailView 컴포넌트 완전 재작성
- DiaryModalContent 인스타그램 스타일 적용
- 반응형 디자인 (모바일/PC 대응)
- 이미지 슬라이더 기능 구현
- 소셜 인터랙션 API 연동

### 향후 작업 예정
- [ ] 피드를 소셜 형태로 변경 (팔로우한 사람들 순간 보기)
- [ ] 기본 공개 설정 변경
- [ ] 음악 취향 기반 추천 시스템
- [ ] 셋리스트 공유 기능 강화

---

## 🚀 Quick Start

### 프로덕션

- **URL**: https://few-theta.vercel.app/
- **배포일**: 2025-01-16
- **상태**: MVP 완성 ✅

### 개발 환경 설정

> **📦 Package Manager**: 이제 Bun을 사용합니다! (npm 대신)

```bash
# 0. Bun 설치 (아직 없다면)
curl -fsSL https://bun.sh/install | bash

# 1. 환경 변수 설정
cp .env.example .env.local
# Clerk, Neon Database URL, Cloudflare Images, Sentry, Google Analytics 설정 필요

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
- 공연 목록: `/events`
- 기록 목록: `/reviews`
- 기록 작성: `/reviews/new` (로그인 필요)
- 프로필: `/profile` (로그인 필요)
- 관리자: `/admin` (관리자 권한 필요)

---

## 2025-01-19 - React 19 호환성 & UI 개선 ✅

### 주요 작업 내용

#### 1. VirtualizedList 제거 및 무한 스크롤 개선
- **문제**: 브라우저 스크롤과 피드 리스트 스크롤 이중 발생
- **해결**: VirtualizedList 완전 제거, 일반 InfiniteFeed로 대체
- **삭제된 파일**:
  - `/src/components/VirtualizedList.tsx`
  - `/src/modules/shared/ui/components/VirtualizedInfiniteFeed.tsx`
- **업데이트된 컴포넌트**:
  - DiaryFeed: VirtualizedInfiniteFeed → InfiniteFeed
  - ReviewsListPage: VirtualizedInfiniteFeed → InfiniteFeed

#### 2. React 19 forwardRef 제거
- **문제**: React 19에서 forwardRef deprecated
- **해결**: 모든 forwardRef 제거, ref를 일반 prop으로 처리
- **주요 수정 컴포넌트**:
  - Button, Input, Card, TouchableOpacity 등
  - ref prop 타입은 React.Ref<T>로 통일

#### 3. MediaGallery 컴포넌트 재조직
- **기존 문제**: 중복된 MediaGallery 컴포넌트, 모듈별 분산
- **해결 방법**:
  - 기존 MediaGallery, MediaCarousel 삭제
  - ReviewMediaGallery를 MediaGallery로 이름 변경
  - `/src/modules/shared/ui/components/MediaGallery/`로 이동
- **개선 사항**:
  - aspectRatio prop 추가 ('video' | 'square' | 'portrait' | 'original')
  - 접근성 향상 (aria-label, 키보드 네비게이션)
  - 네비게이션 컨트롤 개선

#### 4. UI 용어 통합 변경
- **변경 내용**:
  - 다이어리 → 순간 (Diary → Moment)
  - 리뷰 → 기록 (Review → Record)
  - 이벤트 → 일정 (Event → Schedule)
- **적용 범위**:
  - 네비게이션 메뉴 (MobileNav, Header)
  - 페이지 메타데이터
  - EmptyState 메시지
  - 모든 UI 텍스트
- **미적용**: 컴포넌트 이름, 라우트, 스키마는 유지

### 기술적 성과
- ✅ React 19 완전 호환성 확보
- ✅ 중복 코드 제거 및 컴포넌트 통합
- ✅ 레이아웃 및 스크롤 문제 해결
- ✅ 일관된 UI 용어 체계 확립

---

## 2025-01-19 - 모바일 UX 개선 (Pull to Refresh, FAB, 터치 피드백) ✅

### 작업 내용

#### 1. Pull to Refresh 구현
- **usePullToRefresh Hook 개발**
  - 터치 이벤트 기반 제스처 감지
  - 상태 관리: pullDistance, isRefreshing, isReady
  - threshold 기반 새로고침 트리거
  - passive 이벤트 리스너로 성능 최적화

- **PullToRefresh 컴포넌트**
  - 재사용 가능한 래퍼 컴포넌트
  - ArrowPathIcon 애니메이션 (회전 및 스케일)
  - 부드러운 전환 효과

- **주요 페이지 적용**
  - 홈 페이지: 리뷰 및 이벤트 동시 새로고침
  - 이벤트 목록: 전체 이벤트 리스트 새로고침
  - 리뷰 목록: 무한 스크롤 리스트 새로고침
  - 검색 결과: 검색 결과 새로고침

#### 2. 플로팅 액션 버튼(FAB) 개선
- **useScrollDirection Hook**
  - 스크롤 방향 감지 (상향/하향)
  - 디바운스 처리로 성능 최적화
  - requestAnimationFrame 활용

- **FloatingActionButton 컴포넌트**
  - 스크롤 시 자동 숨김/표시
  - 부드러운 전환 애니메이션 (translate, opacity)
  - 접근성 개선 (aria-label, sr-only)
  - 다양한 위치 옵션 지원

- **적용 페이지**
  - 이벤트 목록: 리뷰 작성 FAB
  - 리뷰 목록: 리뷰 작성 FAB

#### 3. 터치 피드백 강화
- **TouchableOpacity 컴포넌트**
  - 터치 시 투명도 변경 효과
  - 커스터마이징 가능한 activeOpacity

- **Ripple 컴포넌트**
  - Material Design 스타일 리플 효과
  - 터치/클릭 위치 기반 애니메이션
  - CSS 애니메이션으로 부드러운 효과

- **TouchFeedback 래퍼 컴포넌트**
  - opacity, ripple, both 타입 지원
  - 기존 컴포넌트에 쉽게 적용 가능

- **적용 요소**
  - 카테고리 필터 버튼 (opacity)
  - 리뷰 작성 버튼 (ripple)
  - 좋아요/북마크 버튼 (opacity)

### 기술적 특징
- 모든 터치 이벤트에 passive 리스너 사용
- 성능 최적화를 위한 debounce/throttle 적용
- 접근성 고려한 ARIA 속성 추가
- 모바일 최적화된 터치 영역 확보

### 성과
- ✅ 네이티브 앱과 유사한 사용자 경험
- ✅ 모든 주요 인터랙션에 즉각적인 시각적 피드백
- ✅ 스크롤 기반 UI 최적화
- ✅ 부드러운 애니메이션과 전환 효과

---

## 2025-01-18 - Analytics 시스템 구축 ✅

### 작업 내용

1. **Google Analytics 4 통합**
   - `@next/third-parties/google` 패키지를 사용한 GA4 설정
   - `GoogleAnalytics.tsx` 컴포넌트 생성
   - 측정 ID: G-GXK7SWMWJ7
   - gtag.js 자동 로드 및 초기화

2. **Vercel Analytics 통합**
   - `@vercel/analytics` 및 `@vercel/speed-insights` 패키지 설치
   - `Analytics.tsx` 래퍼 컴포넌트 생성
   - Speed Insights로 실시간 성능 메트릭 수집

3. **통합 이벤트 추적 시스템**
   - `src/lib/analytics.ts` 유틸리티 생성
   - 타입 안전한 `AnalyticsEvent` 인터페이스 정의
   - `trackEvent` 함수로 Vercel과 GA4 동시 추적
   - 이벤트 타입:
     - event_click: 이벤트 클릭
     - category_filter: 카테고리 필터 변경
     - review_submit: 리뷰 제출
     - search: 검색 실행
     - page_view: 페이지 조회

4. **주요 컴포넌트 이벤트 추적 구현**
   - **EventsListPage**: 이벤트 클릭, 카테고리 필터
   - **EventDetailPage**: 페이지 뷰, 리뷰 시작
   - **ReviewForm**: 리뷰 제출
   - **SearchResults**: 검색 쿼리 및 결과
   - **ReviewCard**: 좋아요 액션
   - **CreateDiaryForm**: 다이어리 생성, 사진 업로드

5. **Web Vitals 모니터링**
   - `src/app/web-vitals.tsx` 구현
   - Core Web Vitals 메트릭 수집 (LCP, FID, CLS, FCP, TTFB)
   - GA4와 Sentry로 성능 데이터 전송
   - 성능 저하 시 Sentry 경고

6. **빌드 오류 수정**
   - TypeScript 타입 오류 해결
   - ESLint 규칙 준수
   - tRPC v11 호환성 문제 수정
   - prefetch-utils.ts 타입 이슈 해결

### 성과
- ✅ Google Analytics 4 완전 통합
- ✅ Vercel Analytics 실시간 모니터링
- ✅ 포괄적인 사용자 행동 추적
- ✅ Web Vitals 성능 모니터링
- ✅ 타입 안전한 이벤트 시스템

## 2025-01-18 - 성능 최적화 완료 ✅

### 작업 내용

1. **React Query 캐싱 최적화**
   - 캐싱 전략 구현 (`src/lib/react-query-config.ts`)
     - STATIC: 24시간 stale, 7일 GC (이벤트 정보 등)
     - DYNAMIC: 5분 stale, 30분 GC (리뷰, 댓글 등)
     - REALTIME: 0 stale, 5분 GC (알림, 채팅 등)
     - USER: 10분 stale, 1시간 GC (프로필, 설정 등)
   - 쿼리 키 팩토리 패턴 도입
   - 프리페칭 유틸리티 구현 (`src/lib/prefetch-utils.ts`)
   - React Query DevTools 추가 (개발 환경)

2. **번들 사이즈 최적화**
   - Webpack 코드 스플리팅 설정
     - React, UI, Forms, Utils 등 청크 분리
     - 공통 모듈 별도 청크 관리
   - Tree shaking 최적화
     - optimizePackageImports 설정 확대
     - SWC minifier 활용
   - 동적 import 시스템 구축
     - `src/lib/dynamic-imports.ts` 헬퍼 함수
     - 홈페이지 컴포넌트 lazy loading 적용
   - 번들 분석기 추가 (`bun run analyze`)

3. **Cloudflare Images 최적화**
   - 이미지 변형(variants) 시스템 구현
     - thumbnail (150x150), card (400x300), avatar (200x200)
     - gallery (800x600), hero (1920x1080), public (1600x1600)
   - CloudflareImage 컴포넌트 개발
     - 반응형 이미지 로딩
     - srcset 자동 생성
     - 로딩 우선순위 최적화 (LCP 고려)
   - 이미지 유틸리티 함수 구현
   - 주요 컴포넌트 적용 완료
     - EventsListPage, DiaryCard, MediaGallery

4. **무한 스크롤 가상화**
   - @tanstack/react-virtual 라이브러리 통합
   - VirtualizedList 컴포넌트 구현
     - 동적 아이템 높이 지원
     - overscan 최적화
   - VirtualizedGrid 반응형 그리드 지원
   - DiaryFeed 가상화 적용
     - 600px 예상 높이, overscan 2
     - 한 번에 20개 아이템 로드

### 성능 개선 효과
- API 응답 캐싱으로 네트워크 요청 감소
- 초기 번들 사이즈 감소 (코드 스플리팅)
- 이미지 로딩 속도 향상 (Cloudflare 리사이징)
- 대량 리스트 렌더링 성능 개선 (가상화)

## 2025-01-18 - Bun 패키지 매니저로 전환

### 전환 이유
- npm의 느린 설치 속도와 deprecation warning 문제
- Bun의 뛰어난 성능과 개발자 경험
- TypeScript, JSX 내장 지원으로 빠른 개발

### 변경 사항
- 모든 `npm` 명령어를 `bun`으로 변경
- `package-lock.json` → `bun.lockb` (바이너리 락파일)
- 더 빠른 의존성 설치 및 스크립트 실행

## 2025-01-18 - 런타임 에러 완전 해결 ✅

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

## 2025-01-18 - 코드 품질 개선 및 빌드 오류 수정

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

## 2025-01-18 - Sentry 에러 모니터링 구현 ✅

### 작업 내용

1. **Sentry 설정 파일 생성**
   - `sentry.client.config.ts`: 클라이언트 측 에러 추적
   - `sentry.server.config.ts`: 서버 측 에러 추적
   - `sentry.edge.config.ts`: Edge 런타임 에러 추적
   - 환경별 샘플링 비율 설정 (프로덕션 10%, 개발 100%)
   - 민감한 정보 자동 필터링 (쿠키, 이메일 등)

2. **사용자 컨텍스트 추적**
   - `SentryUserContext` 컴포넌트 구현
   - Clerk 인증 정보와 Sentry 연동
   - 사용자 ID 자동 추적 (이메일 제외)

3. **ErrorBoundary 강화**
   - Sentry 에러 보고 통합
   - 컴포넌트 스택 추적
   - 사용자 피드백 다이얼로그 지원
   - 한글 UI 메시지

4. **커스텀 에러 유틸리티**
   - `sentry-utils.ts` 헬퍼 함수 모음
   - API 에러, 폼 에러, 미디어 에러, 성능 이슈 전용 함수
   - 민감한 정보 자동 제거 (password, token, secret)
   - 브레드크럼 추가 헬퍼

5. **tRPC 에러 통합**
   - 서버 에러 자동 보고 (INTERNAL_SERVER_ERROR)
   - 요청 컨텍스트 추가 (path, type, input)
   - 사용자 정보 연결

6. **고급 기능 설정**
   - Session Replay (프로덕션 10% 샘플링)
   - 성능 모니터링 (프로덕션 10% 샘플링)
   - 네트워크 요청 추적
   - 브라우저 추적 통합

7. **환경 변수 설정**
   - `.env.example` 업데이트
   - Sentry DSN, 조직, 프로젝트, 토큰 설정

### 성과
- ✅ 포괄적인 에러 모니터링 시스템 구축
- ✅ 자동 에러 수집 및 사용자 컨텍스트 추적
- ✅ 성능 문제 감지 및 세션 리플레이
- ✅ 민감한 정보 보호 및 필터링

## 2025-01-17 ~ 2025-01-17 - 순간 기능 구현 & 모바일 최적화

### 순간 (음악 일기) 기능 - 완성 ✅

1. **핵심 기능**
   - 일정 참여 일기 작성 (사진, 동영상 포함)
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

2. **기록 자동 저장 기능**
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
   - 일정 목록, 상세페이지 공개
   - 기록 목록, 상세페이지 공개
   - 로그인 상태에 따른 조건부 UI (기록 작성, 북마크 등)

5. **카테고리 한글화 통일** (오전 작업)
   - 전체 앱에서 카테고리 한글 표시 통일
   - `categoryLabels` 매핑 추가 (festival→페스티벌, concert→콘서트 등)
   - 홈페이지, 일정 목록, 캘린더, 관리자 페이지 적용
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

### 2025-01-17 - Neon DB 마이그레이션 & 안정화

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

### 2025-01-16 - MVP 완성 & Vercel 배포 🎉

#### 구현 완료된 기능
1. **사용자 인증** (Clerk)
   - 소셜 로그인 (Google, Kakao)
   - 프로필 관리

2. **일정 관리**
   - 일정 목록/상세 보기
   - 카테고리별 필터링
   - 관리자 CRUD

3. **기록 시스템**
   - 다면 평가 (종합/음향/시야/안전/운영)
   - 이미지 업로드 (Cloudinary)
   - 좋아요/북마크
   - 베스트 기록 선정

4. **커뮤니티 기능**
   - 댓글 시스템
   - 팔로우/팔로잉
   - 알림 시스템

5. **검색 기능**
   - 통합 검색 (일정/기록/사용자/순간)
   - 실시간 검색 결과

---

## 📋 주요 문제 해결 가이드

### 미디어 표시 문제 체크리스트
1. **환경 변수 확인**: `.env.local`에 `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH` 설정 여부
2. **데이터 구조 확인**: API 응답의 media 필드가 `{url, type}` 형식인지 확인
3. **컴포넌트 선택**: MediaGallery 사용 (DiaryMediaViewer 대신)
4. **브라우저 콘솔**: 디버깅 로그 확인으로 데이터 변환 과정 추적

### 모달 레이아웃 문제 해결
1. **Modal wrapper**: flex 클래스 제거, 높이는 `h-full max-h-[90vh]`
2. **이미지 영역**: 모바일 `h-[60vh]`, 데스크톱 `h-full`
3. **콘텐츠 영역**: 고정 높이 제거, flex로 자동 조절

## 🎯 다음 진행 가능한 작업들

### 우선순위 높음 ⭐⭐⭐

1. **성능 최적화** ✅ (2025-01-18 완료)
   - [x] React Query 설정 최적화로 API 응답 캐싱 개선
   - [x] 번들 사이즈 최적화 (코드 스플리팅, tree shaking)
   - [x] Cloudflare Images 리사이징 API 활용한 이미지 최적화
   - [x] 무한 스크롤에 가상화(virtualization) 적용

2. **테스트 구축**
   - [ ] E2E 테스트 - Playwright 설정 및 핵심 시나리오 테스트 구현
   - [ ] 단위 테스트 - 중요 컴포넌트와 훅 테스트 작성
   - [ ] 통합 테스트 - API 라우트 테스트 구현

3. **모니터링 구축** ✅ (2025-01-18 완료)
   - [x] Sentry 재설정 - 에러 모니터링 활성화
   - [x] Analytics 설정 - Google Analytics 4 및 Vercel Analytics 통합
   - [x] Web Vitals 측정 - GA4와 Sentry를 통한 성능 모니터링

### 중간 우선순위 ⭐⭐

4. **UX 개선**
   - [ ] 온보딩 플로우 - 신규 사용자 가이드 (관심 장르/아티스트 선택)
   - [ ] 고급 검색 필터 - 날짜, 지역, 가격대별 필터
   - [ ] 리뷰 템플릿 - 카테고리별 맞춤형 리뷰 양식
   - [ ] 소셜 공유 - 리뷰/다이어리 SNS 공유 기능
   - [ ] 모바일 UX 추가 개선
     - [ ] Pull to refresh - 리스트 페이지 새로고침
     - [ ] 플로팅 액션 버튼 개선 - 스크롤 시 숨김/표시
     - [ ] 터치 피드백 강화 - 버튼/카드 터치 애니메이션
   - [ ] 알림 설정 페이지 - 알림 유형별 on/off, 시간대 설정

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
- **State**: TanStack Query v5 (with DevTools), Zustand
- **Backend**: tRPC v11, Drizzle ORM
- **Database**: Neon (PostgreSQL)
- **Auth**: Clerk
- **Media**: Cloudinary (이미지), Cloudflare Images (최적화), Cloudflare Stream (동영상)
- **Performance**: @tanstack/react-virtual (가상화), @next/bundle-analyzer
- **Analytics**: Google Analytics 4, Vercel Analytics, Vercel Speed Insights
- **Package Manager**: Bun
- **Deployment**: Vercel
- **Monitoring**: Sentry (에러 추적), Web Vitals (성능 모니터링)

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