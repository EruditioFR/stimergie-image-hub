
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';
import { blobToBase64, base64ToBlob, isHtmlContent, isImageInBrowserCache } from './blobUtils';
import { 
  fetchCache, 
  processedUrlCache, 
  sessionImageCache, 
  generateCacheKey, 
  manageCacheSize 
} from './cacheManager';

// Cache partagé entre tous les utilisateurs (localStorage)
const GLOBAL_CACHE_PREFIX = 'global_img_cache_';
const GLOBAL_CACHE_MAX_SIZE = 1024 * 1024 * 5; // 5MB max per image for global cache

/**
 * Tente de récupérer une image depuis le cache global (localStorage)
 * Ce cache est partagé entre tous les utilisateurs du même navigateur
 */
function getFromGlobalCache(cacheKey: string): string | null {
  try {
    return localStorage.getItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`);
  } catch (e) {
    console.warn('Erreur lors de l\'accès au cache global:', e);
    return null;
  }
}

/**
 * Tente de sauvegarder une image dans le cache global (localStorage)
 * avec vérification de la taille et nettoyage du cache si nécessaire
 */
function saveToGlobalCache(cacheKey: string, base64Data: string): void {
  try {
    // Vérifier la taille de l'image
    if (base64Data.length > GLOBAL_CACHE_MAX_SIZE) {
      console.log('Image trop grande pour le cache global');
      return;
    }
    
    // Tenter de sauvegarder
    try {
      localStorage.setItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`, base64Data);
    } catch (e) {
      // En cas d'erreur (cache plein), nettoyer le cache
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GLOBAL_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // Trier par ordre alphabétique (approximation simple pour LRU)
      keysToRemove.sort();
      
      // Supprimer les 20% les plus anciens
      const removeCount = Math.ceil(keysToRemove.length * 0.2);
      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(keysToRemove[i]);
      }
      
      // Réessayer après le nettoyage
      try {
        localStorage.setItem(`${GLOBAL_CACHE_PREFIX}${cacheKey}`, base64Data);
      } catch (retryError) {
        console.warn('Impossible de stocker dans le cache global même après nettoyage:', retryError);
      }
    }
  } catch (e) {
    console.warn('Erreur lors de l\'enregistrement dans le cache global:', e);
  }
}

/**
 * Downloads an image from any source with improved caching strategy
 */
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  // Generate a normalized cache key
  const cacheKey = generateCacheKey(url);
  
  // 1. Check if image is in global cache first (shared between all users)
  const globalCached = getFromGlobalCache(cacheKey);
  if (globalCached) {
    console.log(`Using globally cached image: ${url} (shared between users)`);
    try {
      const blob = await base64ToBlob(globalCached);
      manageCacheSize(cacheKey);
      return blob;
    } catch (error) {
      console.warn('Failed to use globally cached image, fetching fresh copy:', error);
    }
  }
  
  // 2. Check if image is in session cache (persists across page loads)
  const sessionCached = sessionImageCache.getItem(cacheKey);
  if (sessionCached) {
    console.log(`Using session cached image: ${url}`);
    try {
      const blob = await base64ToBlob(sessionCached);
      manageCacheSize(cacheKey);
      return blob;
    } catch (error) {
      console.warn('Failed to use session cached image, fetching fresh copy:', error);
    }
  }
  
  // 3. Return the cached fetch promise if available
  if (fetchCache.has(cacheKey)) {
    // Update cache usage order
    manageCacheSize(cacheKey);
    return fetchCache.get(cacheKey);
  }
  
  // 4. Create a download promise and store it in the cache before awaiting the result
  const fetchPromise = fetchImageAsBlobInternal(url, cacheKey);
  fetchCache.set(cacheKey, fetchPromise);
  manageCacheSize(cacheKey);
  
  // Return the cached promise
  return fetchPromise;
}

