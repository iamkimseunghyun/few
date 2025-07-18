'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { StreamVideoPlayer } from '@/modules/music-diary/components/StreamVideoPlayer';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface ReviewMediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

export function ReviewMediaGallery({ media, className }: ReviewMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
      <div className="relative w-full h-full flex items-center justify-center">
        {currentMedia.type === 'image' ? (
          <Image
            src={currentMedia.url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
            priority
          />
        ) : (
          <div className="relative w-full h-full">
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
      {media.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
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
              >
                {item.type === 'video' && index === currentIndex && (
                  <span className="sr-only">비디오</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}