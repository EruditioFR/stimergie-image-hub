
import { useCallback, useEffect, useRef } from 'react';

// This hook is kept for backwards compatibility but no longer has any effect
export function useInfiniteScroll(
  onLoadMore: (() => void) | undefined,
  isLoading: boolean
) {
  // This hook now does nothing as we're loading all images at once
  return;
}

