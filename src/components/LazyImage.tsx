
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

// Instance globale d'IntersectionObserver pour des performances optimales
let globalObserver: IntersectionObserver | null = null;
const observedElements = new WeakMap<Element, (isIntersecting: boolean) => void>();

// Créer ou obtenir l'observateur global
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
        rootMargin: '500px', // Augmenté à 500px pour précharger davantage d'images avant qu'elles n'entrent dans le viewport
        threshold: 0.01
      }
    );
  }
  return globalObserver;
};

// Précharger un lot d'images pour une expérience utilisateur plus fluide
export function preloadImages(urls: string[]): void {
  if (!urls.length) return;
  
  // Limiter le nombre d'images préchargées simultanément
  const batchSize = 8; // Augmenté pour précharger plus d'images
  const priorityUrls = urls.slice(0, batchSize);
  
  priorityUrls.forEach(url => {
    if (!requestedImagesCache.has(url)) {
      requestedImagesCache.add(url);
      
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, url);
      };
      img.src = url;
    }
  });
}

// Vider le cache des images qui ne sont plus visibles
// pour libérer de la mémoire lors du défilement
export function clearOffscreenImagesFromCache(visibleImageUrls: string[]): void {
  // Transformation du tableau en Set pour des recherches O(1)
  const visibleUrlsSet = new Set(visibleImageUrls);
  
  // Parcourir le cache et supprimer les images qui ne sont plus visibles
  // tout en gardant un nombre minimum d'images pour le cache
  const MAX_CACHE_SIZE = 100;
  
  if (imageCache.size > MAX_CACHE_SIZE) {
    const urlsToRemove: string[] = [];
    imageCache.forEach((value, key) => {
      if (!visibleUrlsSet.has(key)) {
        urlsToRemove.push(key);
      }
    });
    
    // Ne conserver que les entrées nécessaires pour rester sous la limite
    const removeCount = Math.min(urlsToRemove.length, imageCache.size - MAX_CACHE_SIZE);
    urlsToRemove.slice(0, removeCount).forEach(url => {
      imageCache.delete(url);
      requestedImagesCache.delete(url);
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
  const [isInView, setIsInView] = useState(priority); // Si prioritaire, considérer immédiatement dans la vue
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false); // Pour suivre si le composant est démonté
  
  // Vérifier si l'image est déjà mise en cache au montage
  useEffect(() => {
    if (!src) return;
    
    isUnmountedRef.current = false;
    
    // Si l'image est dans notre cache d'application
    if (imageCache.has(src)) {
      setCachedSrc(imageCache.get(src) || null);
      // Simuler un chargement rapide pour les images mises en cache
      setLoadProgress(80);
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(100);
          setIsLoaded(true);
        }
      }, 30); // Timeout plus rapide pour les images mises en cache
    }
    
    // Vérifier si l'image est dans le cache du navigateur
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
    
    // Nettoyer tout intervalle au démontage
    return () => {
      isUnmountedRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Libérer l'objectURL si nous en avons créé un
      if (cachedSrc && cachedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cachedSrc);
      }
    };
  }, [src, cachedSrc]);
  
  // Générer URL de placeholder de basse qualité optimisée
  const getLowQualitySrc = (originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // Pour Unsplash, utiliser leurs paramètres de redimensionnement intégrés
    if (originalSrc.includes('unsplash.com')) {
      return originalSrc.replace(/&w=\d+/, '&w=20').replace(/&q=\d+/, '&q=20');
    }
    
    // Pour les autres sources, ajouter des paramètres de taille
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=20&q=20`;
    }
    return `${originalSrc}?w=20&q=20`;
  };
  
  const [lowQualitySrc] = useState(src ? getLowQualitySrc(src) : '');

  // Configurer l'observateur d'intersection
  useEffect(() => {
    if (!imgRef.current || priority) return; // Ignorer si prioritaire
    
    const observer = getObserver();
    const currentRef = imgRef.current;
    
    const callback = (isIntersecting: boolean) => {
      if (isIntersecting && !isUnmountedRef.current) {
        setIsInView(true);
        observer.unobserve(currentRef); // Arrêter d'observer une fois dans la vue
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

  // Simuler la progression du chargement pour une meilleure UX
  useEffect(() => {
    if ((isInView || priority) && !isLoaded && !cachedSrc) {
      // Initialiser la progression avec une valeur aléatoire
      setLoadProgress(Math.floor(Math.random() * 30) + 20);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = window.setInterval(() => {
        if (!isUnmountedRef.current) {
          setLoadProgress(prev => {
            // Ralentir la progression à l'approche de 90%
            const increment = prev < 30 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 1;
            const newProgress = prev + Math.random() * increment;
            return newProgress >= 90 ? 90 : newProgress; // Plafonner à 90% jusqu'au chargement réel
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
  }, [isInView, isLoaded, cachedSrc, priority]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Ajouter l'image au cache global
    if (!imageCache.has(src) && e.currentTarget.src === src) {
      imageCache.set(src, src);
    }
    
    // Compléter le chargement
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
      }, 30); // Animation plus rapide pour une expérience plus fluide
    }
  };

  if (!src) return null;

  return (
    <div 
      ref={imgRef}
      className={cn("lazy-image overflow-hidden relative", aspectRatio, className)}
    >
      {/* Placeholder de basse résolution */}
      {(isInView || priority) && !isLoaded && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            "lazy-image-placeholder absolute inset-0 w-full h-full blur-md scale-105",
            objectFit,
            "opacity-100 transition-opacity duration-200" // Transition plus rapide
          )}
          loading="eager" // Charger le placeholder avidement
        />
      )}
      
      {/* Indicateur de chargement */}
      {(isInView || priority) && !isLoaded && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-1 bg-background/50 backdrop-blur-sm">
          <Progress value={loadProgress} className="h-1" />
        </div>
      )}
      
      {/* Image principale */}
      {(isInView || priority) && (
        <img
          ref={imgElRef}
          src={cachedSrc || src}
          alt={alt}
          className={cn(
            "lazy-image-actual w-full h-full transition-opacity duration-200", // Transition plus rapide
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
