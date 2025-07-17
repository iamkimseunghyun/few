'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

// 블러 데이터 URL 생성 함수
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const dataUrl = `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;

export function OptimizedImage({
  src,
  alt,
  fill,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  quality = 75,
  onLoad,
  aspectRatio,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
    // 에러 시 기본 이미지로 대체
    setImgSrc('/images/placeholder.jpg');
  };

  // 반응형 sizes 속성 설정
  const getSizes = () => {
    if (fill) {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
    return `(max-width: ${width}px) 100vw, ${width}px`;
  };

  if (error && !imgSrc.includes('placeholder')) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const containerClass = aspectRatio ? `relative ${className}` : className;
  const imageWrapperClass = aspectRatio ? `aspect-[${aspectRatio}]` : '';

  return (
    <div className={containerClass}>
      {aspectRatio && <div className={imageWrapperClass} />}
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        quality={quality}
        priority={priority}
        sizes={getSizes()}
        placeholder="blur"
        blurDataURL={dataUrl}
        className={`
          ${fill ? 'object-cover' : ''} 
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
          transition-all duration-700 ease-out
        `}
        style={{
          objectFit: objectFit,
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? undefined : 'lazy'}
      />
    </div>
  );
}
