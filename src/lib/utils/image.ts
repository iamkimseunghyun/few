// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getBlurDataUrl(_src: string): Promise<string> {
  // For demo purposes, return a simple blur placeholder
  // In production, you'd generate actual blur data URLs using the src parameter
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='.5'/%3E%3C/filter%3E%3Cimage preserveAspectRatio='none' filter='url(%23b)' x='0' y='0' height='100%25' width='100%25' href='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='/%3E%3C/svg%3E";
}

export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  // For Cloudflare Images
  const { width = 800, quality = 85, format = 'auto' } = options;
  
  // If it's already a Cloudflare Images URL, append variants
  if (url.includes('imagedelivery.net')) {
    const parts = url.split('/');
    const variant = `w=${width},q=${quality},f=${format}`;
    return `${parts.slice(0, -1).join('/')}/${variant}`;
  }
  
  // Return original URL for other sources
  return url;
}