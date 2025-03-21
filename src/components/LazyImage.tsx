import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: string;
  priority?: boolean;
}

// Enhanced global cache for faster loading of previously viewed images
const imageCache = new Map<string, string>();

// Cache to track requested images to avoid duplicates
const requestedImagesCache = new Set<string>();

// Enhanced session-persistent cache to retain images across page navigations
const sessionImageCache = (() => {
  try {
    return {
      getItem: (key: string): string | null => {
        try {
          return sessionStorage.getItem(`lazy_img_${key}`);
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          sessionStorage.setItem(`lazy_img_${key}`, value);
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
      setItem: (key: string, value: string): void => memoryFallback.set(key, value)
    };
  }
})();

// Preload a batch of images for smoother experience
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  // Check session cache first for all URLs
  const urlsToLoad = urls.filter(url => {
    const cacheKey = generateCacheKey(url);
    
    // Check session cache
    const sessionCached = sessionImageCache.getItem(cacheKey);
    if (sessionCached) {
      // If already in session cache, add to memory cache
      imageCache.set(url, url);
      return false;
    }
    
    return !requestedImagesCache.has(url);
  });
  
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
          const cacheKey = generateCacheKey(url);
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
  priority = false
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
