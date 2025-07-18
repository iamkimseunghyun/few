'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { MediaUpload } from './MediaUpload';
import { useDebounce } from '@/modules/shared/hooks/useDebounce';
import { useReviewDraft } from '../hooks/useReviewDraft';
import { toast } from '@/modules/shared/hooks/useToast';

const reviewSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이내로 입력해주세요'),
  eventId: z.string().optional(),
  eventName: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  soundRating: z.number().min(1).max(5).optional(),
  viewRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  operationRating: z.number().min(1).max(5).optional(),
  seatOrArea: z.string().optional(),
  content: z
    .string()
    .min(10, '최소 10자 이상 입력해주세요')
    .max(5000, '최대 5000자까지 입력 가능합니다'),
  tags: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  mediaItems: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(['image', 'video']),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  eventId?: string;
  reviewId?: string;
  initialData?: Partial<ReviewFormData>;
  onSuccess?: () => void;
}

// 평점 필드 타입 정의
type RatingField =
  | 'overallRating'
  | 'soundRating'
  | 'viewRating'
  | 'safetyRating'
  | 'operationRating';

export function ReviewForm({
  eventId,
  reviewId,
  initialData,
  onSuccess,
}: ReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 임시저장 관련
  const { draft, autoSaveDraft, removeDraft, hasDraft, lastSavedText } =
    useReviewDraft(reviewId);

  // 기존 이벤트 정보 가져오기
  const { data: existingEvent } = api.events.getById.useQuery(
    { id: eventId! },
    { enabled: !!eventId }
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initialData || {
      title: '',
      eventId: eventId || undefined,
      eventName: '',
      overallRating: 0,
      imageUrls: [],
      mediaItems: [],
    },
  });

  const createReview = api.reviews.create.useMutation({
    onSuccess: () => {
      removeDraft();
      toast.success('리뷰가 성공적으로 작성되었습니다!');
      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error('리뷰 작성에 실패했습니다', {
        description: error.message || '잠시 후 다시 시도해주세요.',
      });
    },
  });

  const updateReview = api.reviews.update.useMutation({
    onSuccess: () => {
      removeDraft();
      toast.success('리뷰가 성공적으로 수정되었습니다!');
      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error('리뷰 수정에 실패했습니다', {
        description: error.message || '잠시 후 다시 시도해주세요.',
      });
    },
  });

  const { data: eventSuggestions } = api.events.getAll.useQuery(
    { search: debouncedSearchTerm, limit: 5 },
    { enabled: debouncedSearchTerm.length > 0 }
  );

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.event-suggestions-container')) {
        setShowEventSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 기존 이벤트 설정
  useEffect(() => {
    if (existingEvent) {
      setSearchTerm(existingEvent.name);
      setValue('eventName', existingEvent.name);
    } else if (initialData?.eventName) {
      setSearchTerm(initialData.eventName);
    }
  }, [existingEvent, initialData, setValue]);

  // 임시저장 모달 표시
  useEffect(() => {
    if (hasDraft && !reviewId && !initialData) {
      setShowDraftModal(true);
    }
  }, [hasDraft, reviewId, initialData]);

  // 폼 데이터 자동 저장
  useEffect(() => {
    if (!reviewId) {
      const subscription = watch((data) => {
        autoSaveDraft(data as Partial<ReviewFormData>);
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, autoSaveDraft, reviewId]);

  // 임시저장 데이터 복원
  const restoreDraft = () => {
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (key !== 'lastSavedAt' && value !== undefined) {
          // @ts-expect-error - draft의 동적 키 처리
          setValue(key, value);
        }
      });
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      const submitData = {
        ...data,
        tags,
      };

      if (reviewId) {
        await updateReview.mutateAsync({
          id: reviewId,
          data: submitData,
        });
      } else {
        await createReview.mutateAsync(submitData);
      }
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = (
    label: string,
    field: RatingField,
    required = false
  ) => {
    const value = watch(field) || 0;

    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        <div className="flex gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setValue(field, rating)}
              className={`h-10 w-10 sm:h-10 sm:w-10 rounded-lg border-2 text-sm sm:text-base transition-colors touch-manipulation ${
                value >= rating
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        {errors[field] && (
          <p className="mt-1 text-sm text-destructive">
            {errors[field]?.message}
          </p>
        )}
      </div>
    );
  };

  const EventSuggestions = () => {
    if (!eventSuggestions?.items || eventSuggestions.items.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-10">
          <div className="p-3 text-sm text-muted-foreground">
            등록된 이벤트가 없습니다. 직접 입력해주세요.
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
        {eventSuggestions.items.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => {
              setValue('eventId', event.id);
              setValue('eventName', event.name);
              setSearchTerm(event.name);
              setShowEventSuggestions(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
          >
            <div className="font-medium">{event.name}</div>
            {event.location && (
              <div className="text-sm text-muted-foreground">
                {event.location}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 임시저장 복원 모달 */}
      {showDraftModal && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">
              임시저장된 리뷰가 있습니다
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {lastSavedText}에 임시저장된 리뷰가 있습니다. 이어서
              작성하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={restoreDraft}
                className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground hover:bg-primary/90"
              >
                이어서 작성
              </button>
              <button
                onClick={() => {
                  removeDraft();
                  setShowDraftModal(false);
                }}
                className="flex-1 rounded-lg border border-border py-2 text-foreground hover:bg-muted"
              >
                새로 작성
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 임시저장 알림 */}
        {lastSavedText && !reviewId && (
          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
            <span>✓ {lastSavedText}</span>
            <button
              type="button"
              onClick={removeDraft}
              className="hover:text-foreground"
            >
              임시저장 삭제
            </button>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            제목 <span className="text-destructive">*</span>
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="리뷰 제목을 입력하세요"
            className="w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none touch-manipulation"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            이벤트/공연
          </label>
          <div className="relative event-suggestions-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowEventSuggestions(true);
                setValue('eventId', undefined);
                setValue('eventName', e.target.value);
              }}
              onFocus={() => setShowEventSuggestions(true)}
              placeholder="이벤트명을 입력하세요 (자유 입력 가능)"
              className="w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none touch-manipulation"
            />
            {showEventSuggestions && debouncedSearchTerm.length > 0 && (
              <EventSuggestions />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            등록된 이벤트를 선택하거나 직접 입력할 수 있습니다
          </p>
        </div>

        {renderRatingInput('전체 경험', 'overallRating', true)}
        {renderRatingInput('음향', 'soundRating')}
        {renderRatingInput('시야', 'viewRating')}
        {renderRatingInput('안전', 'safetyRating')}
        {renderRatingInput('운영', 'operationRating')}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            구역/좌석
          </label>
          <input
            {...register('seatOrArea')}
            type="text"
            placeholder="예: A구역 15열, 스탠딩 중앙"
            className="w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none touch-manipulation"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            리뷰 내용 <span className="text-destructive">*</span>
          </label>
          <textarea
            {...register('content')}
            rows={8}
            placeholder="경험을 자세히 공유해주세요"
            className="w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none touch-manipulation resize-none"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-destructive">
              {errors.content.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            태그
          </label>
          <input
            {...register('tags')}
            type="text"
            placeholder="음향좋음, 빠른입장, 화장실부족 (쉼표로 구분)"
            className="w-full rounded-lg border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none touch-manipulation"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            사진/동영상 (최대 10개)
          </label>
          <MediaUpload
            value={watch('mediaItems') || []}
            onChange={(items) => {
              setValue('mediaItems', items);
              // 호환성을 위해 imageUrls도 업데이트 (이미지만)
              const imageUrls = items
                .filter((item) => item.type === 'image')
                .map((item) => item.url);
              setValue('imageUrls', imageUrls);
            }}
            maxItems={10}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
        >
          {isSubmitting && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          )}
          {isSubmitting
            ? reviewId
              ? '수정 중...'
              : '작성 중...'
            : reviewId
              ? '리뷰 수정'
              : '리뷰 작성'}
        </button>
      </form>
    </>
  );
}
