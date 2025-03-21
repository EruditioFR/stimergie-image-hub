
// Cache manager for image fetching system

// Memory cache for image promises
export const fetchCache = new Map<string, Promise<Blob | null>>();

// Secondary cache for processed URLs after transformation
export const processedUrlCache = new Map<string, string>();

// For tracking usage order of cache entries (LRU - Least Recently Used)
let cacheUsageOrder: string[] = [];

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 300;

// Cache for storing actual blob data as base64 strings, persisting across page loads
export const sessionImageCache = (() => {
  try {
    // Using a wrapper for sessionStorage to handle exceptions
    return {
      getItem: (key: string): string | null => {
        try {
          return sessionStorage.getItem(`img_cache_${key}`);
        } catch (e) {
          console.warn('Failed to access session storage:', e);
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          sessionStorage.setItem(`img_cache_${key}`, value);
        } catch (e) {
          console.warn('Failed to write to session storage:', e);
          // If storage is full, clear old items
          try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && key.startsWith('img_cache_')) {
                keysToRemove.push(key);
              }
            }
            // Remove oldest 20% of cached images
            const removeCount = Math.ceil(keysToRemove.length * 0.2);
            for (let i = 0; i < removeCount; i++) {
              sessionStorage.removeItem(keysToRemove[i]);
            }
            // Try again
            sessionStorage.setItem(`img_cache_${key}`, value);
          } catch (clearError) {
            console.error('Failed to clear cache and retry:', clearError);
          }
        }
      },
      removeItem: (key: string): void => {
        try {
          sessionStorage.removeItem(`img_cache_${key}`);
        } catch (e) {
          console.warn('Failed to remove from session storage:', e);
        }
      }
    };
  } catch (e) {
    // Provide a fallback if sessionStorage is not available
    console.warn('Session storage not available, using in-memory cache instead');
    const memoryCache = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memoryCache.get(key) || null,
      setItem: (key: string, value: string): void => { memoryCache.set(key, value); },
      removeItem: (key: string): void => { memoryCache.delete(key); }
    };
  }
})();

/**
 * Generates a cache key that includes essential URL parameters
 * to avoid duplicates in the cache
 */
export function generateCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Ne garder que le hostname, le pathname et les paramètres essentiels
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

/**
 * Manages cache size using LRU (Least Recently Used) policy
 * Removes least recently used entries when cache exceeds maximum size
 */
export function manageCacheSize(url: string): void {
  // Update usage order
  // Remove URL if it already exists in the order
  cacheUsageOrder = cacheUsageOrder.filter(cachedUrl => cachedUrl !== url);
  // Add URL to the end (most recently used)
  cacheUsageOrder.push(url);
  
  // If cache exceeds maximum size, remove least recently used entries
  if (cacheUsageOrder.length > MAX_CACHE_SIZE) {
    const urlsToRemove = cacheUsageOrder.slice(0, cacheUsageOrder.length - MAX_CACHE_SIZE);
    urlsToRemove.forEach(urlToRemove => {
      fetchCache.delete(urlToRemove);
      processedUrlCache.delete(urlToRemove);
      sessionImageCache.removeItem(generateCacheKey(urlToRemove));
    });
    // Update usage order
    cacheUsageOrder = cacheUsageOrder.slice(-(MAX_CACHE_SIZE));
  }
}
