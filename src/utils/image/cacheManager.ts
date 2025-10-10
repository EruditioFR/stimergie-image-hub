
// ============================================
// UNIFIED CACHE MANAGER - Sprint 2 Optimized
// ============================================
// Uses React Query + SessionStorage only
// Implements intelligent LRU eviction (200 images max)

import { MAX_CACHE_ENTRIES } from '@/services/gallery/constants';

// Memory cache for image promises
export const fetchCache = new Map<string, Promise<Blob | null>>();

// Secondary cache for processed URLs after transformation
export const processedUrlCache = new Map<string, string>();

// LRU tracking: Map to store access timestamps
const cacheAccessTimes = new Map<string, number>();

// Maximum cache size (number of entries) - from constants
const MAX_CACHE_SIZE = MAX_CACHE_ENTRIES;

// Unified session storage cache with intelligent LRU eviction
export const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          const value = sessionStorage.getItem(`img_cache_${key}`);
          if (value) {
            // Update access time for LRU
            cacheAccessTimes.set(key, Date.now());
          }
          return value;
        } catch (e) {
          console.warn('Failed to access session storage:', e);
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          // Update access time
          cacheAccessTimes.set(key, Date.now());
          
          sessionStorage.setItem(`img_cache_${key}`, value);
          
          // Check cache size and apply LRU eviction if needed
          evictLRUIfNeeded();
        } catch (e) {
          console.warn('Storage full, applying LRU eviction:', e);
          // Force LRU eviction
          evictLRUEntries(Math.ceil(MAX_CACHE_SIZE * 0.2)); // Remove 20% of cache
          try {
            sessionStorage.setItem(`img_cache_${key}`, value);
          } catch (retryError) {
            console.error('Failed to cache after LRU eviction:', retryError);
          }
        }
      },
      removeItem: (key: string): void => {
        try {
          sessionStorage.removeItem(`img_cache_${key}`);
          cacheAccessTimes.delete(key);
        } catch (e) {
          console.warn('Failed to remove from session storage:', e);
        }
      },
      clear: (): void => {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('img_cache_')) {
              keysToRemove.push(key);
            }
          }
          
          for (const key of keysToRemove) {
            sessionStorage.removeItem(key);
            const cacheKey = key.replace('img_cache_', '');
            cacheAccessTimes.delete(cacheKey);
          }
          
          console.log(`✨ Cleared ${keysToRemove.length} items from unified cache`);
        } catch (e) {
          console.warn('Failed to clear session storage:', e);
        }
      }
    };
  } catch (e) {
    console.warn('Session storage not available, using in-memory fallback');
    const memoryCache = new Map<string, string>();
    return {
      getItem: (key: string): string | null => {
        const value = memoryCache.get(key) || null;
        if (value) cacheAccessTimes.set(key, Date.now());
        return value;
      },
      setItem: (key: string, value: string): void => { 
        cacheAccessTimes.set(key, Date.now());
        memoryCache.set(key, value);
        if (memoryCache.size > MAX_CACHE_SIZE) {
          const oldestKey = Array.from(cacheAccessTimes.entries())
            .sort((a, b) => a[1] - b[1])[0][0];
          memoryCache.delete(oldestKey);
          cacheAccessTimes.delete(oldestKey);
        }
      },
      removeItem: (key: string): void => { 
        memoryCache.delete(key);
        cacheAccessTimes.delete(key);
      },
      clear: (): void => { 
        memoryCache.clear();
        cacheAccessTimes.clear();
      }
    };
  }
})();

/**
 * LRU Eviction: Remove least recently used entries
 */
function evictLRUEntries(count: number): void {
  // Get all cache keys sorted by access time (oldest first)
  const sortedEntries = Array.from(cacheAccessTimes.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, count);
  
  console.log(`🗑️ LRU eviction: removing ${sortedEntries.length} oldest entries`);
  
  for (const [key] of sortedEntries) {
    sessionImageCache.removeItem(key);
    fetchCache.delete(key);
    processedUrlCache.delete(key);
  }
}

/**
 * Check cache size and evict if needed
 */
function evictLRUIfNeeded(): void {
  if (cacheAccessTimes.size > MAX_CACHE_SIZE) {
    const toRemove = cacheAccessTimes.size - MAX_CACHE_SIZE + Math.ceil(MAX_CACHE_SIZE * 0.1); // Remove 10% extra
    evictLRUEntries(toRemove);
  }
}

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
 * Updates access time for the given URL
 */
export function manageCacheSize(url: string): void {
  // Update access time for LRU tracking
  const cacheKey = generateCacheKey(url);
  cacheAccessTimes.set(cacheKey, Date.now());
  
  // Check if eviction is needed
  evictLRUIfNeeded();
}

/**
 * Clears all unified cache stores (memory + session)
 */
export function clearAllCaches(): void {
  console.log('🧹 Clearing all unified image caches...');
  
  // Clear in-memory caches
  fetchCache.clear();
  processedUrlCache.clear();
  cacheAccessTimes.clear();
  
  // Clear session storage cache
  sessionImageCache.clear();
  
  console.log('✅ All caches cleared successfully');
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    memoryCache: fetchCache.size,
    processedUrls: processedUrlCache.size,
    trackedEntries: cacheAccessTimes.size,
    maxSize: MAX_CACHE_SIZE,
    utilizationPercent: Math.round((cacheAccessTimes.size / MAX_CACHE_SIZE) * 100)
  };
}
