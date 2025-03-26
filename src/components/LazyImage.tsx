import React, { useState, useEffect, useRef, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { generateCacheKey as getImageCacheKey } from '@/utils/image/cacheManager';
import { getPlaceholderUrl, isVectorImage } from '@/utils/image/urlUtils';

// Configurable options
const PRELOAD_PRIORITY_HIGH = 1;
const PRELOAD_PRIORITY_MEDIUM = 2;
const PRELOAD_PRIORITY_LOW = 3;
const PRELOAD_BATCH_SIZE = 6;
const PLACEHOLDER_WIDTH = 20;

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: string;
  priority?: boolean;
  style?: CSSProperties;
  placeholder?: string | ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  loadingStrategy?: 'eager' | 'lazy' | 'auto';
  showProgress?: boolean;
  fallbackSrc?: string;
}

// Enhanced session-persistent cache
const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          // Check localStorage first (persistent)
          const persisted = localStorage.getItem(`persistent_img_${key}`);
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
            localStorage.setItem(`persistent_img_${key}`, value);
          } catch (persistError) {
            // Clear space if localStorage is full
            try {
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey.startsWith('persistent_img_')) {
                  keysToRemove.push(storageKey);
                }
              }
              
              const removeCount = Math.ceil(keysToRemove.length * 0.2);
              keysToRemove.slice(0, removeCount).forEach(k => localStorage.removeItem(k));
              
              localStorage.setItem(`persistent_img_${key}`, value);
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

// Performance optimized global memory cache
const imageCache = new Map<string, string>();
const requestedImagesCache = new Set<string>();
const imageErrorCache = new Set<string>();

// Prioritized preloading queue
interface PreloadItem {
  url: string;
  priority: number;
  timestamp: number;
}
const preloadQueue: PreloadItem[] = [];
let isPreloading = false;

/**
 * Process the preload queue, loading images in order of priority
 */
function processPreloadQueue() {
  if (isPreloading || preloadQueue.length === 0) return;
  
  isPreloading = true;
  
  // Sort by priority first, then by timestamp (FIFO for same priority)
  preloadQueue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp - b.timestamp;
  });
  
  // Take a batch of images to preload
  const batch = preloadQueue.splice(0, PRELOAD_BATCH_SIZE);
  
  // Start preloading the batch
  Promise.all(
    batch.map(item => {
      if (requestedImagesCache.has(item.url) || imageErrorCache.has(item.url)) {
        return Promise.resolve();
      }
      
      requestedImagesCache.add(item.url);
      
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          imageCache.set(item.url, item.url);
          const cacheKey = getImageCacheKey(item.url);
          sessionImageCache.setItem(cacheKey, item.url);
          resolve();
        };
        
        img.onerror = () => {
          imageErrorCache.add(item.url);
          resolve();
        };
        
        img.src = item.url;
      });
    })
  ).finally(() => {
    isPreloading = false;
    // Continue with next batch if available
    if (preloadQueue.length > 0) {
      setTimeout(processPreloadQueue, 100);
    }
  });
}

/**
 * Add an image to the preload queue with a specified priority
 */
function queueImageForPreload(url: string, priority: number) {
  if (!url || requestedImagesCache.has(url) || imageErrorCache.has(url)) {
    return;
  }
  
  preloadQueue.push({
    url,
    priority,
    timestamp: Date.now()
  });
  
  // Start processing the queue if not already processing
  if (!isPreloading) {
    processPreloadQueue();
  }
}

/**
 * Preload multiple images with the same priority
 */
export function preloadImages(urls: string[], priority = PRELOAD_PRIORITY_MEDIUM): void {
  if (!urls || urls.length === 0) return;
  
  urls.forEach(url => {
    queueImageForPreload(url, priority);
  });
}

/**
 * Check if an image is already loaded in any cache
 */
export async function isImageLoaded(src: string): Promise<boolean> {
  if (!src) return false;
  
  // Check memory cache first (fastest)
  if (imageCache.has(src)) return true;
  
  // Check session cache next
  const cacheKey = getImageCacheKey(src);
  if (sessionImageCache.getItem(cacheKey)) return true;
  
  // Check if the image is in the browser's HTTP cache
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
}

/**
 * Legacy function for backward compatibility
 */
