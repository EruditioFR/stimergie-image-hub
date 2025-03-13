
import { useCallback, useEffect } from 'react';

export function useInfiniteScroll(
  onLoadMore: (() => void) | undefined,
  isLoading: boolean
) {
  const handleScroll = useCallback(() => {
    if (!onLoadMore) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollHeight - scrollTop - clientHeight < 300 && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  useEffect(() => {
    if (onLoadMore) {
      let scrollTimer: number | null = null;
      
      const debouncedScroll = () => {
        if (scrollTimer) window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(handleScroll, 100);
      };
      
      window.addEventListener('scroll', debouncedScroll);
      return () => {
        if (scrollTimer) window.clearTimeout(scrollTimer);
        window.removeEventListener('scroll', debouncedScroll);
      };
    }
  }, [onLoadMore, handleScroll]);
}
