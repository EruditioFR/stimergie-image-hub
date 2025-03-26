
/**
 * Cache management utilities for the LazyImage component
 */
import { getImageCacheKey } from './cacheUtils';

// Configurable options
export const PRELOAD_PRIORITY_HIGH = 1;
export const PRELOAD_PRIORITY_MEDIUM = 2;
export const PRELOAD_PRIORITY_LOW = 3;
export const PRELOAD_BATCH_SIZE = 6;

// Performance optimized global memory cache
export const imageCache = new Map<string, string>();
export const requestedImagesCache = new Set<string>();
export const imageErrorCache = new Set<string>();

// Prioritized preloading queue
export interface PreloadItem {
  url: string;
  priority: number;
  timestamp: number;
}
export const preloadQueue: PreloadItem[] = [];
export let isPreloading = false;

// Enhanced session-persistent cache
export const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          // Check localStorage first (persistent)
          const persisted = localStorage.getItem(`persistent_img_${key}`);
          if (persisted) return persisted;
          
          // Then check sessionStorage
          return sessionStorage.getItem(`lazy_img_${key}`);
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          // Store in sessionStorage
          sessionStorage.setItem(`lazy_img_${key}`, value);
          
          // Try to store in localStorage for persistence
          try {
            localStorage.setItem(`persistent_img_${key}`, value);
          } catch (persistError) {
            // Clear space if localStorage is full
            try {
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey.startsWith('persistent_img_')) {
                  keysToRemove.push(storageKey);
                }
              }
              
              const removeCount = Math.ceil(keysToRemove.length * 0.2);
              keysToRemove.slice(0, removeCount).forEach(k => localStorage.removeItem(k));
              
              localStorage.setItem(`persistent_img_${key}`, value);
            } catch (e) {
              console.warn('Failed to clear persistent storage:', e);
            }
          }
        } catch (e) {
          // Storage full - clear older entries
          try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const storageKey = sessionStorage.key(i);
              if (storageKey && storageKey.startsWith('lazy_img_')) {
                keysToRemove.push(storageKey);
              }
            }
            
            const removeCount = Math.ceil(keysToRemove.length * 0.2);
            keysToRemove.slice(0, removeCount).forEach(k => sessionStorage.removeItem(k));
            
            sessionStorage.setItem(`lazy_img_${key}`, value);
          } catch (e) {
            console.warn('Could not clear session storage:', e);
          }
        }
      }
    };
  } catch (e) {
    // Fallback to memory cache
    const memoryFallback = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memoryFallback.get(key) || null,
      setItem: (key: string, value: string): void => { memoryFallback.set(key, value); }
    };
  }
})();

/**
 * Check if an image is already loaded in any cache
 */
export async function isImageLoaded(src: string): Promise<boolean> {
  if (!src) return false;
  
  // Check memory cache first (fastest)
  if (imageCache.has(src)) return true;
  
  // Check session cache next
  const cacheKey = getImageCacheKey(src);
  if (sessionImageCache.getItem(cacheKey)) return true;
  
  // Check if the image is in the browser's HTTP cache
  try {
    const response = await fetch(src, {
      method: 'HEAD',
      cache: 'only-if-cached',
      mode: 'no-cors'
    });
    return response.status === 200;
  } catch (e) {
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function clearOffscreenImagesFromCache(): void {
  // This is now handled automatically
}
