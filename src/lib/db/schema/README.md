# Database Schema Structure

이 디렉토리는 모듈식으로 구성된 데이터베이스 스키마를 포함합니다.

## 구조

```
schema/
├── shared/
│   └── enums.ts        # 공유 enum 정의 (EventCategory, MediaType 등)
├── users.ts            # 사용자 관련 테이블
├── events.ts           # 이벤트 관련 테이블 (events, eventBookmarks)
├── reviews.ts          # 리뷰 관련 테이블 (reviews, reviewLikes, reviewBookmarks, reviewReports, reviewHelpful)
├── comments.ts         # 댓글 시스템
├── notifications.ts    # 알림 시스템
├── music-diary.ts      # 음악 다이어리 관련 테이블
├── follows.ts          # 팔로우 시스템
└── index.ts           # 모든 스키마를 재내보내는 중앙 파일
```

## 사용법

### 개별 모듈에서 import
```typescript
// 특정 모듈만 import
import { users } from '@/lib/db/schema/users';
import { events, eventBookmarks } from '@/lib/db/schema/events';
```

### 중앙 파일에서 import
```typescript
// 모든 스키마 import
import { users, events, reviews } from '@/lib/db/schema';
```

## 모듈별 설명

### shared/enums.ts
- `eventCategoryEnum`: 이벤트 카테고리 enum
- `EventCategory`: TypeScript 타입
- `categoryLabels`: 카테고리 라벨 매핑
- `mediaTypeEnum`: 미디어 타입 enum

### users.ts
- `users`: 사용자 정보 테이블

### events.ts
- `events`: 이벤트 정보 테이블
- `eventBookmarks`: 이벤트 북마크 테이블

### reviews.ts
- `reviews`: 리뷰 테이블
- `reviewLikes`: 리뷰 좋아요
- `reviewBookmarks`: 리뷰 북마크
- `reviewReports`: 리뷰 신고
- `reviewHelpful`: 리뷰 도움됨 투표

### comments.ts
- `comments`: 댓글 테이블 (대댓글 지원)

### notifications.ts
- `notifications`: 알림 테이블

### music-diary.ts
- `musicDiaries`: 음악 다이어리 엔트리
- `diaryLikes`: 다이어리 좋아요
- `diaryComments`: 다이어리 댓글
- `diarySaves`: 다이어리 저장
- `mediaQueue`: 미디어 처리 큐

### follows.ts
- `follows`: 팔로우 관계 테이블

## 장점
1. **모듈화**: 각 도메인별로 스키마가 분리되어 관리가 용이
2. **재사용성**: 필요한 모듈만 선택적으로 import 가능
3. **유지보수성**: 각 파일이 작아져 수정이 쉬움
4. **타입 안정성**: 각 모듈에서 타입을 export하여 TypeScript 지원 강화