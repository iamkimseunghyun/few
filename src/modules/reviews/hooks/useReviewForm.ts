"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/trpc";
import { useRouter } from "next/navigation";

const reviewSchema = z.object({
  eventId: z.string().min(1, "이벤트를 선택해주세요"),
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이내로 입력해주세요"),
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

interface UseReviewFormProps {
  eventId?: string;
  onSuccess?: () => void;
}

export function useReviewForm({ eventId, onSuccess }: UseReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      eventId: eventId || "",
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

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : undefined;

      await createReview.mutateAsync({
        ...data,
        tags,
      });
    } catch (error) {
      console.error("리뷰 작성 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
  };
}