# 제품 요구사항 정의서 (PRD): few

- **버전:** 3.0 (통합본)
- **최종 수정일:** 2025년 1월 20일
- **상태:** 최종 확정 (Final Blueprint)
- **프로덕션 URL:** https://few-theta.vercel.app/
- **프로젝트 오너:** (사용자 이름)
- **프로덕트 파트너:** Claude

---

## 1. 개요 (Overview)

### 1.1. 제품명

**few**
_(festival + view의 조합어로, '우리의 음악 라이프를 공유하고 연결하는 공간'이라는 의미)_

### 1.2. 비전 및 목표 (Vision & Goals)

**"음악 캘린더라는 강력한 유틸리티를 중심으로, 음악 팬들의 경험이 연결되고 아카이빙되는 버티컬 소셜 네트워크"**

음악을 사랑하는 사람들이 공연과 페스티벌 경험을 기록하고, 공유하며, 비슷한 취향의 사람들과 연결되는 **음악 액티비티 공유 플랫폼**을 구축한다.

### 1.3. 제품 포지셔닝 (Product Positioning)

**"캘린더(유틸리티) + 피드(소셜)"**

음악 팬의 스케줄 관리를 돕는 필수 도구이자, 소중한 음악적 기억들이 차곡차곡 쌓이는 **'소셜 뮤직 저널'**.

- 음악 공연/페스티벌에 특화된 경험 공유 플랫폼
- 시각적 콘텐츠와 스토리텔링을 통한 추억 아카이빙
- 음악 취향 기반 커뮤니티 형성

### 1.4. 문제 정의 (Problem Statement)

- **음악 팬:** 공연의 순간을 기록하고 싶지만, 일반 SNS에서는 음악 중심의 깊이 있는 소통이 어렵다. 비슷한 취향의 사람들과 연결되고 싶지만 적절한 플랫폼이 없다.
- **공연 참가자:** 단순 리뷰를 넘어 공연의 감동과 현장감을 생생하게 기록하고 공유할 공간이 필요하다.
- **커뮤니티:** 음악 취향을 중심으로 자연스럽게 형성되는 커뮤니티와 동행 문화가 필요하다.

### 1.5. 핵심 메뉴 구조

1. **공연 (Events):** 정보 탐색 및 스케줄 관리 **(Utility)**
2. **순간 (Moments):** 경험 공유 및 소셜 네트워킹 **(Social)**

---

## 2. 사용자 정의 (User Definition)

### 2.1. 핵심 페르소나 (Core Personas)

1. **이서연 (26세, 음악 덕후 & 콘텐츠 크리에이터)**
   - 매달 2-3개의 공연을 다니며 인스타그램에 공연 사진을 올리는 헤비 유저
   - 공연의 순간을 아름답게 기록하고 싶어하며, 같은 아티스트를 좋아하는 팬들과 소통하고 싶음
   - "내 음악 일기를 예쁘게 정리하고, 같은 취향의 사람들과 공유하고 싶어요"

2. **김민준 (29세, 직장인 & 페스티벌 러버)**
   - 연차를 내고 국내외 페스티벌을 다니는 것이 취미
   - 페스티벌 라인업, 타임테이블, 캠핑 정보 등을 체계적으로 정리하길 원함
   - "페스티벌 동행을 구하고, 현장에서 만난 사람들과 연결되고 싶어요"

3. **최지우 (22세, 대학생 & K-POP 팬)**
   - 좋아하는 아티스트의 모든 공연을 기록하고 싶어하는 열정적인 팬
   - 콘서트 굿즈, 티켓, 셋리스트 등을 수집하고 자랑하고 싶음
   - "내가 다녀온 모든 콘서트를 한 곳에 모아서 나만의 콘서트 다이어리를 만들고 싶어요"

---

## 3. 제품 요구사항 - 리빌딩 핵심 (Core Requirements for Rebuild)

### 3.1. Phase 1: MVP 리빌딩 (현재 → 3개월)

| 기능 ID   | 메뉴  | 기능명                  | 사용자 스토리                                                     | 핵심 요구사항                                                                                                              |
| :-------- | :---- | :--------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **P1-01** | 공연  | **통합 공연 캘린더**    | "흩어진 공연 정보를 한 곳에서 보고, 내 스케줄을 관리하고 싶다."    | - 캘린더 뷰 / 리스트 뷰 전환<br>- 필터링 (장르, 지역, 기간)<br>- '가고 싶어요' 북마크<br>- 상세 정보 페이지                   |
| **P1-02** | 순간  | **뮤직 피드**          | "내 음악 경험을 자랑하고, 비슷한 취향의 사람들과 소통하고 싶다."   | - 이미지/텍스트 중심 피드 UI<br>- 팔로우 기반 피드 / 인기(탐색) 피드<br>- 소셜 인터랙션 (좋아요, 댓글)                       |
| **P1-03** | 순간  | **'순간' 포스팅**      | "공연의 감동을 생생하게 기록하고 싶다."                           | - 사진/영상 첨부 (최대 10장)<br>- **공연 정보 태그** 기능<br>- 내용, 해시태그 입력<br>- 감정/분위기 태그 추가               |
| **P1-04** | 통합  | **'정보' 뱃지 시스템**  | "단순 감상 외에, 다른 사람에게 도움이 될 정보를 남기고 싶다."     | - '순간' 작성 시 **'정보성 글' 뱃지** 추가 기능 (선택적)<br>- (선택사항) 별점(음향/시야) 입력 UI 제공                        |
| **P1-05** | 통합  | **공연 연계 콘텐츠**    | "특정 공연에 대한 모든 경험을 한 번에 모아보고 싶다."             | - 공연 상세 페이지 내에, 해당 공연이 태그된 **모든 '순간'들을 모아 보여주는 탭** 제공                                         |
| **P1-06** | 공통  | **통합 프로필**        | "나의 모든 음악 활동을 한 곳에서 관리하고 싶다."                  | - 내가 작성한 '순간' 목록<br>- 내가 북마크한 '공연' 목록<br>- 팔로우/팔로워 관리<br>- 음악 취향 배지 시스템<br>- 공연 통계   |

