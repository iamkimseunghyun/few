import { extractImageId } from './cloudflare-images';
import { getCloudflareImageUrl, type CloudflareVariant } from './cloudflare-image-variants';

/**
 * 이미지 URL이 Cloudflare Images URL인지 확인
 */
export function isCloudflareImageUrl(url: string): boolean {
  return url.includes('imagedelivery.net');
}

/**
 * 일반 이미지 URL을 Cloudflare 이미지로 변환 시도
 * Cloudflare에 업로드된 이미지라면 imageId를 추출하여 최적화된 URL 반환
 */
export function optimizeImageUrl(
  url: string, 
  variant: CloudflareVariant = 'public'
): string {
  if (!url) return '';
  
  // 이미 Cloudflare 이미지인 경우
  if (isCloudflareImageUrl(url)) {
    const imageId = extractImageId(url);
    if (imageId) {
      return getCloudflareImageUrl(imageId, variant);
    }
  }
  
  // 일반 URL은 그대로 반환
  return url;
}

/**
 * 여러 이미지 URL을 최적화
 */
export function optimizeImageUrls(
  urls: string[],
  variant: CloudflareVariant = 'public'
): string[] {
  return urls.map(url => optimizeImageUrl(url, variant));
}

/**
 * 이미지 배열에서 첫 번째 Cloudflare 이미지 ID 추출
 */
export function getFirstCloudflareImageId(images: string[]): string | null {
  for (const image of images) {
    if (isCloudflareImageUrl(image)) {
      const imageId = extractImageId(image);
      if (imageId) return imageId;
    }
  }
  return null;
}

/**
 * 이미지 로딩 전략 결정
 */
export function getImageLoadingStrategy(index: number) {
  // 첫 2개 이미지는 eager 로딩
  if (index < 2) {
    return {
      priority: true,
      loading: 'eager' as const,
    };
  }
  
  // 나머지는 lazy 로딩
  return {
    priority: false,
    loading: 'lazy' as const,
  };
}

/**
 * 이미지 품질 설정
 */
export function getImageQuality(purpose: 'thumbnail' | 'detail' | 'hero'): number {
  switch (purpose) {
    case 'thumbnail':
      return 70;
    case 'detail':
      return 85;
    case 'hero':
      return 90;
    default:
      return 85;
  }
}