'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { XMarkIcon, PlusIcon, MusicalNoteIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/modules/shared/ui/components/Button';
import { Input } from '@/modules/shared/ui/components/Input';
import { Textarea } from '@/modules/shared/ui/components/Textarea';
import { toast } from '@/modules/shared/hooks/useToast';
import { trackEvent } from '@/lib/analytics';

const createDiarySchema = z.object({
  caption: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  eventId: z.string().optional(),
  artists: z.array(z.string()).optional(),
  setlist: z.array(z.string()).optional(),
  moments: z.array(z.string()).optional(),
  mood: z.string().optional(),
  weather: z.string().optional(),
  isPublic: z.boolean(),
});

type CreateDiaryFormData = {
  caption?: string;
  location?: string;
  eventId?: string;
  artists?: string[];
  setlist?: string[];
  moments?: string[];
  mood?: string;
  weather?: string;
  isPublic: boolean;
};

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

interface CreateDiaryFormProps {
  onSuccess?: () => void;
  defaultPrivate?: boolean;
}

export function CreateDiaryForm({ onSuccess, defaultPrivate = false }: CreateDiaryFormProps) {
  const router = useRouter();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  
  const { mutate: createDiary } = api.musicDiary.create.useMutation({
    onSuccess: (diary) => {
      toast.success('다이어리가 성공적으로 작성되었습니다!');
      // 다이어리 작성 추적
      if (diary.eventId) {
        trackEvent('create_diary', { eventId: diary.eventId });
      }
    },
    onError: (error) => {
      console.error('Create diary error:', error);
      console.error('Error shape:', error.shape);
      console.error('Error data:', error.data);
      
      // Check for Zod validation errors
      if (error.data?.zodError) {
        const zodErrors = error.data.zodError;
        console.error('Zod validation errors:', zodErrors);
        
        // Show first field error
        const firstError = Object.entries(zodErrors.fieldErrors || {})[0];
        if (firstError) {
          const [field, errors] = firstError;
          const errorMessage = Array.isArray(errors) ? errors[0] : 'Invalid value';
          toast.error(`${field}: ${errorMessage}`);
          return;
        }
      }
      
      toast.error('다이어리 작성에 실패했습니다', {
        description: error.message || '잠시 후 다시 시도해주세요.'
      });
    }
  });
  const { data: events } = api.events.search.useQuery(
    { query: eventSearchTerm },
    { enabled: eventSearchTerm.length > 2 }
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDiaryFormData>({
    resolver: zodResolver(createDiarySchema),
    defaultValues: {
      isPublic: !defaultPrivate,
      artists: [],
      setlist: [],
      moments: [],
    },
  });

  const selectedEventId = watch('eventId');
  const selectedEvent = events?.find(e => e.id === selectedEventId);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newMediaFiles = files.map(file => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: type === 'image' ? URL.createObjectURL(file) : '',
        type: type as 'image' | 'video',
      };
    });

    setMediaFiles(prev => [...prev, ...newMediaFiles].slice(0, 10)); // Max 10 files
  }, []);

  // Upload media files
  const uploadMedia = async () => {
    const uploadPromises = mediaFiles
      .filter(media => !media.uploaded && !media.error)
      .map(async (media) => {
        setMediaFiles(prev =>
          prev.map(m =>
            m.id === media.id ? { ...m, uploading: true } : m
          )
        );

        try {
          const formData = new FormData();
          formData.append('files', media.file);

          const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          console.log('Upload response for', media.file.name, ':', result);

          if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
          }

          if (!result.successful || result.successful.length === 0) {
            throw new Error('No successful uploads in response');
          }

          const uploadedFile = result.successful[0];
          
          if (!uploadedFile || !uploadedFile.url) {
            throw new Error('Invalid upload response - missing URL');
          }
          
          setMediaFiles(prev =>
            prev.map(m =>
              m.id === media.id
                ? {
                    ...m,
                    uploading: false,
                    uploaded: true,
                    url: uploadedFile.url,
                  }
                : m
            )
          );

          return uploadedFile;
        } catch (error) {
          setMediaFiles(prev =>
            prev.map(m =>
              m.id === media.id
                ? {
                    ...m,
                    uploading: false,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : m
            )
          );
          console.error('Upload error for file:', media.file.name, error);
          return null; // Return null instead of throwing
        }
      });

    const results = await Promise.all(uploadPromises);
    // Filter out null values (failed uploads)
    return results.filter(result => result !== null);
  };

  // Remove media file
  const removeMedia = (id: string) => {
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  // Handle form submission
  const onSubmit = async (data: CreateDiaryFormData) => {
    if (mediaFiles.length === 0) {
      toast.error('최소 1개 이상의 사진이나 영상을 추가해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all media files first
      const uploadedMedia = await uploadMedia();
      
      // Filter out any undefined or failed uploads
      const validUploads = uploadedMedia.filter(m => m && m.url && m.type);

      // Check if any uploads were successful
      if (validUploads.length === 0) {
        throw new Error('모든 파일 업로드에 실패했습니다.');
      }

      // 사진 업로드 추적
      if (validUploads.length > 0) {
        trackEvent('upload_diary_photo', { count: validUploads.length });
      }

      // Debug: log the data being sent
      console.log('Form data:', data);
      console.log('Valid uploads:', validUploads);
      
      const diaryData = {
        caption: data.caption || undefined,
        location: data.location || undefined,
        eventId: data.eventId || undefined,
        artists: data.artists?.length ? data.artists : undefined,
        setlist: data.setlist?.length ? data.setlist : undefined,
        moments: data.moments?.length ? data.moments : undefined,
        mood: data.mood || undefined,
        weather: data.weather || undefined,
        isPublic: data.isPublic ?? true,
        media: validUploads.map(m => ({
          url: m.url,
          type: m.type as 'image' | 'video',
          thumbnailUrl: m.thumbnailUrl || undefined,
        })),
      };
      
      console.log('Diary data being sent:', diaryData);

      // Create diary entry
      createDiary(
        diaryData,
        {
          onSuccess: (diary) => {
            if (onSuccess) {
              onSuccess();
            } else {
              // Use window.location to bypass intercepting route and go directly to the page
              window.location.href = `/diary/${diary.id}`;
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to upload media:', error);
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag input handlers
  const addTag = (type: 'artists' | 'setlist' | 'moments', value: string) => {
    if (!value.trim()) return;
    
    const current = watch(type) || [];
    setValue(type, [...current, value.trim()]);
  };

  const removeTag = (type: 'artists' | 'setlist' | 'moments', index: number) => {
    const current = watch(type) || [];
    setValue(type, current.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Media Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사진/영상 추가 (최대 10개)
        </label>
        
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {/* Media preview items */}
          {mediaFiles.map((media) => (
            <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {media.type === 'image' && media.preview && (
                <Image
                  src={media.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
              {media.type === 'video' && (
                <div className="flex items-center justify-center h-full">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              
              {/* Upload status */}
              {media.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Error state */}
              {media.error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                  <p className="text-white text-xs">{media.error}</p>
                </div>
              )}
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeMedia(media.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {/* Add media button */}
          {mediaFiles.length < 10 && (
            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex items-center justify-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <PlusIcon className="w-8 h-8 text-gray-400" />
            </label>
          )}
        </div>
      </div>

      {/* Caption */}
      <div>
        <Textarea
          {...register('caption')}
          placeholder="이 순간에 대해 이야기해주세요..."
          rows={4}
          maxLength={2000}
        />
        {errors.caption && (
          <p className="mt-1 text-sm text-red-600">{errors.caption.message}</p>
        )}
      </div>

      {/* Event Link */}
      <div>
        <button
          type="button"
          onClick={() => setShowEventSearch(!showEventSearch)}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
        >
          <MusicalNoteIcon className="w-4 h-4" />
          {selectedEvent ? selectedEvent.name : '이벤트 연결하기'}
        </button>
        
        {showEventSearch && (
          <div className="mt-2">
            <Input
              type="text"
              placeholder="이벤트 검색..."
              value={eventSearchTerm}
              onChange={(e) => setEventSearchTerm(e.target.value)}
            />
            
            {events && events.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                {events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setValue('eventId', event.id);
                      setShowEventSearch(false);
                      setEventSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <p className="font-medium">{event.name}</p>
                    {event.location && (
                      <p className="text-sm text-gray-600">{event.location}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">위치</label>
        </div>
        <Input
          {...register('location')}
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
          {(watch('artists') || []).map((artist, index) => (
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
          <label className="text-sm font-medium text-gray-700">특별한 순간</label>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {(watch('moments') || []).map((moment, index) => (
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
          {...register('mood')}
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

      {/* Weather */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          날씨
        </label>
        <select
          {...register('weather')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">선택하세요</option>
          <option value="sunny">☀️ 맑음</option>
          <option value="cloudy">☁️ 흐림</option>
          <option value="rainy">🌧️ 비</option>
          <option value="snowy">❄️ 눈</option>
          <option value="windy">💨 바람</option>
          <option value="foggy">🌫️ 안개</option>
        </select>
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('isPublic')}
          id="isPublic"
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          모든 사람에게 공개
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || mediaFiles.length === 0}
          className="flex-1"
        >
          {isSubmitting ? '업로드 중...' : '작성하기'}
        </Button>
      </div>
    </form>
  );
}