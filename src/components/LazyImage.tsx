
import { useState, useEffect, useRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { generateCacheKey as getImageCacheKey } from '@/utils/image/cacheManager';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: string;
  priority?: boolean;
  style?: CSSProperties;
}

// Cache global persistant entre les sessions
const PERSISTENT_CACHE_PREFIX = 'persistent_img_';

// Enhanced global cache for faster loading of previously viewed images
const imageCache = new Map<string, string>();

// Cache to track requested images to avoid duplicates
const requestedImagesCache = new Set<string>();

// Vérifie si le navigateur prend en charge le stockage persistant
const isPersistentStorageAvailable = async (): Promise<boolean> => {
  try {
    if (!navigator.storage || !navigator.storage.persist) return false;
    
    let isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      // Demander la permission de stockage persistant
      isPersisted = await navigator.storage.persist();
    }
    
    return isPersisted;
  } catch (e) {
    console.warn('Erreur lors de la vérification du stockage persistant:', e);
    return false;
  }
};

// Essayer d'activer le stockage persistant au chargement
(async () => {
  try {
    const isPersistent = await isPersistentStorageAvailable();
    console.log(`Stockage persistant ${isPersistent ? 'activé' : 'non disponible'}`);
  } catch (e) {
    console.warn('Erreur lors de l\'activation du stockage persistant:', e);
  }
})();

// Enhanced session-persistent cache to retain images across page navigations
const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          // Vérifier d'abord dans le localStorage (persistant)
          const persisted = localStorage.getItem(`${PERSISTENT_CACHE_PREFIX}${key}`);
          if (persisted) return persisted;
          
          // Sinon vérifier dans le sessionStorage
          return sessionStorage.getItem(`lazy_img_${key}`);
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          // Stocker dans le sessionStorage
          sessionStorage.setItem(`lazy_img_${key}`, value);
          
          // Tenter de stocker dans le localStorage pour persistance
          try {
            localStorage.setItem(`${PERSISTENT_CACHE_PREFIX}${key}`, value);
          } catch (persistError) {
            // Si le localStorage est plein, nettoyer pour libérer de l'espace
            try {
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey.startsWith(PERSISTENT_CACHE_PREFIX)) {
                  keysToRemove.push(storageKey);
                }
              }
              
              const removeCount = Math.ceil(keysToRemove.length * 0.2);
              keysToRemove.slice(0, removeCount).forEach(k => localStorage.removeItem(k));
              
              // Réessayer
              localStorage.setItem(`${PERSISTENT_CACHE_PREFIX}${key}`, value);
            } catch (clearError) {
              console.warn('Impossible de libérer le stockage persistant:', clearError);
            }
          }
        } catch (e) {
          // Storage full - clear some older entries
          try {
            // Find keys to remove (oldest 20%)
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const storageKey = sessionStorage.key(i);
              if (storageKey && storageKey.startsWith('lazy_img_')) {
                keysToRemove.push(storageKey);
              }
            }
            
            const removeCount = Math.ceil(keysToRemove.length * 0.2);
            keysToRemove.slice(0, removeCount).forEach(k => sessionStorage.removeItem(k));
            
            // Try again
            sessionStorage.setItem(`lazy_img_${key}`, value);
          } catch (clearError) {
            console.warn('Could not clear session storage:', clearError);
          }
        }
      }
    };
  } catch (e) {
    // Fallback to memory cache if sessionStorage is not available
    const memoryFallback = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memoryFallback.get(key) || null,
      setItem: (key: string, value: string): void => { memoryFallback.set(key, value); }
    };
  }
})();

// Fonction auxiliaire pour vérifier si une image est déjà en cache dans le navigateur
const isImageCached = async (src: string): Promise<boolean> => {
  // Vérifier d'abord dans le cache d'application
  if ('caches' in window) {
    try {
      const cache = await caches.open('images-cache-v1');
      const match = await cache.match(src);
      if (match) return true;
    } catch (e) {
      console.warn('Erreur lors de la vérification du cache d\'application:', e);
    }
  }
  
  // Vérifier dans les caches de session et persistant
  const cacheKey = getImageCacheKey(src);
  if (sessionImageCache.getItem(cacheKey)) return true;
  
  // Vérifier dans les caches mémoire
  if (imageCache.has(src)) return true;
  
  // Vérifier dans le cache HTTP du navigateur avec une requête HEAD
  try {
    const response = await fetch(src, {
      method: 'HEAD',
      cache: 'only-if-cached',
      mode: 'no-cors'
    });
    return response.status === 200;
  } catch (e) {
    // Une erreur signifie généralement que l'image n'est pas en cache
    return false;
  }
};

