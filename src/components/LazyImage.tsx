
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
  const [loadProgress, setLoadProgress] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // On utilise une URL optimisée pour le chargement initial (résolution plus basse)
  const getLowQualitySrc = (originalSrc: string): string => {
    // Si l'URL est une URL Unsplash, on utilise les paramètres pour charger une version plus petite
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
    }
    // Pour les autres sources, on retourne l'URL d'origine
    return originalSrc;
  };
  
  const [lowQualitySrc] = useState(getLowQualitySrc(src));

  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '200px', // Augmenté pour précharger les images plus tôt
        threshold: 0.01 // Réduit pour déclencher plus rapidement
      }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);

  // Simuler le chargement progressif
  useEffect(() => {
    if (isInView && !isLoaded) {
      const interval = setInterval(() => {
        setLoadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isInView, isLoaded]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setLoadProgress(100);
  };

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden relative", aspectRatio, className)}
    >
      {/* Placeholder à faible résolution */}
      {isInView && !isLoaded && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-md scale-105",
            objectFit,
            isLoaded ? "opacity-0" : "opacity-100"
          )}
          style={{ transition: 'opacity 500ms ease-in-out' }}
        />
      )}
      
      {/* Indicateur de chargement */}
      {isInView && !isLoaded && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1.5" />
        </div>
      )}
      
      {/* Image principale */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "lazy-image-actual w-full h-full transition-opacity duration-500",
            objectFit,
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

export default LazyImage;
