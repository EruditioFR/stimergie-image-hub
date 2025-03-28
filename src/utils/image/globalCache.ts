
/**
 * Global cache management for images that persists in localStorage
 */

const GLOBAL_CACHE_PREFIX = 'global_img_cache_';
const GLOBAL_CACHE_MAX_SIZE = 1024 * 1024 * 5; // 5MB max per image for global cache

/**
 * Retrieves an image from the global cache (localStorage)
 */
export function getFromGlobalCache(cacheKey: string): string | null {
  try {
    return localStorage.getItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`);
  } catch (e) {
    console.warn('Error accessing global cache:', e);
    return null;
  }
}

/**
 * Saves an image to the global cache (localStorage)
 */
export function saveToGlobalCache(cacheKey: string, base64Data: string): void {
  try {
    // Check image size
    if (base64Data.length > GLOBAL_CACHE_MAX_SIZE) {
      return;
    }
    
    try {
      localStorage.setItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`, base64Data);
    } catch (e) {
      // If cache is full, clean it
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GLOBAL_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // Sort alphabetically (simple approximation for LRU)
      keysToRemove.sort();
      
      // Remove the oldest 20%
      const removeCount = Math.ceil(keysToRemove.length * 0.2);
      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(keysToRemove[i]);
      }
      
      // Try again after cleaning
      try {
        localStorage.setItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`, base64Data);
      } catch (retryError) {
        console.warn('Unable to store in global cache even after cleaning:', retryError);
      }
    }
  } catch (e) {
    console.warn('Error saving to global cache:', e);
  }
}

/**
 * Clears all global cache entries from localStorage
 */
export function clearGlobalCache(): void {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GLOBAL_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    console.log(`Cleared ${keysToRemove.length} items from global cache`);
  } catch (e) {
    console.warn('Failed to clear global cache:', e);
  }
}
