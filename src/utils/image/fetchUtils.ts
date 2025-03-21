
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';

// Upgraded cache system for image responses
// Using a Map for storing the promises of image downloads
const fetchCache = new Map<string, Promise<Blob | null>>();

// Secondary cache for processed URLs after transformation
const processedUrlCache = new Map<string, string>();

// Cache for storing actual blob data as base64 strings, persisting across page loads
const sessionImageCache = (() => {
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
      setItem: (key: string, value: string): void => memoryCache.set(key, value),
      removeItem: (key: string): void => memoryCache.delete(key)
    };
  }
})();

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 300; // Increased for better performance

// For tracking usage order of cache entries (LRU - Least Recently Used)
let cacheUsageOrder: string[] = [];

/**
 * Checks if a blob is likely HTML content and not an image
 */
export function isHtmlContent(blob: Blob): boolean {
  // Check MIME type
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Small files are likely error pages
  if (blob.size < 1000) {
    return true;
  }
  
  return false;
}

/**
 * Manages cache size using LRU (Least Recently Used) policy
 * Removes least recently used entries when cache exceeds maximum size
 */
function manageCacheSize(url: string): void {
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

/**
 * Generates a cache key that includes essential URL parameters
 * to avoid duplicates in the cache
 */
function generateCacheKey(url: string): string {
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
 * Converts a Blob to base64 string for storage
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 string back to a Blob
 */
function base64ToBlob(base64: string): Promise<Blob> {
  return fetch(base64).then(res => res.blob());
}

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
 * Determines if an image URL is already in the browser cache
 */
function isImageInBrowserCache(url: string): Promise<boolean> {
  return new Promise(resolve => {
    // Check if the image is in the browser cache using performance method
    const img = new Image();
    let isCached = false;
    
    // Image loads quickly if it's in cache
    img.onload = () => {
      // Check loading time - less than 20ms suggests loading from cache
      resolve(isCached);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    // Start checking time after setting src
    img.src = url;
    // Use current time to check loading speed
    const startTime = performance.now();
    
    // After a short time, check if the image is fully loaded
    setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        const loadTime = performance.now() - startTime;
        isCached = loadTime < 20; // Considered cached if loaded in less than 20ms
      }
    }, 10);
  });
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
