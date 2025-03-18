
import { useCallback, useEffect, useRef } from 'react';

// This hook now loads all images at once for improved performance
export function useInfiniteScroll(
  onLoadMore: (() => void) | undefined,
  isLoading: boolean
) {
  // Immediately load all images at once
  useEffect(() => {
    if (onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  return;
}
