
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlaceholderUrl, isVectorImage } from '@/utils/image/urlUtils';
import { getImageCacheKey } from '@/utils/image/cacheManager';

import { LazyImageProps } from './types';
import { PLACEHOLDER_WIDTH, shouldUseEagerLoading } from './utils';
import { 
  sessionImageCache, 
  imageCache, 
  imageErrorCache, 
  isImageLoaded
} from './cacheManager';
import { queueImageForPreload, PRELOAD_PRIORITY_HIGH } from './preloadManager';

export const LazyImage: React.FC<LazyImageProps> = ({
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
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Determine if we're using eager loading (priority or auto for vector images)
  const isEagerLoading = shouldUseEagerLoading(priority, loadingStrategy, src);
  
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
};
