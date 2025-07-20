'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CloudflareImage } from '@/components/CloudflareImage';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface DiaryMediaViewerProps {
  media: MediaItem;
  className?: string;
  priority?: boolean;
}

export function DiaryMediaViewer({ media, className, priority = false }: DiaryMediaViewerProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 디버깅을 위한 로그
  console.log('DiaryMediaViewer - media:', media);

  // URL이 없거나 잘못된 경우 처리
  if (!media?.url) {
    console.log('DiaryMediaViewer - No media URL');
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 text-gray-500 h-full", className)}>
        <p>이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 비디오인 경우
  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        className={cn("w-full h-full object-contain", className)}
        controls
        autoPlay
        muted
        loop
        poster={media.thumbnailUrl}
      />
    );
  }

  // Cloudflare Image ID인지 확인
  const isCloudflareImage = media.url.includes('imagedelivery.net') || !media.url.startsWith('http');
  
  // Cloudflare Image ID 추출
  const getImageId = (url: string) => {
    if (!url.startsWith('http')) return url;
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  };

  // 이미지 로딩 상태 표시는 이미지와 함께 표시되도록 제거

  // 에러 상태
  if (imageError) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 text-gray-500 h-full", className)}>
        <p>이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  // Cloudflare 이미지
  if (isCloudflareImage) {
    return (
      <div className={cn("relative w-full h-full", className)}>
        <CloudflareImage
          imageId={getImageId(media.url)}
          alt=""
          containerClassName="w-full h-full"
          className="w-full h-full object-contain"
          purpose="gallery"
          variant="public"
          priority={priority}
          onLoad={() => setIsLoading(false)}
          fallbackSrc="/images/placeholder.svg"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
      </div>
    );
  }

  // 일반 이미지 URL
  return (
    <div className={cn("relative w-full h-full", className)}>
      <Image
        src={media.url}
        alt=""
        fill
        className="object-contain"
        priority={priority}
        unoptimized
        onLoad={() => setIsLoading(false)}
        onError={() => setImageError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
}