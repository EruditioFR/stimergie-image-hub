
/**
 * Specialized fetcher for Stimergie server images
 */

import { blobToBase64, isHtmlContent } from './blobUtils';
import { sessionImageCache, generateCacheKey, manageCacheSize } from './cacheManager';
import { getFromGlobalCache, saveToGlobalCache } from './globalCache';

// Timeout value for Stimergie image requests
const FETCH_TIMEOUT = 8000; // 8 seconds

/**
 * Optimized direct fetching function for Stimergie images without proxies
 * @param url - The URL of the image to fetch
 * @param cacheKey - Cache key for storage
 * @param onProgress - Optional callback for download progress
 */
export async function fetchImageFromStimergieServer(
  url: string, 
  cacheKey: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob | null> {
  let timeoutId: number | null = null;
  
  try {
    // Setup fetch with timeout
    const controller = new AbortController();
    timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    // Mode 'no-cors' can help get around CORS issues but will result in an opaque response
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'cors', // Try cors first
      credentials: 'omit',
      cache: 'force-cache',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Accept': 'image/*, */*;q=0.8'
      }
    };
    
    // First attempt - direct with CORS
    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      // If CORS fails, try no-cors mode as a fallback
      console.warn('CORS request failed, trying no-cors:', error);
      const fallbackOptions: RequestInit = {
        ...fetchOptions,
        mode: 'no-cors' // This will give us an opaque response
      };
      response = await fetch(url, fallbackOptions);
    }
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // For opaque responses (from no-cors), we can't check status or headers
    if (response.type === 'opaque') {
      const blob = await response.blob();
      
      // Opaque responses don't allow us to check content type, so check blob size
      if (blob.size > 0) {
        if (onProgress) {
          onProgress(blob.size, blob.size);
        }
        
        const base64Data = await blobToBase64(blob);
        sessionImageCache.setItem(cacheKey, base64Data);
        saveToGlobalCache(cacheKey, base64Data);
        
        // Also try to add to cache API
        try {
          if ('caches' in window) {
            const cache = await caches.open('stimergie-images-cache-v1');
            const cachedResponse = new Response(blob.slice(0), {
              headers: new Headers({
                'Content-Type': blob.type || 'image/jpeg',
                'Cache-Control': 'max-age=31536000',
              })
            });
            await cache.put(url, cachedResponse);
          }
        } catch (e) {
          console.warn("Cache API storage failed:", e);
        }
        
        return blob;
      } else {
        throw new Error("Empty blob from opaque response");
      }
    }
    
    // For normal responses, we can check status
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
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
        const cache = await caches.open('stimergie-images-cache-v1');
        const cachedResponse = new Response(blob.slice(0), {
          headers: new Headers({
            'Content-Type': blob.type,
            'Cache-Control': 'max-age=31536000',
          })
        });
        await cache.put(url, cachedResponse);
      }
    } catch (e) {
      console.warn("Cache API storage failed:", e);
    }
    
    return blob;
  } catch (error) {
    console.error("Error directly fetching from Stimergie server:", error);
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
