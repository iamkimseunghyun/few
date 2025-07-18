'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'wide';
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
};

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/images/placeholder.png',
  aspectRatio,
  sizes,
  priority = false,
  loading = 'lazy',
  quality = 75,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // 반응형 이미지 sizes 기본값
  const defaultSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatio && aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        sizes={defaultSizes}
        quality={quality}
        priority={priority}
        loading={loading}
        fill={!props.width && !props.height}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          props.fill && 'absolute inset-0'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
      />
      
      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  );
}

// Cloudflare Images URL 생성 헬퍼
export function getCloudflareImageUrl(
  imageId: string,
  variant: 'thumbnail' | 'public' | 'hero' | 'avatar' = 'public'
): string {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!accountHash || !imageId) return '';
  
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

// 이미지 사이즈 최적화 헬퍼
export function getOptimizedImageSizes(breakpoints: {
  mobile: number;
  tablet: number;
  desktop: number;
}): string {
  return `(max-width: 640px) ${breakpoints.mobile}vw, (max-width: 1024px) ${breakpoints.tablet}vw, ${breakpoints.desktop}vw`;
}