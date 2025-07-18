'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import { cn } from '@/lib/utils';

interface Media {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface MediaCarouselProps {
  media: Media[];
}

export function MediaCarousel({ media }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    setIsPlaying(false);
  };

  const currentMedia = media[currentIndex];

  if (!currentMedia) return null;

  return (
    <div className="relative w-full bg-black">
      <div className="relative aspect-square lg:aspect-auto lg:h-[calc(100vh-4rem)] flex items-center justify-center">
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
                url={currentMedia.url}
                thumbnailUrl={currentMedia.thumbnailUrl}
                className="w-full h-full object-contain"
                controls={isPlaying}
                autoPlay={isPlaying}
                muted={!isPlaying}
              />
            ) : (
              // 일반 비디오
              <video
                src={currentMedia.url}
                poster={currentMedia.thumbnailUrl}
                controls={isPlaying}
                autoPlay={isPlaying}
                className="w-full h-full object-contain"
                onClick={() => setIsPlaying(!isPlaying)}
              />
            )}
            {!isPlaying && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors md:left-4"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors md:right-4"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}