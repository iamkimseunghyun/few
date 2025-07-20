'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  getCloudflareImageUrl, 
  generateSrcSet,
  getOptimalVariant,
  getImagePriority,
  type CloudflareVariant 
} from '@/lib/cloudflare-image-variants';
import { useMediaQuery } from '@/modules/shared/hooks/useMediaQuery';

interface CloudflareImageProps {
  imageId: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  purpose?: 'thumbnail' | 'list' | 'detail' | 'hero' | 'avatar' | 'gallery';
  variant?: CloudflareVariant;
  variants?: CloudflareVariant[]; // srcset용 다중 변형
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'wide';
  fallbackSrc?: string;
  priority?: boolean;
  position?: 'above-fold' | 'below-fold' | 'lazy';
  isLCP?: boolean; // Largest Contentful Paint
  onLoad?: () => void;
  onClick?: () => void;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
};

export function CloudflareImage({
  imageId,
  alt,
  className,
  containerClassName,
  purpose = 'detail',
  variant,
  variants,
  aspectRatio,
  fallbackSrc = '/images/placeholder.svg',
  priority: customPriority,
  position = 'lazy',
  isLCP = false,
  onLoad,
  onClick,
}: CloudflareImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 디바이스에 따른 최적 변형 선택 (early calculation for hooks)
  const optimalVariant = variant || getOptimalVariant(purpose, isMobile ? 400 : 1200);
  const imageUrl = imageId && imageId.trim() !== '' ? getCloudflareImageUrl(imageId, optimalVariant) : null;
  const displayUrl = hasError ? fallbackSrc : (imageUrl || fallbackSrc);
  
  // 로딩 우선순위 결정
  const { priority, loading, fetchPriority } = getImagePriority(position, isLCP);
  const isPlaceholder = displayUrl === fallbackSrc;
  const finalPriority = isPlaceholder ? false : (customPriority ?? priority);
  const finalLoading = isPlaceholder ? 'lazy' : loading;
  
  // srcset 생성 (반응형 이미지)
  const srcSet = variants && imageId && imageId.trim() !== '' ? generateSrcSet(imageId, variants) : undefined;
  
  useEffect(() => {
    // 이미지 프리로드 (중요 이미지)
    if (finalPriority && imageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      link.setAttribute('fetchpriority', fetchPriority || 'auto');
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [finalPriority, imageUrl, fetchPriority]);
  
  // 이미지 사이즈 힌트
  const sizes = purpose === 'thumbnail' 
    ? '150px'
    : purpose === 'avatar'
    ? '200px'
    : purpose === 'list'
    ? '(max-width: 768px) 100vw, 400px'
    : purpose === 'hero'
    ? '100vw'
    : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px';
  
  // imageId가 없거나 빈 문자열이면 fallbackSrc 사용
  if (!imageId || imageId.trim() === '') {
    return (
      <div 
        className={cn(
          'relative overflow-hidden bg-gray-100',
          aspectRatio && aspectRatioClasses[aspectRatio],
          containerClassName
        )}
      >
        <Image
          src={fallbackSrc}
          alt={alt}
          fill
          sizes={sizes}
          className={cn('object-cover', className)}
          priority={false}
          loading="lazy"
        />
      </div>
    );
  }
  
  // displayUrl이 빈 문자열이면 fallbackSrc 사용
  const finalDisplayUrl = displayUrl || fallbackSrc;
  
  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatio && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
      onClick={onClick}
    >
      <Image
        src={finalDisplayUrl}
        alt={alt}
        fill
        sizes={sizes}
        quality={90}
        priority={finalPriority}
        loading={finalLoading}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...(srcSet && { srcSet })}
      />
      
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      )}
      
      {/* 에러 상태 */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">이미지 로드 실패</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 갤러리용 이미지 컴포넌트
export function CloudflareGalleryImage({
  imageId,
  alt,
  className,
  onClick,
}: {
  imageId: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <CloudflareImage
      imageId={imageId}
      alt={alt}
      purpose="gallery"
      variants={['card', 'gallery', 'public']}
      aspectRatio="landscape"
      className={cn('cursor-pointer hover:opacity-90 transition-opacity', className)}
      onClick={onClick}
    />
  );
}

// 썸네일용 이미지 컴포넌트
export function CloudflareThumbnail({
  imageId,
  alt,
  className,
  size = 'medium',
}: {
  imageId: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };
  
  return (
    <CloudflareImage
      imageId={imageId}
      alt={alt}
      purpose="thumbnail"
      aspectRatio="square"
      containerClassName={cn(sizeClasses[size], className)}
    />
  );
}