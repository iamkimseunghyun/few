'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number; // Default: 10
  className?: string;
}

export function MediaUpload({
  value = [],
  onChange,
  maxItems = 10,
  className,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxItems) {
      alert(`최대 ${maxItems}개까지만 업로드할 수 있습니다.`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('업로드에 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.successful) {
        const newItems: MediaItem[] = data.successful.map((item: {
          url: string;
          type: 'image' | 'video';
          thumbnailUrl?: string;
          duration?: number;
        }) => ({
          url: item.url,
          type: item.type,
          thumbnailUrl: item.thumbnailUrl,
          duration: item.duration,
        }));
        
        onChange([...value, ...newItems]);
      }

      if (data.failed?.length > 0) {
        alert(`일부 파일 업로드 실패: ${data.failed.map((f: { name: string }) => f.name).join(', ')}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newItems = [...value];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-3 gap-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
          >
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt=""
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  poster={item.thumbnailUrl}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Film className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {value.length < maxItems && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {value.length}/{maxItems}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground">
        • 이미지와 동영상을 최대 {maxItems}개까지 업로드할 수 있습니다
        <br />
        • 이미지: JPG, PNG, GIF (최대 10MB)
        <br />
        • 동영상: MP4, MOV (최대 100MB)
      </div>
    </div>
  );
}