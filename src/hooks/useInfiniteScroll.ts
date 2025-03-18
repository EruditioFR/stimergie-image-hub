
import { useCallback, useEffect, useRef } from 'react';

export function useInfiniteScroll(
  onLoadMore: (() => void) | undefined,
  isLoading: boolean
) {
  // Create a ref for the observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Setup infinite scroll with intersection observer
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || !onLoadMore) return;
      
      // Disconnect previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Create new intersection observer
      observerRef.current = new IntersectionObserver(entries => {
        // If the sentinel element is intersecting (visible)
        if (entries[0]?.isIntersecting && !isLoading) {
          onLoadMore();
        }
      }, {
        rootMargin: '500px', // Start loading before the element is visible
      });
      
      // Observe the sentinel element
      if (node) {
        observerRef.current.observe(node);
      }
    },
    [onLoadMore, isLoading]
  );
  
  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return loadMoreRef;
}