### 3.2. 의도적으로 제외하는 기능 (Out of Scope for this Rebuild)

- **익명 리뷰 시스템**
- **복잡한 동행 찾기 및 실시간 채팅**
- **굿즈/티켓 아카이빙 및 상세한 커스터마이징 기능**
- **미래 로드맵의 모든 기능 (Phase 2, 3):** 핵심 기능 안정화 이후 재논의

---

## 4. 기술 실행 계획 (Technical Action Plan)

### 4.1. 기술 스택

- **프론트엔드:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **백엔드:** Supabase (Auth, Database, Storage)
- **상태 관리:** Zustand
- **UI 컴포넌트:** shadcn/ui
- **이미지 처리:** Sharp (Next.js 이미지 최적화)
- **실시간 기능:** Supabase Realtime (향후 확장 시)
- **검색:** Supabase Full-text Search (향후 Algolia 고려)
- **분석:** Posthog 또는 Mixpanel

### 4.2. DB 스키마 개편 전략

**안정성을 최우선으로, 기존 스키마에 영향을 주지 않는 신규 스키마 생성을 통한 점진적 전환 방식을 채택한다.**

1. **기존 스키마 보존:** 리빌딩 단계에서 현재 프로덕션에서 사용 중인 reviews, music_diaries 및 모든 관련 스키마는 **절대 수정하거나 삭제하지 않는다.**

2. **신규 스키마 생성:** 새로운 기획에 맞춰 다음 테이블들을 새로 생성:
   - **moments:** 순간 포스팅 메인 테이블
   - **moment_likes:** 좋아요 관계
   - **moment_comments:** 댓글
   - **moment_bookmarks:** 저장/북마크
   - **user_preferences:** 음악 취향, 선호 장르, 아티스트
   - **follows:** 사용자 간 팔로우 관계

3. **신규 개발 초점:** 모든 리빌딩 관련 기능 개발은 **오직 새로 생성된 moments 스키마만을 사용**

4. **데이터 마이그레이션:** 기존 데이터 이전은 리빌딩 배포 및 안정화 이후 별도 과제로 진행

### 4.3. 폴더 구조 (src/modules)

1. **기존 모듈 보존:** reviews, music-diary 모듈은 그대로 유지 (리빌딩 중 참고용)
2. **신규 모듈 생성:** moments 모듈(src/modules/moments) 새로 생성
3. **핵심 모듈 리팩토링:** events, home, profile 등이 새로운 moments 모듈과 상호작용하도록 리팩토링

---

## 5. 향후 로드맵 (Future Roadmap)

### 5.1. Phase 2: 커뮤니티 활성화 (3-6개월)

- **음악 취향 매칭:** 음악 취향 분석 알고리즘, 취향 호환도 표시
- **공연 동행 찾기:** 공연별 동행 게시판, 프로필 기반 매칭
- **뮤직 스토리:** 24시간 스토리 기능, 공연장 체크인
- **아티스트 팬 공간:** 아티스트별 커뮤니티, 팬 아트/영상 공유

### 5.2. Phase 3: 플랫폼 확장 (6개월+)

- **티켓 & 굿즈 아카이빙:** 티켓 스캔/촬영, 굿즈 갤러리
- **플레이리스트 연동:** Spotify/Apple Music 연동
- **페스티벌 캠핑:** 캠핑 메이트 매칭, 캠핑 정보 공유
- **AR 경험:** 공연장 AR 체크인, 아티스트 AR 필터

---

## 6. 비즈니스 모델 (Business Model)

### 6.1. 수익화 전략

1. **프리미엄 구독** (Phase 2)
   - 무제한 사진 업로드
   - 고급 필터 & 편집 기능
   - 우선 매칭 & 동행 찾기
   - 광고 제거

2. **아티스트/기획사 파트너십** (Phase 3)
   - 공식 팬 공간 운영
   - 독점 콘텐츠 제공
   - 팬 데이터 인사이트

3. **커머스** (Phase 3+)
   - 공연 티켓 연동
   - 굿즈 마켓플레이스
   - 중고 티켓/굿즈 거래

---

## 7. 성공 지표 (Success Metrics)

### 7.1. Phase 1 목표 (3개월)

- **콘텐츠:** 월간 업로드 사진 수 5,000장
- **참여율:** 일간 활성 사용자(DAU) 500명
- **리텐션:** 월간 재방문율 40%

### 7.2. Phase 2 목표 (6개월)

- **커뮤니티:** 월간 동행 매칭 100건
- **소셜:** 사용자당 평균 팔로워 수 10명
- **성장:** 월간 활성 사용자(MAU) 5,000명

### 7.3. Phase 3 목표 (12개월)

- **수익화:** 프리미엄 구독자 500명
- **파트너십:** 공식 아티스트 파트너 20팀
- **규모:** 월간 활성 사용자(MAU) 20,000명

---

_"few는 음악 팬들의 필수 유틸리티이자, 음악을 사랑하는 사람들의 라이프스타일을 담는 소셜 공간으로 진화합니다."_