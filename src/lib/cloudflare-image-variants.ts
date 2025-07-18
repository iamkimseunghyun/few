/**
 * Cloudflare Images 변형(variants) 설정
 * 각 변형은 특정 용도에 최적화된 크기와 품질을 가집니다
 */

export const CLOUDFLARE_VARIANTS = {
  // 썸네일 - 작은 미리보기 이미지
  thumbnail: {
    width: 150,
    height: 150,
    fit: 'cover' as const,
    quality: 80,
  },
  
  // 카드 이미지 - 리스트 아이템용
  card: {
    width: 400,
    height: 300,
    fit: 'cover' as const,
    quality: 85,
  },
  
  // 프로필 아바타
  avatar: {
    width: 200,
    height: 200,
    fit: 'cover' as const,
    quality: 90,
  },
  
  // 갤러리 이미지 - 중간 크기
  gallery: {
    width: 800,
    height: 600,
    fit: 'contain' as const,
    quality: 90,
  },
  
  // 히어로 이미지 - 큰 배너
  hero: {
    width: 1920,
    height: 1080,
    fit: 'cover' as const,
    quality: 85,
  },
  
  // 원본에 가까운 고품질
  public: {
    width: 1600,
    height: 1600,
    fit: 'scale-down' as const,
    quality: 95,
  },
} as const;

export type CloudflareVariant = keyof typeof CLOUDFLARE_VARIANTS;

/**
 * 디바이스 크기에 따른 최적 변형 선택
 */
export function getOptimalVariant(
  purpose: 'thumbnail' | 'list' | 'detail' | 'hero' | 'avatar' | 'gallery',
  deviceWidth?: number
): CloudflareVariant {
  // 모바일 우선 접근
  const isMobile = deviceWidth ? deviceWidth < 768 : false;
  
  switch (purpose) {
    case 'thumbnail':
      return 'thumbnail';
    
    case 'avatar':
      return 'avatar';
      
    case 'list':
      return isMobile ? 'thumbnail' : 'card';
      
    case 'detail':
      return isMobile ? 'card' : 'gallery';
      
    case 'hero':
      return isMobile ? 'gallery' : 'hero';
      
    case 'gallery':
      return 'gallery';
      
    default:
      return 'public';
  }
}

/**
 * Cloudflare Images URL 생성 헬퍼
 */
export function getCloudflareImageUrl(
  imageId: string,
  variant: CloudflareVariant = 'public',
  accountHash?: string
): string {
  const hash = accountHash || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!hash || !imageId) return '';
  
  return `https://imagedelivery.net/${hash}/${imageId}/${variant}`;
}

/**
 * 반응형 이미지를 위한 srcset 생성
 */
export function generateSrcSet(
  imageId: string,
  variants: CloudflareVariant[],
  accountHash?: string
): string {
  return variants
    .map(variant => {
      const url = getCloudflareImageUrl(imageId, variant, accountHash);
      const width = CLOUDFLARE_VARIANTS[variant].width;
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * 이미지 로딩 우선순위 결정
 */
export function getImagePriority(
  position: 'above-fold' | 'below-fold' | 'lazy',
  isLCP: boolean = false
): {
  priority: boolean;
  loading: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
} {
  if (isLCP || position === 'above-fold') {
    return {
      priority: true,
      loading: 'eager',
      fetchPriority: 'high',
    };
  }
  
  return {
    priority: false,
    loading: 'lazy',
    fetchPriority: 'auto',
  };
}