
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';

// Cache for image fetch responses
const fetchCache = new Map<string, Promise<Blob | null>>();

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
 * Downloads an image from any source with caching
 */
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  // Return cached response if available
  if (fetchCache.has(url)) {
    return fetchCache.get(url);
  }
  
  // Create a fetch promise and store it in cache before awaiting the result
  const fetchPromise = fetchImageAsBlobInternal(url);
  fetchCache.set(url, fetchPromise);
  
  // Return the cached promise
  return fetchPromise;
}

/**
 * Internal implementation of image fetching
 */
async function fetchImageAsBlobInternal(url: string): Promise<Blob | null> {
  try {
    console.log(`Downloading: ${url}`);
    
    let fetchUrl;
    
    // Handle Dropbox URLs differently
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      console.log(`Dropbox URL converted to direct URL: ${directDownloadUrl}`);
      fetchUrl = getProxiedUrl(directDownloadUrl);
    } else {
      fetchUrl = getProxiedUrl(url);
    }
    
    // Set up fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Shorter timeout: 15 seconds
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache', // Try to use HTTP cache when possible
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*, */*;q=0.8',
        'Cache-Control': 'max-age=86400', // 24-hour cache
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
    
    // Check if response is potentially HTML (error page) and not an image
    if (isHtmlContent(blob)) {
      console.error("Response seems to be an HTML page and not an image");
      return null;
    }
    
    console.log(`Image downloaded successfully, type: ${blob.type}, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error("Error during download:", error);
    return null;
  }
}
