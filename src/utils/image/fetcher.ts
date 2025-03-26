
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';
import { blobToBase64, base64ToBlob, isHtmlContent, isImageInBrowserCache } from './blobUtils';
import { 
  fetchCache, 
  processedUrlCache, 
  sessionImageCache, 
  generateCacheKey, 
  manageCacheSize,
  initServiceWorkerCache
} from './cacheManager';

// Cache partagé entre tous les utilisateurs (localStorage)
const GLOBAL_CACHE_PREFIX = 'global_img_cache_';
const GLOBAL_CACHE_MAX_SIZE = 1024 * 1024 * 5; // 5MB max per image for global cache

// Valeurs de timeout optimisées
const FETCH_TIMEOUT = 8000; // 8 secondes
// Le RETRY_DELAY a été supprimé pour éviter les délais

// S'assurer que le Service Worker est enregistré
initServiceWorkerCache();

/**
 * Tente de récupérer une image depuis le cache global (localStorage)
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
 */
function saveToGlobalCache(cacheKey: string, base64Data: string): void {
  try {
    // Vérifier la taille de l'image
    if (base64Data.length > GLOBAL_CACHE_MAX_SIZE) {
      return;
    }
    
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
  const fetchPromise = fetchImageAsBlobInternal(url, cacheKey);
  fetchCache.set(cacheKey, fetchPromise);
  manageCacheSize(cacheKey);
  
  return fetchPromise;
}

/**
 * Internal implementation of image download with improved performance
 */
async function fetchImageAsBlobInternal(url: string, cacheKey: string): Promise<Blob | null> {
  let timeoutId: number | null = null;
  
  try {
    // Check for cached processed URL
    if (processedUrlCache.has(cacheKey)) {
      url = processedUrlCache.get(cacheKey)!;
    }
    
    // Process URL for different sources
    let fetchUrl;
    
    // Process Dropbox URLs
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      fetchUrl = getProxiedUrl(directDownloadUrl);
    } 
    // Force proxy for problematic domains
    else if (url.includes('stimergie.fr')) {
      fetchUrl = getProxiedUrl(url, true); // forcer l'utilisation du proxy
    } 
    // For other URLs
    else {
      fetchUrl = url.startsWith('http') && !url.includes(window.location.hostname) 
        ? getProxiedUrl(url) 
        : url;
    }
    
    // Cache the processed URL
    processedUrlCache.set(cacheKey, fetchUrl);
    
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
        
        // Adjust URL strategy based on attempt number
        let attemptUrl = fetchUrl;
        if (fetchAttempts === 2) {
          // On second attempt, try alternative proxy
          attemptUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        } else if (fetchAttempts === 3) {
          // On third attempt, try another alternative
          attemptUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        }
        
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
        
        const response = await fetch(attemptUrl, fetchOptions);
        
        // For no-cors mode, we can't check status
        if (fetchAttempts === 3 && response.type === 'opaque') {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          const blob = await response.blob();
          if (blob.size > 0) {
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
        
        const blob = await response.blob();
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
            await cache.put(fetchUrl, cachedResponse);
          }
        } catch (e) {
          console.warn("Cache API storage failed:", e);
        }
        
        return blob;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${fetchAttempts} failed:`, error);
        
        // Pas de délai entre les tentatives pour accélérer le processus
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