// Preload a batch of images for smoother experience
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  // Vérifier rapidement quelles images sont déjà en cache
  const checkCachedStatus = async () => {
    const checks = await Promise.all(
      urls.map(async url => {
        const isCached = await isImageCached(url);
        return { url, isCached };
      })
    );
    
    const urlsToLoad = checks
      .filter(({ url, isCached }) => !isCached && !requestedImagesCache.has(url))
      .map(({ url }) => url);
    
    if (urlsToLoad.length === 0) return;
    console.log(`Preloading ${urlsToLoad.length} new images`);
    
    // Process all remaining images with improved throttling
    const batchSize = 8; // Smaller batch size for more parallel loading
    let index = 0;
    
    const loadNextBatch = () => {
      const batch = urlsToLoad.slice(index, index + batchSize);
      if (batch.length === 0) return;
      
      batch.forEach(url => {
        if (!requestedImagesCache.has(url)) {
          requestedImagesCache.add(url);
          
          const img = new Image();
          img.onload = () => {
            imageCache.set(url, url);
            
            // Save to session cache
            const cacheKey = getImageCacheKey(url);
            sessionImageCache.setItem(cacheKey, url);
          };
          img.onerror = () => {
            console.warn(`Failed to preload: ${url}`);
          };
          img.src = url;
        }
      });
      
      index += batchSize;
      
      // Continue loading after a small delay
      if (index < urlsToLoad.length) {
        setTimeout(loadNextBatch, 100);
      }
    };
    
    loadNextBatch();
  };
  
  checkCachedStatus();
}

/**
 * Generates a normalized cache key for an image URL
 */
function generateCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Keep only essential parts
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (e) {
    return url;
  }
}

// Maintained for API compatibility
export function clearOffscreenImagesFromCache(visibleImageUrls: string[]): void {
  // We no longer clear images from cache for session persistence
  // Just maintain a reasonable cache size
  const MAX_CACHE_SIZE = 1000; // Increased for better retention
  
  if (imageCache.size > MAX_CACHE_SIZE) {
    // Only clear memory cache, not session cache
    const keysToDelete = Array.from(imageCache.keys()).slice(0, imageCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => {
      imageCache.delete(key);
      requestedImagesCache.delete(key);
    });
  }
}

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio,
  objectFit = "object-cover",
  priority = false,
  style
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Generate cache keys
  const cacheKey = src ? generateCacheKey(src) : '';
  
  // Check if image is already in cache on mount
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // First try session cache for persistence
    const sessionCached = sessionImageCache.getItem(cacheKey);
    if (sessionCached) {
      setCachedSrc(src);
      setLoadProgress(90);
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(100);
          setIsLoaded(true);
        }
      }, 10);
      return;
    }
    
    // Then try application memory cache
    if (imageCache.has(src)) {
      setCachedSrc(src);
      setLoadProgress(90);
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(100);
          setIsLoaded(true);
        }
      }, 10);
      return;
    }
    
    // Vérifier le cache du navigateur
    isImageCached(src).then(isCached => {
      if (isCached && !isUnmountedRef.current) {
        setCachedSrc(src);
        setLoadProgress(90);
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            setLoadProgress(100);
            setIsLoaded(true);
          }
        }, 10);
        return;
      }
      
      // Sinon commencer le chargement normal
      if (!isUnmountedRef.current) {
        // Start simulated progress immediately
        setLoadProgress(Math.floor(Math.random() * 30) + 20);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        progressIntervalRef.current = window.setInterval(() => {
          if (!isUnmountedRef.current) {
            setLoadProgress(prev => {
              // Accelerated progress simulation for better UX
              const increment = prev < 30 ? 10 : prev < 60 ? 5 : prev < 80 ? 3 : 1;
              const newProgress = prev + Math.random() * increment;
              return newProgress >= 90 ? 90 : newProgress;
            });
          }
        }, 80);
      }
    });
    
    // Clean up any interval on unmount
    return () => {
      isUnmountedRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Release objectURL if we created one
      if (cachedSrc && cachedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cachedSrc);
      }
    };
  }, [src, cachedSrc, cacheKey]);
  
  // Generate optimized low quality placeholder URL
  const getLowQualitySrc = (originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // For Unsplash, use their built-in resizing parameters
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
    }
    
    // For other sources, add size parameters
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=10&q=10`;
    }
    return `${originalSrc}?w=10&q=10`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Add image to global cache
    if (!imageCache.has(src) && e.currentTarget.src === src) {
      imageCache.set(src, src);
      
      // Save to session cache for persistence
      sessionImageCache.setItem(cacheKey, src);
    }
    
    // Complete loading
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setLoadProgress(100);
    if (!isUnmountedRef.current) {
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setIsLoaded(true);
        }
      }, 10);
    }
  };

  if (!src) return null;

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden relative", aspectRatio, className)}
    >
      {/* Low-resolution placeholder */}
      {!isLoaded && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-sm scale-105",
            objectFit,
            "opacity-100 transition-opacity duration-200"
          )}
          loading="eager"
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-1 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1" />
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgElRef}
        src={cachedSrc || src}
        alt={alt}
        className={cn(
          "lazy-image-actual w-full h-full transition-opacity duration-200",
          objectFit,
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={style}
        onLoad={handleImageLoad}
        loading="eager" // For immediate loading
        decoding="async"
      />
    </div>
  );
}

export function LazyImageWithPriority(props: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use effect to set the fetchpriority attribute directly on the DOM element
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.setAttribute('fetchpriority', 'high');
    }
  }, []);
  
  // Pass the ref to the LazyImage
  const { ref, ...restProps } = props as any;
  return <LazyImage {...restProps} />;
}

export default LazyImage;
