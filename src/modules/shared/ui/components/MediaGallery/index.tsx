'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { StreamVideoPlayer } from '@/modules/music-diary/components/StreamVideoPlayer';
import { CloudflareImage } from '@/components/CloudflareImage';
import { getCloudflareImageUrl } from '@/lib/cloudflare-image-variants';
import { cn } from '@/lib/utils';

// Cloudflare 이미지 URL 처리 헬퍼
function processImageUrl(url: string): { isCloudflare: boolean; imageId: string; fullUrl: string } {
  // 이미 전체 Cloudflare URL인 경우
  if (url.includes('imagedelivery.net')) {
    const parts = url.split('/');
    const imageId = parts[parts.length - 2] || ''; // variant 전의 ID
    return { isCloudflare: true, imageId, fullUrl: url };
  }
  
  // HTTP로 시작하지 않으면 Cloudflare Image ID로 간주
  if (!url.startsWith('http')) {
    const fullUrl = getCloudflareImageUrl(url, 'public');
    return { isCloudflare: true, imageId: url, fullUrl: fullUrl || url };
  }
  
  // 일반 URL
  return { isCloudflare: false, imageId: '', fullUrl: url };
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

export interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'original';
  showIndicators?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean;
}

export function MediaGallery({ 
  media, 
  className,
  aspectRatio = 'video',
  showIndicators = true,
  showNavigation = true,
  autoPlay = false,
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 디버깅
  console.log('MediaGallery - media:', media);
  console.log('MediaGallery - current media:', media[currentIndex]);

  // 미디어가 변경될 때 재생 상태 초기화
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
    // 비디오 참조가 있으면 직접 재생
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const aspectRatioClass = aspectRatio === 'original' 
    ? '' 
    : {
        video: 'aspect-video',
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
      }[aspectRatio];

  return (
    <div className={cn(
      'relative bg-black rounded-lg overflow-hidden', 
      aspectRatioClass,
      aspectRatio === 'original' && 'min-h-[200px]',
      className
    )}>
      <div className="relative w-full h-full flex items-center justify-center">
        {currentMedia.type === 'image' ? (
          (() => {
            const { isCloudflare, imageId, fullUrl } = processImageUrl(currentMedia.url);
            console.log('Image processing:', { 
              original: currentMedia.url, 
              isCloudflare, 
              imageId, 
              fullUrl,
              hasAccountHash: !!process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH 
            });
            
            // Cloudflare 이미지이고 Account Hash가 있는 경우
            if (isCloudflare && process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH) {
              return (
                <CloudflareImage
                  imageId={imageId}
                  alt=""
                  containerClassName="w-full h-full"
                  className="w-full h-full object-contain"
                  purpose="gallery"
                  variant="public"
                  priority
                />
              );
            }
            
            // Account Hash가 없거나 일반 URL인 경우
            return (
              <Image
                src={fullUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority
                unoptimized
              />
            );
          })()
        ) : (
          <div className="relative w-full h-full bg-black">
            {currentMedia.url.includes('.m3u8') ? (
              // Cloudflare Stream 비디오
              <StreamVideoPlayer
                ref={videoRef}
                url={currentMedia.url}
                thumbnailUrl={currentMedia.thumbnailUrl}
                className="w-full h-full object-contain"
                controls={true}
                autoPlay={isPlaying}
                muted={false}
              />
            ) : (
              // 일반 비디오
              <video
                ref={videoRef}
                src={currentMedia.url}
                poster={currentMedia.thumbnailUrl}
                controls={true}
                autoPlay={isPlaying}
                className="w-full h-full object-contain"
                preload="metadata"
                style={{ backgroundColor: '#000' }}
              />
            )}
            {!isPlaying && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayClick();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 z-[5]"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {showNavigation && media.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            aria-label="이전 미디어"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            aria-label="다음 미디어"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsPlaying(false);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all flex items-center justify-center',
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              )}
              aria-label={`${index + 1}번째 미디어로 이동`}
            >
              {item.type === 'video' && index === currentIndex && (
                <span className="sr-only">비디오</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Media count badge */}
      {media.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
}