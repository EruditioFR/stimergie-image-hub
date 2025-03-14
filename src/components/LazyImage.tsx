
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

// Global image cache for faster loading of previously viewed images
const imageCache = new Map<string, string>();

// Global IntersectionObserver instance for performance
let globalObserver: IntersectionObserver | null = null;
const observedElements = new WeakMap<Element, (isIntersecting: boolean) => void>();

// Create or get the global observer
const getObserver = () => {
  if (globalObserver === null) {
    globalObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const callback = observedElements.get(entry.target);
          if (callback) callback(entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: '200px', // Preload images 200px before they enter viewport
        threshold: 0.01
      }
    );
  }
  return globalObserver;
};

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio,
  objectFit = "object-cover",
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, consider in view immediately
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  // Check if image is already cached on mount
  useEffect(() => {
    if (!src) return;
    
    if (imageCache.has(src)) {
      setCachedSrc(imageCache.get(src) || null);
      // Simulate fast loading for cached images
      setLoadProgress(70);
      setTimeout(() => {
        setLoadProgress(100);
        setIsLoaded(true);
      }, 50); // Faster timeout for cached images
    }
    
    // Clean up any interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [src]);
  
  // Generate optimized low-quality placeholder URL
  const getLowQualitySrc = (originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // For Unsplash, use their built-in resizing parameters
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=10').replace(/&q=\d+/, '&q=10');
    }
    
    // For other sources, add size parameters
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=10&q=10`;
    }
    return `${originalSrc}?w=10&q=10`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  // Set up intersection observer
  useEffect(() => {
    if (!imgRef.current || priority) return; // Skip if priority
    
    const observer = getObserver();
    const currentRef = imgRef.current;
    
    const callback = (isIntersecting: boolean) => {
      if (isIntersecting) {
        setIsInView(true);
        observer.unobserve(currentRef); // Stop observing once in view
        observedElements.delete(currentRef);
      }
    };
    
    observedElements.set(currentRef, callback);
    observer.observe(currentRef);
    
    return () => {
      observer.unobserve(currentRef);
      observedElements.delete(currentRef);
    };
  }, [priority]);

  // Simulate loading progress
  useEffect(() => {
    if ((isInView || priority) && !isLoaded && !cachedSrc) {
      // Initialize progress with a random value
      setLoadProgress(Math.floor(Math.random() * 20) + 10);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = window.setInterval(() => {
        setLoadProgress(prev => {
          // Slow down progress as it approaches 90%
          const increment = prev < 30 ? 10 : prev < 60 ? 5 : prev < 80 ? 2 : 1;
          const newProgress = prev + Math.random() * increment;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until actual load
        });
      }, 150);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isInView, isLoaded, cachedSrc, priority]);

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
    setTimeout(() => {
      setIsLoaded(true);
    }, 50); // Faster animation for smoother experience
  };

  if (!src) return null;

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden relative", aspectRatio, className)}
    >
      {/* Low-resolution placeholder */}
      {(isInView || priority) && !isLoaded && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-md scale-105",
            objectFit,
            "opacity-100 transition-opacity duration-300" // Faster transition
          )}
          loading="eager" // Load placeholder eagerly
        />
      )}
      
      {/* Loading indicator */}
      {(isInView || priority) && !isLoaded && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-1 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1" />
        </div>
      )}
      
      {/* Main image */}
      {(isInView || priority) && (
        <img
          ref={imgElRef}
          src={cachedSrc || src}
          alt={alt}
          className={cn(
            "lazy-image-actual w-full h-full transition-opacity duration-300", // Faster transition
            objectFit,
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      )}
    </div>
  );
}

export default LazyImage;
