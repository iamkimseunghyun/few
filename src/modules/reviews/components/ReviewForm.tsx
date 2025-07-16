"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/modules/shared/upload/components/ImageUpload";
import { useDebounce } from "@/modules/shared/hooks/useDebounce";

const reviewSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이내로 입력해주세요"),
  eventId: z.string().optional(),
  eventName: z.string().optional(), // 자유 입력된 이벤트명
  overallRating: z.number().min(1).max(5),
  soundRating: z.number().min(1).max(5).optional(),
  viewRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  operationRating: z.number().min(1).max(5).optional(),
  seatOrArea: z.string().optional(),
  content: z.string().min(10, "최소 10자 이상 입력해주세요").max(5000, "최대 5000자까지 입력 가능합니다"),
  tags: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  eventId?: string;
  reviewId?: string; // 수정 모드인 경우
  initialData?: Partial<ReviewFormData>; // 초기 데이터
  onSuccess?: () => void;
}

export function ReviewForm({ eventId, reviewId, initialData, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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
      title: "",
      eventId: eventId || undefined,
      eventName: "",
      overallRating: 0,
      imageUrls: [],
    },
  });

  const createReview = api.reviews.create.useMutation({
    onSuccess: () => {
      onSuccess?.();
      router.refresh();
    },
  });
  
  const updateReview = api.reviews.update.useMutation({
    onSuccess: () => {
      onSuccess?.();
      router.refresh();
    },
  });

  const { data: eventSuggestions } = api.events.getAll.useQuery(
    { search: debouncedSearchTerm, limit: 5 },
    { enabled: debouncedSearchTerm.length > 0 }
  );

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
              setValue("eventId", event.id);
              setValue("eventName", event.name);
              setSearchTerm(event.name);
              setShowEventSuggestions(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
          >
            <div className="font-medium">{event.name}</div>
            {event.location && (
              <div className="text-sm text-muted-foreground">{event.location}</div>
            )}
          </button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = () => setShowEventSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // 기존 이벤트가 있으면 자동으로 설정
  useEffect(() => {
    if (existingEvent) {
      setSearchTerm(existingEvent.name);
      setValue("eventName", existingEvent.name);
    } else if (initialData?.eventName) {
      setSearchTerm(initialData.eventName);
    }
  }, [existingEvent, initialData, setValue]);

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : undefined;

      if (reviewId) {
        await updateReview.mutateAsync({
          id: reviewId,
          data: {
            ...data,
            tags,
          },
        });
      } else {
        await createReview.mutateAsync({
          ...data,
          tags,
        });
      }
    } catch (error) {
      console.error("리뷰 작성 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = (
    label: string,
    field: keyof ReviewFormData,
    required = false
  ) => {
    const value = watch(field) as number || 0;
    
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
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg border-2 text-sm sm:text-base transition-colors ${
                value >= rating
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        {errors[field as keyof typeof errors] && (
          <p className="mt-1 text-sm text-destructive">{errors[field as keyof typeof errors]?.message}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          제목 <span className="text-destructive">*</span>
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="리뷰 제목을 입력하세요"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          이벤트/공연
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowEventSuggestions(true);
              setValue("eventId", undefined);
              setValue("eventName", e.target.value);
            }}
            onFocus={() => setShowEventSuggestions(true)}
            placeholder="이벤트명을 입력하세요 (자유 입력 가능)"
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none"
          />
          {showEventSuggestions && debouncedSearchTerm.length > 0 && <EventSuggestions />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          등록된 이벤트를 선택하거나 직접 입력할 수 있습니다
        </p>
      </div>

      {renderRatingInput("전체 경험", "overallRating", true)}
      {renderRatingInput("음향", "soundRating")}
      {renderRatingInput("시야", "viewRating")}
      {renderRatingInput("안전", "safetyRating")}
      {renderRatingInput("운영", "operationRating")}

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          구역/좌석
        </label>
        <input
          {...register("seatOrArea")}
          type="text"
          placeholder="예: A구역 15열, 스탠딩 중앙"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          리뷰 내용 <span className="text-destructive">*</span>
        </label>
        <textarea
          {...register("content")}
          rows={6}
          placeholder="경험을 자세히 공유해주세요"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          태그
        </label>
        <input
          {...register("tags")}
          type="text"
          placeholder="음향좋음, 빠른입장, 화장실부족 (쉼표로 구분)"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          사진 (최대 3개)
        </label>
        <ImageUpload
          value={watch("imageUrls") || []}
          onChange={(urls) => setValue("imageUrls", urls)}
          maxImages={3}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {isSubmitting ? (reviewId ? "수정 중..." : "작성 중...") : (reviewId ? "리뷰 수정" : "리뷰 작성")}
      </button>
    </form>
  );
}
