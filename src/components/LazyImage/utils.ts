
/**
 * Utility functions for the LazyImage component
 */
import { isVectorImage } from '@/utils/image/urlUtils';

// Constants
export const PLACEHOLDER_WIDTH = 20;

/**
 * Determines if eager loading should be used based on image properties
 */
export function shouldUseEagerLoading(
  priority: boolean, 
  loadingStrategy: 'eager' | 'lazy' | 'auto',
  src: string
): boolean {
  return priority || 
         loadingStrategy === 'eager' || 
         (loadingStrategy === 'auto' && isVectorImage(src));
}
