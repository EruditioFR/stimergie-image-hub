import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
  enabled: boolean;
  isLoading: boolean;
  hasMorePages: boolean;
  currentPage: number;
  onLoadMore: () => void;
  threshold?: number; // Pourcentage de scroll avant de charger (0-1)
}

/**
 * Hook pour gérer l'infinite scroll
 * Charge automatiquement la page suivante quand l'utilisateur scroll à 80% de la page
 */
export function useInfiniteScroll({
  enabled,
  isLoading,
  hasMorePages,
  currentPage,
  onLoadMore,
  threshold = 0.8
}: UseInfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    if (!enabled || isLoading || !hasMorePages || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    onLoadMore();
    
    // Reset loading flag après un délai
    setTimeout(() => {
      loadingRef.current = false;
    }, 1000);
  }, [enabled, isLoading, hasMorePages, onLoadMore]);

  useEffect(() => {
    if (!enabled) return;

    // Observer basé sur le scroll position
    const handleScroll = () => {
      if (isLoading || !hasMorePages || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

      if (scrollPercentage >= threshold) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, isLoading, hasMorePages, threshold, handleLoadMore]);

  // Fonction pour obtenir la ref du sentinel (utilisée pour l'Intersection Observer)
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!enabled || !node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePages && !isLoading && !loadingRef.current) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(node);
    sentinelRef.current = node;
  }, [enabled, hasMorePages, isLoading, handleLoadMore]);

  return { setSentinelRef };
}
