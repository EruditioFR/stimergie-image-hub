
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';
import { blobToBase64, base64ToBlob, isHtmlContent, isImageInBrowserCache } from './blobUtils';
import { 
  fetchCache, 
  processedUrlCache, 
  sessionImageCache, 
  generateCacheKey, 
  manageCacheSize 
} from './cacheManager';

/**
 * Downloads an image from any source with caching
 */
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  // Generate a normalized cache key
  const cacheKey = generateCacheKey(url);
  
  // Check if image is in session cache first (persists across page loads)
  const sessionCached = sessionImageCache.getItem(cacheKey);
  if (sessionCached) {
    console.log(`Using session cached image: ${url}`);
    try {
      const blob = await base64ToBlob(sessionCached);
      manageCacheSize(cacheKey);
      return blob;
    } catch (error) {
      console.warn('Failed to use session cached image, fetching fresh copy:', error);
      // Continue to other caching mechanisms if there's an error
    }
  }
  
  // Return the cached response if available
  if (fetchCache.has(cacheKey)) {
    // Update cache usage order
    manageCacheSize(cacheKey);
    return fetchCache.get(cacheKey);
  }
  
  // Create a download promise and store it in the cache before awaiting the result
  const fetchPromise = fetchImageAsBlobInternal(url, cacheKey);
  fetchCache.set(cacheKey, fetchPromise);
  manageCacheSize(cacheKey);
  
  // Return the cached promise
  return fetchPromise;
}

/**
 * Internal implementation of image download
 */
async function fetchImageAsBlobInternal(url: string, cacheKey: string): Promise<Blob | null> {
  try {
    // Check if we already have a transformed URL for this URL
    if (processedUrlCache.has(cacheKey)) {
      const processedUrl = processedUrlCache.get(cacheKey)!;
      console.log(`Using processed URL from cache: ${processedUrl}`);
      url = processedUrl;
    } else {
      console.log(`Downloading: ${url}`);
    }
    
    let fetchUrl;
    
    // Process Dropbox URLs differently
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      console.log(`Dropbox URL converted to direct URL: ${directDownloadUrl}`);
      fetchUrl = getProxiedUrl(directDownloadUrl);
    } else {
      fetchUrl = getProxiedUrl(url);
    }
    
    // Store the transformed URL in the cache
    processedUrlCache.set(cacheKey, fetchUrl);
    
    // Check if the image is in the browser cache
    const isInBrowserCache = await isImageInBrowserCache(fetchUrl);
    if (isInBrowserCache) {
      console.log(`Image found in browser cache: ${url}`);
    }
    
    // Configure fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache', // Use HTTP cache when possible
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*, */*;q=0.8',
        'Cache-Control': 'max-age=604800', // Cache for one week
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error(`HTML response detected via headers: ${contentType}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Empty download blob");
      return null;
    }
    
    // Check if the response is potentially HTML (error page) and not an image
    if (isHtmlContent(blob)) {
      console.error("Response seems to be an HTML page and not an image");
      return null;
    }
    
    // Store the blob in session storage for persistence across page loads
    try {
      // Convert blob to base64 and store in session storage
      const base64Data = await blobToBase64(blob);
      sessionImageCache.setItem(cacheKey, base64Data);
      console.log(`Image stored in session cache: ${url}`);
    } catch (e) {
      console.warn("Failed to store image in session cache:", e);
    }
    
    // Also try to store in browser's Cache API if available
    try {
      if ('caches' in window) {
        const cache = await caches.open('images-cache-v1');
        const response = new Response(blob.slice(0), {
          headers: {
            'Content-Type': blob.type,
            'Cache-Control': 'max-age=604800', // Cache for one week
          }
        });
        cache.put(fetchUrl, response);
        console.log(`Image stored in application cache: ${url}`);
      }
    } catch (e) {
      console.warn("Failed to store image in application cache:", e);
    }
    
    console.log(`Image downloaded successfully, type: ${blob.type}, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error("Error during download:", error);
    return null;
  }
}
