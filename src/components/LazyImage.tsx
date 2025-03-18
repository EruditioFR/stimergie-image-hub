
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

// Quick-loading image preloader without caching
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  // Process all images at once with minimal delay
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
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
  const imgRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // Start simulated progress immediately (faster start)
    setLoadProgress(Math.floor(Math.random() * 40) + 30);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      if (!isUnmountedRef.current) {
        setLoadProgress(prev => {
          // Faster progress simulation
          const increment = prev < 60 ? 12 : prev < 80 ? 8 : 5;
          const newProgress = prev + Math.random() * increment;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }
    }, 50); // Much faster interval
    
    // Clean up any interval on unmount
    return () => {
      isUnmountedRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [src]);
  
  // Generate optimized low quality placeholder URL
  const getLowQualitySrc = (originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // For Unsplash, use their built-in resizing parameters
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=10').replace(/&q=\d+/, '&q=10');
    }
    
    // For other sources, use minimal size parameters
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=5&q=5`; // Extremely small for faster loading
    }
    return `${originalSrc}?w=5&q=5`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  const handleImageLoad = () => {
    // Complete loading
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
        ref={imgElRef}
        src={`${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`} // Prevent browser caching
        alt={alt}
        className={cn(
          "lazy-image-actual w-full h-full transition-opacity duration-200",
          objectFit,
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleImageLoad}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}

export function LazyImageWithPriority(props: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use effect to set the fetchpriority attribute directly
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.setAttribute('fetchpriority', 'high');
    }
  }, []);
  
  // Pass the ref to the LazyImage
  return <LazyImage {...props} priority={true} />;
}

export default LazyImage;
