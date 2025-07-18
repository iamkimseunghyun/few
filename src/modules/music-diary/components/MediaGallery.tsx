'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useSwipeElement } from '@/modules/shared/hooks/useSwipe';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface MediaGalleryProps {
  media: MediaItem[];
  isInteractive?: boolean;
}

export function MediaGallery({ media, isInteractive = true }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Swipe handling
  useSwipeElement(galleryRef, {
    onSwipeLeft: () => {
      if (isInteractive && currentIndex < media.length - 1 && !isTransitioning) {
        handleIndexChange(currentIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (isInteractive && currentIndex > 0 && !isTransitioning) {
        handleIndexChange(currentIndex - 1);
      }
    },
  });

  const goToPrevious = () => {
    if (currentIndex > 0) {
      handleIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < media.length - 1) {
      handleIndexChange(currentIndex + 1);
    }
  };

  const handleIndexChange = (newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    setIsVideoPlaying(false);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className="relative w-full h-full aspect-square bg-black overflow-hidden" ref={galleryRef}>
      {/* Media Carousel Container */}
      <div 
        className="flex h-full transition-transform duration-300"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {media.map((item, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={`Photo ${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Video Thumbnail */}
                {!isVideoPlaying && item.thumbnailUrl && index === currentIndex && (
                  <>
                    <Image
                      src={item.thumbnailUrl}
                      alt={`Video thumbnail ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white ml-1" />
                      </div>
                    </button>
                  </>
                )}
                
                {/* Video Player */}
                {index === currentIndex && (isVideoPlaying || !item.thumbnailUrl) && (
                  <video
                    ref={videoRef}
                    src={item.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={() => {
                      if (currentIndex < media.length - 1) {
                        handleIndexChange(currentIndex + 1);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (desktop only) */}
      {isInteractive && media.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full items-center justify-center text-white hover:bg-opacity-70"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          
          {currentIndex < media.length - 1 && (
            <button
              onClick={goToNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full items-center justify-center text-white hover:bg-opacity-70"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Indicators */}
      {isInteractive && media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                handleIndexChange(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Media count badge */}
      {media.length > 1 && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
}