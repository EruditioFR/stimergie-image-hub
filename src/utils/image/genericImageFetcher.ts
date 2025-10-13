
/**
 * Generic image fetcher for non-Stimergie sources
 */

import { blobToBase64, isHtmlContent } from './blobUtils';
import { sessionImageCache, processedUrlCache, generateCacheKey, manageCacheSize } from './cacheManager';
import { getFromGlobalCache, saveToGlobalCache } from './globalCache';

// Timeout value
const FETCH_TIMEOUT = 8000; // 8 seconds

/**
 * Internal implementation of image download with improved performance
 * For non-Stimergie images
 * @param url - The URL of the image to fetch
 * @param cacheKey - Cache key for storage
 * @param onProgress - Optional callback for download progress
 */
export async function fetchGenericImage(
  url: string, 
  cacheKey: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob | null> {
  let timeoutId: number | null = null;
  
  try {
    // Check for cached processed URL
    if (processedUrlCache.has(cacheKey)) {
      url = processedUrlCache.get(cacheKey)!;
    }
    
    // Setup fetch with timeout
    const controller = new AbortController();
    timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    // Try fetch with smart retries - sans délai
    let fetchAttempts = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (fetchAttempts < maxAttempts) {
      try {
        fetchAttempts++;
        
        const fetchOptions: RequestInit = {
          method: 'GET',
          mode: fetchAttempts === 3 ? 'no-cors' : 'cors',
          credentials: 'omit',
          cache: 'force-cache',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'Accept': 'image/*, */*;q=0.8',
            'Cache-Control': 'max-age=31536000',
          }
        };
        
        const response = await fetch(url, fetchOptions);
        
        // For no-cors mode, we can't check status
        if (fetchAttempts === 3 && response.type === 'opaque') {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          const blob = await response.blob();
          if (blob.size > 0) {
            if (onProgress) {
              onProgress(blob.size, blob.size);
            }
            const base64Data = await blobToBase64(blob);
            sessionImageCache.setItem(cacheKey, base64Data);
            saveToGlobalCache(cacheKey, base64Data);
            return blob;
          }
          throw new Error("Empty blob from opaque response");
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Check for HTML response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`HTML response detected: ${contentType}`);
        }
        
        // Use streaming with progress if callback is provided
        let blob: Blob;
        if (onProgress) {
          const contentLength = parseInt(response.headers.get('content-length') || '0');
          const reader = response.body?.getReader();
          
          if (reader && contentLength > 0) {
            let receivedLength = 0;
            const chunks: BlobPart[] = [];
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              if (value) {
                chunks.push(value);
                receivedLength += value.length;
                onProgress(receivedLength, contentLength);
              }
            }
            
            blob = new Blob(chunks, { type: contentType || 'image/jpeg' });
          } else {
            blob = await response.blob();
            if (contentLength > 0) {
              onProgress(blob.size, contentLength);
            }
          }
        } else {
          blob = await response.blob();
        }
        
        if (blob.size === 0) {
          throw new Error("Empty download blob");
        }
        
        if (isHtmlContent(blob)) {
          throw new Error("Response is HTML not an image");
        }
        
        // Store in caches
        const base64Data = await blobToBase64(blob);
        sessionImageCache.setItem(cacheKey, base64Data);
        saveToGlobalCache(cacheKey, base64Data);
        
        // Store in Cache API
        try {
          if ('caches' in window) {
            const cache = await caches.open('images-cache-v1');
            const cachedResponse = new Response(blob.slice(0), {
              headers: new Headers({
                'Content-Type': blob.type,
                'Cache-Control': 'max-age=31536000',
                'Access-Control-Allow-Origin': '*',
              })
            });
            await cache.put(url, cachedResponse);
          }
        } catch (e) {
          console.warn("Cache API storage failed:", e);
        }
        
        return blob;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${fetchAttempts} failed:`, error);
      }
    }
    
    console.error("All download attempts failed:", lastError);
    return null;
  } catch (error) {
    console.error("Error during download:", error);
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
