'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc-client';
import { Button } from '@/modules/shared/ui/components/Button';
import { Input } from '@/modules/shared/ui/components/Input';
import { Textarea } from '@/modules/shared/ui/components/Textarea';
import Image from 'next/image';
import {
  MapPinIcon,
  MusicalNoteIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { musicDiaries } from '@/lib/db/schema';

interface EditDiaryFormProps {
  diary: typeof musicDiaries.$inferSelect;
}

export function EditDiaryForm({ diary }: EditDiaryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Form state
  const [caption, setCaption] = useState(diary.caption || '');
  const [location, setLocation] = useState(diary.location || '');
  const [artists, setArtists] = useState<string[]>(
    (diary.artists as string[]) || []
  );
  const [moments, setMoments] = useState<string[]>(
    (diary.moments as string[]) || []
  );
  const [mood, setMood] = useState(diary.mood || '');
  const [isPublic, setIsPublic] = useState(diary.isPublic);

  const { mutate: updateDiary } = api.musicDiary.update.useMutation({
    onSuccess: () => {
      router.push(`/diary/${diary.id}`);
    },
    onError: (error) => {
      console.error('Failed to update diary:', error);
      alert('다이어리 수정에 실패했습니다.');
      setIsSubmitting(false);
    },
  });

  const { mutate: deleteDiary } = api.musicDiary.delete.useMutation({
    onSuccess: () => {
      router.push('/diary');
    },
    onError: (error) => {
      console.error('Failed to delete diary:', error);
      alert('다이어리 삭제에 실패했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateDiary({
      id: diary.id,
      data: {
        caption,
        location,
        artists,
        moments,
        mood,
        isPublic,
      },
    });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        '정말로 이 다이어리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      deleteDiary({ id: diary.id });
    }
  };

  // Tag handlers
  const addTag = (type: 'artists' | 'moments', value: string) => {
    if (!value.trim()) return;

    if (type === 'artists') {
      setArtists([...artists, value.trim()]);
    } else {
      setMoments([...moments, value.trim()]);
    }
  };

  const removeTag = (type: 'artists' | 'moments', index: number) => {
    if (type === 'artists') {
      setArtists(artists.filter((_, i) => i !== index));
    } else {
      setMoments(moments.filter((_, i) => i !== index));
    }
  };

  const media = diary.media as {
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Media Preview - Read Only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          업로드된 미디어 (수정 불가)
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {media.map((item, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <span className="text-sm text-gray-600">동영상</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          * 미디어는 수정할 수 없습니다. 변경하려면 새 다이어리를 작성해주세요.
        </p>
      </div>

      {/* Caption */}
      <div>
        <label
          htmlFor="caption"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          캡션
        </label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="이 순간에 대해 들려주세요..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">위치</label>
        </div>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="예: 올림픽공원 88잔디마당"
          maxLength={100}
        />
      </div>

      {/* Artists */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MusicalNoteIcon className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">아티스트</label>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {artists.map((artist, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
            >
              {artist}
              <button
                type="button"
                onClick={() => removeTag('artists', index)}
                className="hover:text-purple-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="아티스트 추가 (Enter로 추가)"
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing) {
              e.preventDefault();
              const input = e.currentTarget;
              if (input.value.trim()) {
                addTag('artists', input.value);
                input.value = '';
              }
            }
          }}
        />
      </div>

      {/* Moments */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">
            특별한 순간
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {moments.map((moment, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
            >
              #{moment}
              <button
                type="button"
                onClick={() => removeTag('moments', index)}
                className="hover:text-pink-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="예: 앵콜무대, 떼창, 폭죽 (Enter로 추가)"
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing) {
              e.preventDefault();
              const input = e.currentTarget;
              if (input.value.trim()) {
                addTag('moments', input.value);
                input.value = '';
              }
            }
          }}
        />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          분위기
        </label>
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">선택하세요</option>
          <option value="감동적인">😭 감동적인</option>
          <option value="신나는">🎉 신나는</option>
          <option value="뭉클한">🥺 뭉클한</option>
          <option value="열정적인">🔥 열정적인</option>
          <option value="평화로운">😌 평화로운</option>
          <option value="몽환적인">✨ 몽환적인</option>
        </select>
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          id="isPublic"
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          모든 사람에게 공개
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 order-1 sm:order-2"
        >
          {isSubmitting ? '수정 중...' : '수정하기'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1 order-2 sm:order-1"
        >
          취소
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="flex-1 order-3 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          삭제
        </Button>
      </div>
    </form>
  );
}
