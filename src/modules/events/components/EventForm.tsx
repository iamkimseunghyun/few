"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/trpc";
import { ImageUpload } from "@/modules/shared/upload/components/ImageUpload";

const eventSchema = z.object({
  name: z.string().min(1, "이벤트명을 입력해주세요"),
  category: z.enum(["페스티벌", "콘서트", "내한공연", "공연", "전시"]),
  location: z.string().min(1, "장소를 입력해주세요"),
  startDate: z.string().min(1, "시작일을 선택해주세요"),
  endDate: z.string().min(1, "종료일을 선택해주세요"),
  description: z.string().optional(),
  lineup: z.string().optional(), // 라인업 (콤마로 구분)
  posterUrl: z.string().optional(),
  ticketPriceRange: z.string().optional(),
  capacity: z.number().optional(),
  organizer: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: {
    id: string;
    name: string;
    category: string;
    location?: string;
    dates?: { start: string; end: string };
    description?: string;
    lineup?: string[];
    posterUrl?: string;
    ticketPriceRange?: string;
    capacity?: number;
    organizer?: string;
    website?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          name: event.name,
          category: event.category as "페스티벌" | "콘서트" | "내한공연" | "공연" | "전시",
          location: event.location,
          startDate: event.dates?.start ? event.dates.start.split('T')[0] : "",
          endDate: event.dates?.end ? event.dates.end.split('T')[0] : "",
          description: event.description || "",
          lineup: event.lineup?.join(', ') || "",
          posterUrl: event.posterUrl || "",
          ticketPriceRange: event.ticketPriceRange || "",
          capacity: event.capacity || undefined,
          organizer: event.organizer || "",
          website: event.website || "",
        }
      : {
          category: "페스티벌" as const,
        },
  });

  const createEvent = api.events.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const updateEvent = api.events.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      const eventData = {
        ...data,
        dates: {
          start: new Date(data.startDate + 'T00:00:00Z').toISOString(),
          end: new Date(data.endDate + 'T23:59:59Z').toISOString(),
        },
        lineup: data.lineup ? data.lineup.split(',').map(item => item.trim()).filter(Boolean) : undefined,
        website: data.website || undefined,
      };

      if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          data: eventData,
        });
      } else {
        await createEvent.mutateAsync(eventData);
      }
    } catch (error) {
      console.error("이벤트 저장 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          이벤트명 <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
          placeholder="예: 서울재즈페스티벌 2024"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          {...register("category")}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
        >
          <option value="페스티벌">페스티벌</option>
          <option value="콘서트">콘서트</option>
          <option value="내한공연">내한공연</option>
          <option value="공연">공연</option>
          <option value="전시">전시</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          장소 <span className="text-red-500">*</span>
        </label>
        <input
          {...register("location")}
          type="text"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
          placeholder="예: 올림픽공원"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            시작일 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("startDate")}
            type="date"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            종료일 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("endDate")}
            type="date"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          라인업 / 출연진
        </label>
        <input
          {...register("lineup")}
          type="text"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
          placeholder="출연진을 콤마로 구분하여 입력 (예: 아이유, 박효신, 이하이)"
        />
        <p className="mt-1 text-xs text-gray-500">
          여러 아티스트는 콤마(,)로 구분해주세요
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          설명
        </label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
          placeholder="이벤트에 대한 설명을 입력하세요"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          포스터 이미지
        </label>
        <ImageUpload
          value={watch("posterUrl") ? [watch("posterUrl") as string] : []}
          onChange={(urls) => setValue("posterUrl", urls[0] || "")}
          maxImages={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            티켓 가격대
          </label>
          <input
            {...register("ticketPriceRange")}
            type="text"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
            placeholder="예: 50,000원 ~ 150,000원"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            수용 인원
          </label>
          <input
            {...register("capacity", { valueAsNumber: true })}
            type="number"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
            placeholder="예: 5000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            주최자
          </label>
          <input
            {...register("organizer")}
            type="text"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
            placeholder="예: (주)페스티벌코리아"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            웹사이트
          </label>
          <input
            {...register("website")}
            type="url"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
            placeholder="https://example.com"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-gray-900 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isSubmitting ? "저장 중..." : event ? "수정하기" : "추가하기"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}