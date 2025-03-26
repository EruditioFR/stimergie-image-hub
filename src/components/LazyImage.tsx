
import React, { useState, useEffect, useRef, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { isVectorImage } from '@/utils/image/urlUtils';

// Simple preloading function to replace the removed cache system
export function preloadImages(urls: string[], priority: number = 1): void {
  if (!urls || urls.length === 0) return;
  
  console.log(`Preloading ${urls.length} images with priority ${priority}`);
  
  // For each URL, create an image element to trigger browser preloading
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

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
  const imgRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Determine if we're using eager loading (priority or auto for vector images)
  const isEagerLoading = priority || 
                         loadingStrategy === 'eager' || 
                         (loadingStrategy === 'auto' && isVectorImage(src));
  
  // Decide which loading attribute to use
  const loadingAttribute = isEagerLoading ? 'eager' : 'lazy';
  
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
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
    
    return () => {
      isUnmountedRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [src]);

  // Handle image load completion
  const handleImageLoad = () => {
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
    
    if (!isUnmountedRef.current) {
      setHasError(true);
      onError?.();
      
      // Try fallback if available
      if (fallbackSrc && fallbackSrc !== src) {
        // No need to cache fallback attempts
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
          src={fallbackSrc || src}
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