/**
 * Internal implementation of image download with improved caching
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
    
    // Force proxy for problematic domains
    let fetchUrl;
    
    // Process Dropbox URLs differently
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      console.log(`Dropbox URL converted to direct URL: ${directDownloadUrl}`);
      fetchUrl = getProxiedUrl(directDownloadUrl);
    } 
    // Force proxy for stimergie.fr domains
    else if (url.includes('stimergie.fr')) {
      fetchUrl = getProxiedUrl(url);
    } 
    // For other URLs, use the proxy only if needed
    else {
      fetchUrl = url.startsWith('http') && !url.includes(window.location.hostname) 
        ? getProxiedUrl(url) 
        : url;
    }
    
    // Store the transformed URL in the cache
    processedUrlCache.set(cacheKey, fetchUrl);
    
    // Check if the image is in the browser cache
    const isInBrowserCache = await isImageInBrowserCache(fetchUrl);
    if (isInBrowserCache) {
      console.log(`Image found in browser cache: ${url}`);
    }
    
    // Configure fetch with improved options
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    // Use improved cache strategy with Cache API if available
    if ('caches' in window) {
      try {
        const cache = await caches.open('images-cache-v1');
        const cachedResponse = await cache.match(fetchUrl);
        
        if (cachedResponse && cachedResponse.ok) {
          console.log(`Using cached response from Cache API: ${url}`);
          clearTimeout(timeoutId);
          
          const blob = await cachedResponse.blob();
          if (blob.size > 0 && !isHtmlContent(blob)) {
            // Store in session cache for faster future access
            const base64Data = await blobToBase64(blob);
            sessionImageCache.setItem(cacheKey, base64Data);
            
            // Also store in global cache for sharing between users
            saveToGlobalCache(cacheKey, base64Data);
            
            return blob;
          }
        }
      } catch (e) {
        console.warn('Error using Cache API:', e);
      }
    }
    
    let fetchAttempts = 0;
    let maxAttempts = 3;
    let lastError;
    
    // Retry strategy for failed fetches
    while (fetchAttempts < maxAttempts) {
      try {
        fetchAttempts++;
        
        // Adjust URL based on attempt number
        let attemptUrl = fetchUrl;
        if (fetchAttempts > 1) {
          // On second attempt, try with a different proxy
          if (fetchAttempts === 2 && url.includes('stimergie.fr')) {
            attemptUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            console.log(`Retry #${fetchAttempts} with different proxy: ${attemptUrl}`);
          }
          // On third attempt, try with no-cors mode
          else if (fetchAttempts === 3) {
            console.log(`Final attempt with no-cors mode: ${fetchUrl}`);
          }
        }
        
        const response = await fetch(attemptUrl, {
          method: 'GET',
          mode: fetchAttempts === 3 ? 'no-cors' : 'cors',
          credentials: 'omit',
          cache: 'force-cache', // Force using HTTP cache when possible
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*, */*;q=0.8',
            'Cache-Control': 'max-age=31536000', // Cache for one year
            'Pragma': 'no-cache'
          }
        });
        
        // For no-cors mode, we can't actually check if it was successful,
        // but we can try to use the opaque response
        if (fetchAttempts === 3 && response.type === 'opaque') {
          // Create a simple success response since we can't actually see the content
          clearTimeout(timeoutId);
          
          try {
            const blob = await response.blob();
            if (blob.size > 0) {
              // We got something, store it and hope it's an image
              const base64Data = await blobToBase64(blob);
              sessionImageCache.setItem(cacheKey, base64Data);
              saveToGlobalCache(cacheKey, base64Data);
              
              console.log(`Opaque response blob size: ${blob.size}`);
              return blob;
            }
          } catch (e) {
            console.warn('Error processing opaque response:', e);
            continue;
          }
        }
        
        if (!response.ok) {
          lastError = new Error(`HTTP error: ${response.status} ${response.statusText}`);
          console.warn(`Attempt ${fetchAttempts} failed: ${lastError.message}`);
          continue;
        }
        
        clearTimeout(timeoutId);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          lastError = new Error(`HTML response detected via headers: ${contentType}`);
          console.warn(`Attempt ${fetchAttempts} failed: ${lastError.message}`);
          continue;
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          lastError = new Error("Empty download blob");
          console.warn(`Attempt ${fetchAttempts} failed: ${lastError.message}`);
          continue;
        }
        
        // Check if the response is potentially HTML (error page) and not an image
        if (isHtmlContent(blob)) {
          lastError = new Error("Response seems to be an HTML page and not an image");
          console.warn(`Attempt ${fetchAttempts} failed: ${lastError.message}`);
          continue;
        }
        
        // Store the blob in session storage for persistence across page loads
        try {
          // Convert blob to base64 and store in session storage
          const base64Data = await blobToBase64(blob);
          sessionImageCache.setItem(cacheKey, base64Data);
          
          // Also store in global cache for sharing between users
          saveToGlobalCache(cacheKey, base64Data);
          
          console.log(`Image stored in cache: ${url}`);
        } catch (e) {
          console.warn("Failed to store image in session cache:", e);
        }
        
        // Store in browser's Cache API if available
        try {
          if ('caches' in window) {
            const cache = await caches.open('images-cache-v1');
            
            // Create a response with proper cache headers
            const headers = new Headers({
              'Content-Type': blob.type,
              'Cache-Control': 'max-age=31536000, immutable', // Cache for one year
              'Access-Control-Allow-Origin': '*',
            });
            
            const cachedResponse = new Response(blob.slice(0), {
              headers: headers
            });
            
            await cache.put(fetchUrl, cachedResponse);
            console.log(`Image stored in application cache: ${url}`);
          }
        } catch (e) {
          console.warn("Failed to store image in application cache:", e);
        }
        
        console.log(`Image downloaded successfully, type: ${blob.type}, size: ${blob.size} bytes`);
        return blob;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${fetchAttempts} failed:`, error);
      }
    }
    
    // All attempts failed
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
