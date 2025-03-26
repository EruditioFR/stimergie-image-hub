/**
 * Utilities for cache key management in the LazyImage component
 */

/**
 * Generates a cache key for an image URL
 * This ensures consistent caching across the application
 */
export function getImageCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Keep only the hostname, pathname and essential parameters
    const essentialParams = new URLSearchParams();
    
    // Filter only relevant parameters for caching
    const relevantParams = ['w', 'h', 'q', 'width', 'height', 'quality', 'size'];
    for (const param of relevantParams) {
      if (urlObj.searchParams.has(param)) {
        essentialParams.set(param, urlObj.searchParams.get(param)!);
      }
    }
    
    // Build a normalized cache key
    return `${urlObj.origin}${urlObj.pathname}${essentialParams.toString() ? '?' + essentialParams.toString() : ''}`;
  } catch (e) {
    // In case of error, use the full URL as key
    return url;
  }
}
