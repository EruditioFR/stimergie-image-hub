
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio,
  objectFit = "object-cover"
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden", aspectRatio, className)}
    >
      <div className="lazy-image-placeholder animate-pulse" />
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "lazy-image-actual w-full h-full transition-opacity duration-500",
            objectFit,
            isLoaded ? "loaded" : ""
          )}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}

export default LazyImage;
