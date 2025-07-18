'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from '@/modules/shared/hooks/useToast';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number;
}

// API 응답 타입 정의
interface UploadResponse {
  successful?: Array<{
    url: string;
    type: 'image' | 'video';
    name: string;
    size: number;
    thumbnailUrl?: string;
    duration?: number;
    videoId?: string;
    readyToStream?: boolean;
    mimeType?: string;
  }>;
  failed?: Array<{
    name: string;
    error: string;
  }>;
  message?: string;
}

// 지원하는 파일 형식
const SUPPORTED_FORMATS = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    display: 'JPEG, PNG, GIF, WebP',
  },
  video: {
    extensions: ['.mp4', '.mov', '.avi', '.webm'],
    mimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ],
    display: 'MP4, MOV, AVI, WebM',
  },
};

export function MediaUpload({
  value,
  onChange,
  maxItems = 10,
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; invalid: { file: File; reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File; reason: string }[] = [];

    files.forEach((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

      // 지원하는 형식 확인
      const isImage =
        SUPPORTED_FORMATS.image.extensions.includes(extension) ||
        SUPPORTED_FORMATS.image.mimeTypes.includes(file.type);
      const isVideo =
        SUPPORTED_FORMATS.video.extensions.includes(extension) ||
        SUPPORTED_FORMATS.video.mimeTypes.includes(file.type);

      if (!isImage && !isVideo) {
        // 특별한 안내가 필요한 형식들
        if (['.avif', '.heic', '.heif'].includes(extension)) {
          invalid.push({
            file,
            reason: `${file.name}: 이 형식은 아직 지원하지 않습니다. JPEG나 PNG로 변환 후 업로드해주세요.`,
          });
        } else {
          invalid.push({
            file,
            reason: `${file.name}: 지원하지 않는 형식입니다.`,
          });
        }
        return;
      }

      // 파일 크기 확인
      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB / 100MB
      if (file.size > maxSize) {
        invalid.push({
          file,
          reason: `${file.name}: 파일 크기가 너무 큽니다. (최대 ${isImage ? '10MB' : '100MB'})`,
        });
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + value.length > maxItems) {
      toast.error(`최대 ${maxItems}개의 파일만 업로드할 수 있습니다.`);
      return;
    }

    // 파일 검증
    const { valid, invalid } = validateFiles(files);

    // 지원하지 않는 파일 알림
    if (invalid.length > 0) {
      invalid.forEach(({ reason }) => {
        toast.error(reason, {
          description:
            '지원 형식: 이미지(JPEG, PNG, GIF, WebP), 동영상(MP4, MOV, AVI, WebM)',
        });
      });

      if (valid.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      valid.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: UploadResponse = await response.json();

      if (result.successful && result.successful.length > 0) {
        const newItems: MediaItem[] = result.successful.map((item) => ({
          url: item.url,
          type: item.type,
          thumbnailUrl: item.thumbnailUrl,
          duration: item.duration,
        }));

        onChange([...value, ...newItems]);

        toast.success(`${result.successful.length}개 파일 업로드 완료`);
      }

      if (result.failed && result.failed.length > 0) {
        result.failed.forEach((fail) => {
          toast.error(`${fail.name} 업로드 실패: ${fail.error}`);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="group relative aspect-square"
          >
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={`Upload ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="relative h-full w-full">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={`Video ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg bg-gray-100">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {/* 비디오 재생 아이콘 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/50 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                {item.duration && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {Math.floor(item.duration / 60)}:
                    {(item.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}

        {value.length < maxItems && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-4">
                <svg
                  className="mb-2 h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm text-gray-600">파일 추가</span>
                <span className="mt-1 text-xs text-gray-500">
                  {value.length}/{maxItems}
                </span>
              </div>
            )}
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• 이미지: JPEG, PNG, GIF, WebP (최대 10MB)</p>
        <p>• 동영상: MP4, MOV, AVI, WebM (최대 100MB)</p>
        <p className="text-orange-600">
          • AVIF, HEIC 파일은 JPEG/PNG로 변환 후 업로드해주세요
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={[
          ...SUPPORTED_FORMATS.image.mimeTypes,
          ...SUPPORTED_FORMATS.video.mimeTypes,
        ].join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
