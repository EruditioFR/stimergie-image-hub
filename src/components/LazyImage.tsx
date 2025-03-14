
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

// Cache global pour les images
const imageCache = new Map<string, string>();

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
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // Vérifier si l'image est déjà en cache au montage
  useEffect(() => {
    if (!src) return; // Add early return when src is undefined
    
    if (imageCache.has(src)) {
      setCachedSrc(imageCache.get(src) || null);
      // Si l'image est en cache, on simule un chargement rapide
      setLoadProgress(70);
      setTimeout(() => {
        setLoadProgress(100);
        setIsLoaded(true);
      }, 100);
    }
  }, [src]);
  
  // On utilise une URL optimisée pour le chargement initial (résolution plus basse)
  const getLowQualitySrc = (originalSrc: string): string => {
    // Add safety check to prevent error when originalSrc is undefined
    if (!originalSrc) return '';
    
    // Si l'URL est une URL Unsplash, on utilise les paramètres pour charger une version plus petite
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
    }
    // Pour les autres sources, on retourne l'URL d'origine avec une taille réduite si possible
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=20&q=20`;
    }
    return `${originalSrc}?w=20&q=20`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '200px', // Précharger les images plus tôt (200px avant d'entrer dans la vue)
        threshold: 0.01
      }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);

  // Simuler le chargement progressif quand l'image entre dans la vue
  useEffect(() => {
    if (isInView && !isLoaded && !cachedSrc) {
      // Initialiser la progression à une valeur aléatoire entre 10 et 30
      setLoadProgress(Math.floor(Math.random() * 20) + 10);
      
      const interval = setInterval(() => {
        setLoadProgress(prev => {
          // Ralentir la progression à mesure qu'on approche de 90%
          const increment = prev < 30 ? 10 : prev < 60 ? 5 : prev < 80 ? 2 : 1;
          const newProgress = prev + Math.random() * increment;
          return newProgress >= 90 ? 90 : newProgress; // Plafonner à 90% jusqu'au chargement réel
        });
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [isInView, isLoaded, cachedSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Ajouter l'image au cache global
    if (!imageCache.has(src) && e.currentTarget.src === src) {
      imageCache.set(src, src);
    }
    
    // Finaliser le chargement
    setLoadProgress(100);
    setTimeout(() => {
      setIsLoaded(true);
    }, 100); // Petit délai pour l'animation
  };

  if (!src) return null; // Add early return for cases where src is undefined

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden relative", aspectRatio, className)}
    >
      {/* Image basse résolution comme placeholder */}
      {isInView && !isLoaded && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-md scale-105",
            objectFit,
            "opacity-100 transition-opacity duration-500"
          )}
        />
      )}
      
      {/* Indicateur de chargement */}
      {isInView && !isLoaded && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1.5" />
        </div>
      )}
      
      {/* Image principale (image en cache ou image à charger) */}
      {isInView && (
        <img
          src={cachedSrc || src}
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
