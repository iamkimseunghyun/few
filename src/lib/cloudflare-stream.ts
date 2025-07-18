import { CLOUDFLARE_IMAGES_CONFIG } from './cloudflare-images';

// Cloudflare Stream 설정
export const CLOUDFLARE_STREAM_CONFIG = {
  accountId: CLOUDFLARE_IMAGES_CONFIG.accountId,
  apiToken: CLOUDFLARE_IMAGES_CONFIG.apiToken,
  customerSubdomain: 'customer-je8isnt4wjj28ley.cloudflarestream.com',
};

interface StreamError {
  code: number;
  message: string;
}

interface StreamMessage {
  code: number;
  message: string;
  type?: string;
}

interface StreamUploadResponse {
  result: {
    uid: string;
    thumbnail: string;
    thumbnailTimestampPct: number;
    readyToStream: boolean;
    status: {
      state: 'queued' | 'inprogress' | 'ready' | 'error';
      pctComplete: number;
      errorReasonCode?: string;
      errorReasonText?: string;
    };
    meta: {
      name: string;
    };
    created: string;
    modified: string;
    size: number;
    preview: string;
    allowedOrigins: string[];
    requireSignedURLs: boolean;
    duration: number;
  };
  success: boolean;
  errors: StreamError[];
  messages: StreamMessage[];
}

// 비디오 업로드
export async function uploadToCloudflareStream(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  // 메타데이터는 현재 사용하지 않음
  // 필요 시 formData에 추가 가능
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_CONFIG.accountId}/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_STREAM_CONFIG.apiToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload video: ${error}`);
  }

  const data: StreamUploadResponse = await response.json();
  
  if (!data.success) {
    throw new Error(`Failed to upload video: ${data.errors.join(', ')}`);
  }

  return data.result.uid;
}

// 비디오 삭제
export async function deleteFromCloudflareStream(videoId: string): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_CONFIG.accountId}/stream/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_STREAM_CONFIG.apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete video: ${error}`);
  }
}

// 비디오 정보 조회
export async function getStreamVideoInfo(videoId: string): Promise<StreamUploadResponse['result']> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_CONFIG.accountId}/stream/${videoId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_STREAM_CONFIG.apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get video info: ${error}`);
  }

  const data: StreamUploadResponse = await response.json();
  return data.result;
}

// 비디오 URL 생성
export function getStreamVideoUrl(videoId: string): string {
  return `https://${CLOUDFLARE_STREAM_CONFIG.customerSubdomain}/${videoId}/manifest/video.m3u8`;
}

// 비디오 썸네일 URL 생성
export function getStreamThumbnailUrl(videoId: string): string {
  return `https://${CLOUDFLARE_STREAM_CONFIG.customerSubdomain}/${videoId}/thumbnails/thumbnail.jpg`;
}

// iframe embed URL 생성
export function getStreamEmbedUrl(videoId: string): string {
  return `https://${CLOUDFLARE_STREAM_CONFIG.customerSubdomain}/${videoId}/iframe`;
}

// 비디오 URL에서 videoId 추출
export function extractVideoId(videoUrl: string): string | null {
  // URL 형식: https://customer-je8isnt4wjj28ley.cloudflarestream.com/{videoId}/manifest/video.m3u8
  const match = videoUrl.match(/cloudflarestream\.com\/([^/]+)\//);
  return match ? match[1] : null;
}