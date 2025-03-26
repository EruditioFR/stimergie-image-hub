
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
const PRELOAD_BATCH_SIZE = 6; // Reduced batch size for faster loading

// Performance optimized global memory cache
const imageCache = new Map<string, string>();
const requestedImagesCache = new Set<string>();

// Verify persistent storage availability
const isPersistentStorageAvailable = async (): Promise<boolean> => {
  try {
    if (!navigator.storage || !navigator.storage.persist) return false;
    let isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      isPersisted = await navigator.storage.persist();
    }
    return isPersisted;
  } catch (e) {
    return false;
  }
};

// Try to enable persistent storage
(async () => {
  try {
    await isPersistentStorageAvailable();
  } catch (e) {
    console.warn('Storage persistence activation failed:', e);
  }
})();

// Enhanced session-persistent cache
const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          // Check localStorage first (persistent)
          const persisted = localStorage.getItem(`${PERSISTENT_CACHE_PREFIX}${key}`);
          if (persisted) return persisted;
          
          // Then check sessionStorage
          return sessionStorage.getItem(`lazy_img_${key}`);
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          // Store in sessionStorage
          sessionStorage.setItem(`lazy_img_${key}`, value);
          
          // Try to store in localStorage for persistence
          try {
            localStorage.setItem(`${PERSISTENT_CACHE_PREFIX}${key}`, value);
          } catch (persistError) {
            // Clear space if localStorage is full
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
              
              localStorage.setItem(`${PERSISTENT_CACHE_PREFIX}${key}`, value);
            } catch (e) {
              console.warn('Failed to clear persistent storage:', e);
            }
          }
        } catch (e) {
          // Storage full - clear older entries
          try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const storageKey = sessionStorage.key(i);
              if (storageKey && storageKey.startsWith('lazy_img_')) {
                keysToRemove.push(storageKey);
              }
            }
            
            const removeCount = Math.ceil(keysToRemove.length * 0.2);
            keysToRemove.slice(0, removeCount).forEach(k => sessionStorage.removeItem(k));
            
            sessionStorage.setItem(`lazy_img_${key}`, value);
          } catch (e) {
            console.warn('Could not clear session storage:', e);
          }
        }
      }
    };
  } catch (e) {
    // Fallback to memory cache
    const memoryFallback = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memoryFallback.get(key) || null,
      setItem: (key: string, value: string): void => { memoryFallback.set(key, value); }
    };
  }
})();

// Check if image is in any cache
const isImageCached = async (src: string): Promise<boolean> => {
  // Check application cache
  if ('caches' in window) {
    try {
      const cache = await caches.open('images-cache-v1');
      const match = await cache.match(src);
      if (match) return true;
    } catch (e) {
      console.warn('Application cache check failed:', e);
    }
  }
  
  // Check session/persistent cache
  const cacheKey = getImageCacheKey(src);
  if (sessionImageCache.getItem(cacheKey)) return true;
  
  // Check memory cache
  if (imageCache.has(src)) return true;
  
  // Check browser HTTP cache
  try {
    const response = await fetch(src, {
      method: 'HEAD',
      cache: 'only-if-cached',
      mode: 'no-cors'
    });
    return response.status === 200;
  } catch (e) {
    return false;
  }
};

// Optimized image preloading function
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  const preloadBatch = async () => {
    // Check which images need preloading
    const checks = await Promise.all(
      urls.map(async url => ({
        url,
        isCached: await isImageCached(url)
      }))
    );
    
    const urlsToLoad = checks
      .filter(({ url, isCached }) => !isCached && !requestedImagesCache.has(url))
      .map(({ url }) => url);
    
    if (urlsToLoad.length === 0) return;
    
    // Use smaller batches for better parallelization
    const loadNextBatch = (startIndex: number) => {
      const batch = urlsToLoad.slice(startIndex, startIndex + PRELOAD_BATCH_SIZE);
      if (batch.length === 0) return;
      
      batch.forEach(url => {
        if (!requestedImagesCache.has(url)) {
          requestedImagesCache.add(url);
          
          const img = new Image();
          img.onload = () => {
            imageCache.set(url, url);
            const cacheKey = getImageCacheKey(url);
            sessionImageCache.setItem(cacheKey, url);
          };
          img.src = url;
        }
      });
      
      // Continue with next batch after delay
      if (startIndex + PRELOAD_BATCH_SIZE < urlsToLoad.length) {
        setTimeout(() => loadNextBatch(startIndex + PRELOAD_BATCH_SIZE), 100);
      }
    };
    
    loadNextBatch(0);
  };
  
  preloadBatch();
}

// Generate cache key
function generateCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (e) {
    return url;
  }
}

// Maintained for API compatibility
export function clearOffscreenImagesFromCache(): void {
  // We no longer clear images actively
  const MAX_CACHE_SIZE = 1000;
  
  if (imageCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(imageCache.keys()).slice(0, imageCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => {
      imageCache.delete(key);
      requestedImagesCache.delete(key);
    });
  }
}

// Generate low quality placeholder URL
const getLowQualitySrc = (originalSrc: string): string => {
  if (!originalSrc) return '';
  
  if (originalSrc.includes('unsplash.com')) {
    return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
  }
  
  if (originalSrc.includes('?')) {
    return `${originalSrc}&w=10&q=10`;
  }
  return `${originalSrc}?w=10&q=10`;
};

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
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Generate cache key
  const cacheKey = src ? generateCacheKey(src) : '';
  
  // Check cache on mount
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // Check all cache levels
    const checkCaches = async () => {
      // Check session cache first (fastest)
      const sessionCached = sessionImageCache.getItem(cacheKey);
      if (sessionCached) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        return;
      }
      
      // Then check memory cache
      if (imageCache.has(src)) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        return;
      }
      
      // Then check browser cache
      const isCached = await isImageCached(src);
      if (isCached) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        return;
      }
      
      // Start loading with progress simulation
      setLoadProgress(30);
      progressIntervalRef.current = window.setInterval(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(prev => {
            const increment = prev < 30 ? 10 : prev < 60 ? 5 : prev < 80 ? 3 : 1;
            const newProgress = prev + Math.random() * increment;
            return newProgress >= 90 ? 90 : newProgress;
          });
        }
      }, 80);
    };
    
    checkCaches();
    
    return () => {
      isUnmountedRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (cachedSrc && cachedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cachedSrc);
      }
    };
  }, [src, cachedSrc, cacheKey]);
  
  // Generate low quality placeholder
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  // Handle image load completion
  const handleImageLoad = () => {
    // Add to memory cache
    if (!imageCache.has(src)) {
      imageCache.set(src, src);
      
      // Save to session cache
      sessionImageCache.setItem(cacheKey, src);
    }
    
    // Update UI state
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setLoadProgress(100);
    if (!isUnmountedRef.current) {
      setIsLoaded(true);
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
        src={cachedSrc || src}
        alt={alt}
        className={cn(
          "lazy-image-actual w-full h-full transition-opacity duration-200",
          objectFit,
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={style}
        onLoad={handleImageLoad}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

export function LazyImageWithPriority(props: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Set fetchpriority attribute directly
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.setAttribute('fetchpriority', 'high');
    }
  }, []);
  
  return <LazyImage {...props} />;
}

export default LazyImage;
