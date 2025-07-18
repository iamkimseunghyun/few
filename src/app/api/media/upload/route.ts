import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudflare, getImageUrl } from '@/lib/cloudflare-images';
import {
  uploadToCloudflareStream,
  getStreamVideoUrl,
  getStreamThumbnailUrl,
  getStreamVideoInfo,
} from '@/lib/cloudflare-stream';

// 파일 타입별 제한 설정
const FILE_LIMITS = {
  image: {
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    allowedTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // 최대 10개 파일 제한
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        try {
          // 파일 타입 확인
          const isImage = FILE_LIMITS.image.allowedTypes.includes(file.type);
          const isVideo = FILE_LIMITS.video.allowedTypes.includes(file.type);

          if (!isImage && !isVideo) {
            throw new Error(`Invalid file type: ${file.type}`);
          }

          // 파일 크기 확인
          const limits = isImage ? FILE_LIMITS.image : FILE_LIMITS.video;
          if (file.size > limits.maxSize) {
            throw new Error(
              `File size too large. Maximum ${limits.maxSize / 1024 / 1024}MB allowed`
            );
          }

          if (isImage) {
            // 이미지는 기존 Cloudflare Images 사용
            const imageId = await uploadToCloudflare(file);
            const url = getImageUrl(imageId);

            return {
              url,
              type: 'image' as const,
              name: file.name,
              size: file.size,
            };
          } else {
            // 비디오는 Cloudflare Stream 사용
            const videoId = await uploadToCloudflareStream(file);

            // 비디오 처리 완료까지 잠시 대기 (선택사항)
            // Stream은 비동기로 처리되므로 즉시 재생이 안 될 수 있음
            let videoInfo;
            let retries = 0;
            const maxRetries = 5;

            while (retries < maxRetries) {
              try {
                videoInfo = await getStreamVideoInfo(videoId);
                if (videoInfo.readyToStream) {
                  break;
                }
              } catch (error) {
                // 비디오 정보를 아직 가져올 수 없는 경우
                console.error(error);
              }

              // 1초 대기 후 재시도
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retries++;
            }

            return {
              url: getStreamVideoUrl(videoId),
              type: 'video' as const,
              name: file.name,
              size: file.size,
              videoId,
              duration: videoInfo?.duration || 0,
              thumbnailUrl: getStreamThumbnailUrl(videoId),
              readyToStream: videoInfo?.readyToStream || false,
            };
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return {
            error: error instanceof Error ? error.message : 'Upload failed',
            name: file.name,
          };
        }
      })
    );

    // 성공한 업로드와 실패한 업로드 분리
    const successful = uploadResults.filter((r) => !('error' in r));
    const failed = uploadResults.filter((r) => 'error' in r);

    return NextResponse.json({
      successful,
      failed,
      message: `${successful.length} files uploaded successfully${
        failed.length > 0 ? `, ${failed.length} failed` : ''
      }`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
