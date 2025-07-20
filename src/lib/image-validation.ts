/**
 * Image URL validation utilities
 */

// Cache for validated URLs to avoid repeated checks
const urlValidationCache = new Map<string, boolean>();

/**
 * Check if a URL is a valid Cloudflare image URL
 */
export function isCloudflareImageUrl(url: string): boolean {
  return url.includes('imagedelivery.net');
}

/**
 * Check if a URL is likely to be valid based on its pattern
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check cache first
  if (urlValidationCache.has(url)) {
    return urlValidationCache.get(url)!;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Always trust Cloudflare images
    if (isCloudflareImageUrl(url)) {
      urlValidationCache.set(url, true);
      return true;
    }
    
    // Trust local images
    if (urlObj.pathname.startsWith('/')) {
      urlValidationCache.set(url, true);
      return true;
    }
    
    // For external URLs, check if they're from trusted domains
    const trustedDomains = [
      'imagedelivery.net',
      'img.clerk.com',
      // Remove unsplash.com from trusted domains since the images are failing
    ];
    
    const isTrusted = trustedDomains.some(domain => urlObj.hostname.includes(domain));
    urlValidationCache.set(url, isTrusted);
    
    return isTrusted;
  } catch {
    urlValidationCache.set(url, false);
    return false;
  }
}

/**
 * Get a safe image URL - returns the URL if valid, otherwise returns placeholder
 */
export function getSafeImageUrl(url: string, fallback: string = '/images/placeholder.svg'): string {
  return isValidImageUrl(url) ? url : fallback;
}

/**
 * Clear the URL validation cache
 */
export function clearUrlValidationCache(): void {
  urlValidationCache.clear();
}