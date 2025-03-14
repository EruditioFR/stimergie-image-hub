
import { useCallback, useEffect, useRef } from 'react';

export function useInfiniteScroll(
  onLoadMore: (() => void) | undefined,
  isLoading: boolean
) {
  const loadingRef = useRef(isLoading);
  const scrollTimerRef = useRef<number | null>(null);
  const lastScrollPositionRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  
  // Update loading ref when isLoading changes
  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);

  const handleScroll = useCallback(() => {
    if (!onLoadMore) return;
    
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Calculate scroll speed for smoother loading
    const currentPosition = scrollTop;
    scrollSpeedRef.current = Math.abs(currentPosition - lastScrollPositionRef.current);
    lastScrollPositionRef.current = currentPosition;
    
    // Adjust threshold based on scroll speed (faster scroll = earlier loading trigger)
    const speedFactor = Math.min(scrollSpeedRef.current / 10, 5);
    const dynamicThreshold = 500 + (speedFactor * 100);
    
    // Load more when approaching bottom, considering scroll speed
    if (scrollHeight - scrollTop - clientHeight < dynamicThreshold && !loadingRef.current) {
      onLoadMore();
    }
  }, [onLoadMore]);

  useEffect(() => {
    if (onLoadMore) {
      // Improved scroll event handling with debounce
      const debouncedScroll = () => {
        if (scrollTimerRef.current !== null) {
          window.clearTimeout(scrollTimerRef.current);
        }
        
        // Use requestAnimationFrame for smoother performance
        window.requestAnimationFrame(() => {
          scrollTimerRef.current = window.setTimeout(handleScroll, 50);
        });
      };
      
      // Passive event listener for better performance
      window.addEventListener('scroll', debouncedScroll, { passive: true });
      
      // Clean up
      return () => {
        if (scrollTimerRef.current !== null) {
          window.clearTimeout(scrollTimerRef.current);
        }
        window.removeEventListener('scroll', debouncedScroll);
      };
    }
  }, [onLoadMore, handleScroll]);
}
