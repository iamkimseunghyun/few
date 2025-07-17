import { useLocalStorage } from '@/modules/shared/hooks/useLocalStorage';
import { useCallback } from 'react';

interface ReviewDraft {
  title: string;
  eventId?: string;
  eventName?: string;
  overallRating: number;
  soundRating?: number;
  viewRating?: number;
  safetyRating?: number;
  operationRating?: number;
  seatOrArea?: string;
  content: string;
  tags?: string;
  imageUrls?: string[];
  lastSavedAt?: string;
}

const DRAFT_KEY = 'review-draft';
const AUTO_SAVE_DELAY = 3000; // 3초

export function useReviewDraft(reviewId?: string) {
  // reviewId가 있으면 수정 모드이므로 임시저장 사용하지 않음
  const storageKey = reviewId ? `${DRAFT_KEY}-edit-${reviewId}` : DRAFT_KEY;

  const [draft, setDraft, removeDraft] = useLocalStorage<ReviewDraft | null>(
    storageKey,
    null
  );

  // 자동 저장 함수
  const saveDraft = useCallback(
    (data: Partial<ReviewDraft>) => {
      setDraft(
        (prev) =>
          ({
            ...prev,
            ...data,
            lastSavedAt: new Date().toISOString(),
          }) as ReviewDraft
      );
    },
    [setDraft]
  );

  // 타이머를 이용한 자동 저장 (디바운스)
  const autoSaveDraft = useCallback(
    (data: Partial<ReviewDraft>) => {
      const timeoutId = setTimeout(() => {
        saveDraft(data);
      }, AUTO_SAVE_DELAY);

      return () => clearTimeout(timeoutId);
    },
    [saveDraft]
  );

  // 임시저장 데이터가 있는지 확인
  const hasDraft = draft !== null && draft.lastSavedAt !== undefined;

  // 임시저장 시간 포맷팅
  const getLastSavedText = () => {
    if (!draft?.lastSavedAt) return null;

    const lastSaved = new Date(draft.lastSavedAt);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSaved.getTime()) / 60000
    );

    if (diffInMinutes < 1) return '방금 전 저장됨';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전 저장됨`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전 저장됨`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전 저장됨`;
  };

  return {
    draft,
    saveDraft,
    autoSaveDraft,
    removeDraft,
    hasDraft,
    lastSavedText: getLastSavedText(),
  };
}
