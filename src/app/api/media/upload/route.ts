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
      'image/gif',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
    ],
    allowedExtensions: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'avif',
      'heic',
      'heif',
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
    allowedExtensions: ['mp4', 'mov', 'avi', 'webm'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
};

// 파일 확장자 추출 헬퍼
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// 파일 타입 검증 헬퍼
function validateFileType(file: File): 'image' | 'video' | null {
  const extension = getFileExtension(file.name);

  // MIME 타입으로 확인
  if (FILE_LIMITS.image.allowedTypes.includes(file.type)) return 'image';
  if (FILE_LIMITS.video.allowedTypes.includes(file.type)) return 'video';

  // MIME 타입이 없거나 인식 못하는 경우 확장자로 확인
  if (FILE_LIMITS.image.allowedExtensions.includes(extension)) return 'image';
  if (FILE_LIMITS.video.allowedExtensions.includes(extension)) return 'video';

  return null;
}

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
          const fileType = validateFileType(file);

          if (!fileType) {
            console.error('Invalid file:', {
              name: file.name,
              type: file.type || 'empty',
              size: file.size,
              extension: getFileExtension(file.name),
            });
            throw new Error(
              `Invalid file type: ${file.type || 'unknown'} (${file.name})`
            );
          }

          // 파일 크기 확인
          const limits = FILE_LIMITS[fileType];
          if (file.size > limits.maxSize) {
            throw new Error(
              `File size too large. Maximum ${limits.maxSize / 1024 / 1024}MB allowed`
            );
          }

          if (fileType === 'image') {
            try {
              // 이미지는 기존 Cloudflare Images 사용
              const imageId = await uploadToCloudflare(file);
              const url = getImageUrl(imageId);

              return {
                url,
                type: 'image' as const,
                name: file.name,
                size: file.size,
                mimeType: file.type || `image/${getFileExtension(file.name)}`,
              };
            } catch (uploadError) {
              console.error('Cloudflare Images upload error:', uploadError);
              // AVIF 업로드 실패 시 더 자세한 에러 메시지
              if (file.name.toLowerCase().endsWith('.avif')) {
                throw new Error(
                  'AVIF upload failed. The image service may not support this format yet.'
                );
              }
              throw uploadError;
            }
          } else {
            // 비디오는 Cloudflare Stream 사용
            const videoId = await uploadToCloudflareStream(file);

            // 비디오 처리 완료까지 잠시 대기 (선택사항)
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
                console.log(
                  `Waiting for video processing... (${retries + 1}/${maxRetries}) ${error}`
                );
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
              mimeType: file.type || `video/${getFileExtension(file.name)}`,
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
