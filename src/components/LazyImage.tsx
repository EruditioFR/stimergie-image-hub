
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

// Cache global pour un chargement plus rapide des images déjà visionnées
const imageCache = new Map<string, string>();

// Cache pour garder une trace des images demandées pour éviter les doublons
const requestedImagesCache = new Set<string>();

// Précharger un lot d'images pour une expérience utilisateur plus fluide
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  // Process all images at once with some basic throttling
  const batchSize = 20; // Load more images at once
  let index = 0;
  
  const loadNextBatch = () => {
    const batch = urls.slice(index, index + batchSize);
    if (batch.length === 0) return;
    
    batch.forEach(url => {
      if (!requestedImagesCache.has(url)) {
        requestedImagesCache.add(url);
        
        const img = new Image();
        img.onload = () => {
          imageCache.set(url, url);
        };
        img.src = url;
      }
    });
    
    index += batchSize;
    
    // Continue loading after a small delay to prevent browser overload
    if (index < urls.length) {
      setTimeout(loadNextBatch, 100);
    }
  };
  
  loadNextBatch();
}

// Function maintained for API compatibility
export function clearOffscreenImagesFromCache(visibleImageUrls: string[]): void {
  // We no longer clear images from cache since we want to load all at once
  // Just maintain a reasonable cache size
  const MAX_CACHE_SIZE = 500; // Increased for all-at-once loading
  
  if (imageCache.size > MAX_CACHE_SIZE) {
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
  
  // Check if image is already in cache on mount
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // If image is in our application cache
    if (imageCache.has(src)) {
      setCachedSrc(imageCache.get(src) || null);
      setLoadProgress(80);
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(100);
          setIsLoaded(true);
        }
      }, 30);
    }
    
    // Check browser cache
    const checkBrowserCache = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('images-cache-v1');
          const response = await cache.match(src);
          if (response) {
            const blob = await response.blob();
            if (blob.size > 0) {
              const objectURL = URL.createObjectURL(blob);
              setCachedSrc(objectURL);
              imageCache.set(src, objectURL);
              setLoadProgress(90);
              setTimeout(() => {
                if (!isUnmountedRef.current) {
                  setLoadProgress(100);
                  setIsLoaded(true);
                }
              }, 20);
              return true;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to check browser cache:", e);
      }
      return false;
    };
    
    if (!imageCache.has(src)) {
      checkBrowserCache();
    }
    
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
  }, [src, cachedSrc]);
  
  // Generate optimized low quality placeholder URL
  const getLowQualitySrc = (originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // For Unsplash, use their built-in resizing parameters
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
    }
    
    // For other sources, add size parameters
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=20&q=20`;
    }
    return `${originalSrc}?w=20&q=20`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  // Simulate loading progress for better UX
  useEffect(() => {
    if (!isLoaded && !cachedSrc) {
      // Initialize progress with a random value
      setLoadProgress(Math.floor(Math.random() * 30) + 20);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = window.setInterval(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(prev => {
            // Slow down progress as it approaches 90%
            const increment = prev < 30 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 1;
            const newProgress = prev + Math.random() * increment;
            return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until actual load
          });
        }
      }, 120);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isLoaded, cachedSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Add image to global cache
    if (!imageCache.has(src) && e.currentTarget.src === src) {
      imageCache.set(src, src);
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
      }, 30);
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
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-md scale-105",
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
        loading="eager" // Change from lazy to eager for immediate loading
        decoding="async"
        fetchpriority="high" // Fixed: Changed from fetchPriority to fetchpriority (lowercase)
      />
    </div>
  );
}

export default LazyImage;
