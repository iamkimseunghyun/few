'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useImageUpload } from '@/modules/shared';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 3,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + value.length > maxImages) {
      setLocalError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    setLocalError(null);

    try {
      const uploadPromises = files.map((file) => upload(file));
      const newUrls = await Promise.all(uploadPromises);
      onChange([...value, ...newUrls]);
    } catch (error) {
      console.error('Upload error:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
    setLocalError(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {value.map((url, index) => (
          <div key={url} className="group relative aspect-square">
            <Image
              src={url}
              alt={`Upload ${index + 1}`}
              fill
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
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

        {value.length < maxImages && (
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
              <div className="flex h-full flex-col items-center justify-center">
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
                <span className="text-sm text-gray-600">사진 추가</span>
              </div>
            )}
          </button>
        )}
      </div>

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
