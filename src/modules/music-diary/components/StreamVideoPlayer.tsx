'use client';

import { useEffect, useRef, useImperativeHandle } from 'react';

interface StreamVideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  ref?: React.Ref<HTMLVideoElement>;
}

export const StreamVideoPlayer = ({
  url,
  thumbnailUrl,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  ref,
}: StreamVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 외부에서 ref를 사용할 수 있도록 전달
  useImperativeHandle(ref, () => videoRef.current!, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // HLS.js를 사용한 스트리밍 재생
    const loadVideo = async () => {
      // 브라우저가 네이티브 HLS를 지원하는지 확인 (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        // HLS.js 동적 임포트
        const Hls = (await import('hls.js')).default;
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxLoadingDelay: 4,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
          });
          
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('HLS fatal error:', data);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });

          // 컴포넌트 언마운트 시 정리
          return () => {
            hls.destroy();
          };
        } else {
          console.error('HLS is not supported in this browser');
        }
      }
    };

    loadVideo();
  }, [url]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      poster={thumbnailUrl}
      preload="metadata"
      style={{ backgroundColor: '#000' }}
    >
      Your browser does not support the video tag.
    </video>
  );
};