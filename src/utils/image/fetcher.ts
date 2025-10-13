
/**
 * Main image fetching module with improved caching strategy
 */

import { blobToBase64, base64ToBlob, isHtmlContent, isImageInBrowserCache } from './blobUtils';
import { 
  fetchCache, 
  processedUrlCache, 
  sessionImageCache, 
  generateCacheKey, 
  manageCacheSize
} from './cacheManager';
import { fetchImageFromStimergieServer } from './stimergieImageFetcher';
import { fetchGenericImage } from './genericImageFetcher';
import { getFromGlobalCache } from './globalCache';

/**
 * Downloads an image from any source with improved caching strategy
 * @param url - The URL of the image to fetch
 * @param onProgress - Optional callback for download progress (loaded bytes, total bytes)
 */
export async function fetchImageAsBlob(
  url: string, 
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob | null> {
  // Check if the URL is directly on www.stimergie.fr without proxy
  if (url.includes('stimergie.fr')) {
    // Ensure the URL doesn't have unnecessary parameters
    const cleanUrl = url.split('?')[0];
    
    // Generate a normalized cache key
    const cacheKey = generateCacheKey(cleanUrl);
    
    // Check browser cache first (fastest)
    if (await isImageInBrowserCache(cleanUrl)) {
      manageCacheSize(cacheKey);
      return fetch(cleanUrl).then(r => r.blob()).catch(() => null);
    }
    
    // Then check session cache (second fastest)
    const sessionCached = sessionImageCache.getItem(cacheKey);
    if (sessionCached) {
      try {
        const blob = await base64ToBlob(sessionCached);
        manageCacheSize(cacheKey);
        return blob;
      } catch (error) {
        console.warn('Failed to use session cached image:', error);
      }
    }
    
    // Then check global cache (localStorage)
    const globalCached = getFromGlobalCache(cacheKey);
    if (globalCached) {
      try {
        const blob = await base64ToBlob(globalCached);
        manageCacheSize(cacheKey);
        return blob;
      } catch (error) {
        console.warn('Failed to use globally cached image:', error);
      }
    }
    
    // Return the cached fetch promise if available
    if (fetchCache.has(cacheKey)) {
      manageCacheSize(cacheKey);
      return fetchCache.get(cacheKey);
    }
    
    // Create a new fetch promise and cache it
    const fetchPromise = fetchImageFromStimergieServer(cleanUrl, cacheKey, onProgress);
    fetchCache.set(cacheKey, fetchPromise);
    manageCacheSize(cacheKey);
    
    return fetchPromise;
  }
  
  // For non-stimergie URLs, use the generic implementation
  const cacheKey = generateCacheKey(url);
  
  // Check browser cache first (fastest)
  if (await isImageInBrowserCache(url)) {
    manageCacheSize(cacheKey);
    return fetch(url).then(r => r.blob()).catch(() => null);
  }
  
  // Then check session cache (second fastest)
  const sessionCached = sessionImageCache.getItem(cacheKey);
  if (sessionCached) {
    try {
      const blob = await base64ToBlob(sessionCached);
      manageCacheSize(cacheKey);
      return blob;
    } catch (error) {
      console.warn('Failed to use session cached image:', error);
    }
  }
  
  // Then check global cache (localStorage)
  const globalCached = getFromGlobalCache(cacheKey);
  if (globalCached) {
    try {
      const blob = await base64ToBlob(globalCached);
      manageCacheSize(cacheKey);
      return blob;
    } catch (error) {
      console.warn('Failed to use globally cached image:', error);
    }
  }
  
  // Return the cached fetch promise if available
  if (fetchCache.has(cacheKey)) {
    manageCacheSize(cacheKey);
    return fetchCache.get(cacheKey);
  }
  
  // Create a new fetch promise and cache it
  const fetchPromise = fetchGenericImage(url, cacheKey, onProgress);
  fetchCache.set(cacheKey, fetchPromise);
  manageCacheSize(cacheKey);
  
  return fetchPromise;
}

/**
 * Preload HD images silently in the background to improve download performance
 * @param images Array of images to preload
 * @param count Number of images to preload (default: 3)
 */
export async function preloadHDImages(images: { url: string }[], count = 3): Promise<void> {
  const hdUrls = images.slice(0, count).map(img => {
    // Transform to HD URL if needed
    if (img.url.includes('/JPG/')) {
      return img.url.replace('/JPG/', '/');
    }
    return img.url;
  });
  
  // Preload silently in background without blocking
  hdUrls.forEach(url => {
    fetchImageAsBlob(url).catch(() => {
      // Silent fail - preloading is optional
    });
  });
}
