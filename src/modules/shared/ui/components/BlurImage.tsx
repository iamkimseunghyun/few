'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface BlurImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

// 작은 이미지를 위한 블러 데이터 URL 생성
function getBlurDataUrl(width: number = 10, height: number = 10): string {
  const blurSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <rect width="100%" height="100%" fill="#e5e7eb" filter="url(#b)" />
    </svg>
  `;

  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(blurSvg).toString('base64')
      : btoa(blurSvg);

  return `data:image/svg+xml;base64,${base64}`;
}

export function BlurImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  quality = 75,
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [blurDataUrl, setBlurDataUrl] = useState<string>('');

  useEffect(() => {
    // 블러 데이터 URL 생성
    setBlurDataUrl(getBlurDataUrl(width || 10, height || 10));
  }, [width, height]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setCurrentSrc('/images/placeholder.svg');
    setIsLoading(false);
  };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {/* 블러 플레이스홀더 */}
      {isLoading && blurDataUrl && (
        <Image
          src={blurDataUrl}
          alt=""
          width={width}
          height={height}
          fill={fill}
          className={`${className} absolute inset-0`}
          priority
          unoptimized
        />
      )}

      {/* 실제 이미지 */}
      <Image
        src={currentSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        sizes={
          sizes ||
          (fill
            ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            : undefined)
        }
        quality={quality}
        loading={priority ? undefined : 'lazy'}
      />
    </div>
  );
}
