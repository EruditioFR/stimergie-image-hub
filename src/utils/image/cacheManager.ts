
// Cache manager for image fetching system

// Memory cache for image promises
export const fetchCache = new Map<string, Promise<Blob | null>>();

// Secondary cache for processed URLs after transformation
export const processedUrlCache = new Map<string, string>();

// For tracking usage order of cache entries (LRU - Least Recently Used)
let cacheUsageOrder: string[] = [];

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 500; // Augmenté pour un cache plus persistant

// Shared application-wide cache - persiste entre les sessions utilisateurs
// S'active lorsque le site est ouvert dans plusieurs onglets ou que plusieurs utilisateurs partagent un ordinateur
let appWideCache: Record<string, string> = {};

// Tentative d'utilisation de SharedWorker pour le partage entre utilisateurs si disponible
try {
  if (typeof SharedWorker !== 'undefined') {
    // Tentative d'activation du cache partagé entre utilisateurs
    const initSharedCache = () => {
      const blob = new Blob([`
        let sharedCache = {};
        
        onconnect = function(e) {
          const port = e.ports[0];
          
          port.onmessage = function(e) {
            const { action, key, value } = e.data;
            
            if (action === 'set') {
              sharedCache[key] = value;
              port.postMessage({ result: 'set', key });
            }
            else if (action === 'get') {
              port.postMessage({ result: 'get', key, value: sharedCache[key] });
            }
            else if (action === 'getAll') {
              port.postMessage({ result: 'getAll', cache: sharedCache });
            }
            else if (action === 'clear') {
              sharedCache = {};
              port.postMessage({ result: 'clear', success: true });
            }
          };
          
          // Synchroniser le cache existant lors de la connexion
          port.postMessage({ result: 'getAll', cache: sharedCache });
        };
      `], { type: 'application/javascript' });
      
      const worker = new SharedWorker(URL.createObjectURL(blob));
      
      worker.port.onmessage = (e) => {
        if (e.data.result === 'getAll') {
          appWideCache = e.data.cache || {};
        }
      };
      
      worker.port.start();
      
      // Obtenir le cache initial
      worker.port.postMessage({ action: 'getAll' });
      
      return worker;
    };
    
    // Initialiser et stocker le worker
    try {
      const worker = initSharedCache();
      console.log("Cache partagé entre utilisateurs activé");
      
      // Ajouter une méthode pour partager des entrées de cache
      (window as any).__shareImageCache = (key: string, value: string) => {
        worker.port.postMessage({ action: 'set', key, value });
      };
      
      // Ajouter une méthode pour vider le cache partagé
      (window as any).__clearSharedImageCache = () => {
        worker.port.postMessage({ action: 'clear' });
      };
    } catch (e) {
      console.warn("Impossible d'initialiser le cache partagé", e);
    }
  }
} catch (e) {
  console.warn("SharedWorker non disponible pour le partage de cache", e);
}

// Cache for storing actual blob data as base64 strings, persisting across page loads
export const sessionImageCache = (() => {
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
          
          // Partager avec le cache entre utilisateurs si disponible
          if ((window as any).__shareImageCache) {
            try {
              (window as any).__shareImageCache(`img_cache_${key}`, value);
            } catch (e) {
              console.warn("Erreur lors du partage du cache", e);
            }
          }
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
      },
      clear: (): void => {
        try {
          // Clear only image cache items
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('img_cache_')) {
              keysToRemove.push(key);
            }
          }
          
          for (const key of keysToRemove) {
            sessionStorage.removeItem(key);
          }
          
          console.log(`Cleared ${keysToRemove.length} items from session storage`);
        } catch (e) {
          console.warn('Failed to clear session storage:', e);
        }
      }
    };
  } catch (e) {
    // Provide a fallback if sessionStorage is not available
    console.warn('Session storage not available, using in-memory cache instead');
    const memoryCache = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memoryCache.get(key) || null,
      setItem: (key: string, value: string): void => { memoryCache.set(key, value); },
      removeItem: (key: string): void => { memoryCache.delete(key); },
      clear: (): void => { memoryCache.clear(); }
    };
  }
})();

/**
 * Generates a cache key that includes essential URL parameters
 * to avoid duplicates in the cache
 */
export function generateCacheKey(url: string): string {
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
 * Manages cache size using LRU (Least Recently Used) policy
 * Removes least recently used entries when cache exceeds maximum size
 */
export function manageCacheSize(url: string): void {
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
 * Clears all cache stores (memory, session, browser cache)
 */
export function clearAllCaches(): void {
  console.log('Clearing all image caches...');
  
  // Clear in-memory caches
  fetchCache.clear();
  processedUrlCache.clear();
  cacheUsageOrder = [];
  
  // Clear session storage cache
  sessionImageCache.clear();
  
  // Clear shared cache if available
  if ((window as any).__clearSharedImageCache) {
    try {
      (window as any).__clearSharedImageCache();
      console.log('Shared cache cleared');
    } catch (e) {
      console.warn('Failed to clear shared cache:', e);
    }
  }
  
  // Try to clear Cache API cache
  if ('caches' in window) {
    try {
      caches.delete('images-cache-v1').then(success => {
        console.log('Browser Cache API cache cleared:', success);
      });
    } catch (e) {
      console.warn('Failed to clear Cache API cache:', e);
    }
  }
  
  // Clear localStorage image cache
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('global_img_cache_')) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    console.log(`Cleared ${keysToRemove.length} items from localStorage`);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

// Vérifier si le Service Worker API est disponible
export const initServiceWorkerCache = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('ServiceWorker enregistré avec succès:', registration.scope);
      } catch (e) {
        console.warn('Échec de l\'enregistrement du ServiceWorker:', e);
      }
    });
  }
};

// Tenter d'activer le ServiceWorker pour le cache persistant
try {
  initServiceWorkerCache();
} catch (e) {
  console.warn("ServiceWorker non pris en charge:", e);
}