export function clearOffscreenImagesFromCache(): void {
  // This is now handled automatically
}

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio,
  objectFit = "object-cover",
  priority = false,
  style,
  placeholder,
  onLoad,
  onError,
  width,
  height,
  loadingStrategy = 'auto',
  showProgress = true,
  fallbackSrc
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Determine if we're using eager loading (priority or auto for vector images)
  const isEagerLoading = priority || 
                         loadingStrategy === 'eager' || 
                         (loadingStrategy === 'auto' && isVectorImage(src));
  
  // Generate a placeholder URL based on the source
  const [placeholderSrc] = useState(() => {
    if (typeof placeholder === 'string') return placeholder;
    return src ? getPlaceholderUrl(src, PLACEHOLDER_WIDTH) : '';
  });
  
  // Decide which loading attribute to use
  const loadingAttribute = isEagerLoading ? 'eager' : 'lazy';
  
  // Generate cache key
  const cacheKey = src ? getImageCacheKey(src) : '';
  
  // Check cache and start loading image on mount
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // Check all cache levels
    const checkCaches = async () => {
      // Check if image is in error cache
      if (imageErrorCache.has(src)) {
        if (fallbackSrc) {
          setCachedSrc(fallbackSrc);
          setLoadProgress(100);
          setIsLoaded(true);
        } else {
          setHasError(true);
        }
        return;
      }
      
      // Check session cache first (fastest)
      const sessionCached = sessionImageCache.getItem(cacheKey);
      if (sessionCached) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        onLoad?.();
        return;
      }
      
      // Then check memory cache
      if (imageCache.has(src)) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        onLoad?.();
        return;
      }
      
      // Then check browser cache
      const isCached = await isImageLoaded(src);
      if (isCached) {
        setCachedSrc(src);
        setLoadProgress(100);
        setIsLoaded(true);
        onLoad?.();
        return;
      }
      
      // Start loading with progress simulation for non-vectors
      if (!isVectorImage(src)) {
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
      }
      
      // Add to preload queue with appropriate priority
      if (priority) {
        queueImageForPreload(src, PRELOAD_PRIORITY_HIGH);
      }
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
  }, [src, cachedSrc, cacheKey, priority, onLoad, fallbackSrc]);

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
      setHasError(false);
      onLoad?.();
    }
  };
  
  // Handle image load error
  const handleImageError = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    imageErrorCache.add(src);
    
    if (!isUnmountedRef.current) {
      setHasError(true);
      onError?.();
      
      // Try fallback if available
      if (fallbackSrc && fallbackSrc !== src) {
        setCachedSrc(fallbackSrc);
      }
    }
  };

  if (!src && !fallbackSrc) return null;

  return (
    <div 
      ref={imgRef}
      className={cn(
        "lazy-image overflow-hidden relative", 
        aspectRatio,
        className
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        ...style
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <>
          {typeof placeholder === 'string' || React.isValidElement(placeholder) ? (
            // Custom placeholder
            <div className="absolute inset-0 w-full h-full">
              {typeof placeholder === 'string' ? (
                <img
                  src={placeholder as string}
                  alt={alt}
                  className={cn(
                    "absolute inset-0 w-full h-full blur-sm scale-105",
                    objectFit,
                    "opacity-100 transition-opacity duration-200"
                  )}
                  loading="eager"
                />
              ) : (
                placeholder
              )}
            </div>
          ) : placeholderSrc ? (
            // Auto-generated low-quality placeholder
            <img
              src={placeholderSrc}
              alt={alt}
              className={cn(
                "lazy-image-placeholder absolute inset-0 w-full h-full blur-sm scale-105",
                objectFit,
                "opacity-100 transition-opacity duration-200"
              )}
              loading="eager"
            />
          ) : (
            // Skeleton placeholder
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
        </>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && showProgress && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-1 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <div className="text-destructive mb-2">⚠️</div>
            <div className="text-sm text-muted-foreground">Image unavailable</div>
          </div>
        </div>
      )}
      
      {/* Main image */}
      {(!hasError || fallbackSrc) && (
        <img
          src={cachedSrc || fallbackSrc || src}
          alt={alt}
          className={cn(
            "lazy-image-actual w-full h-full transition-opacity duration-200",
            objectFit,
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={style}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loadingAttribute}
          decoding="async"
          width={width}
          height={height}
        />
      )}
    </div>
  );
}

export function LazyImageWithPriority(props: LazyImageProps) {
  return (
    <LazyImage 
      {...props} 
      priority={true} 
      loadingStrategy="eager"
    />
  );
}

export default LazyImage;
