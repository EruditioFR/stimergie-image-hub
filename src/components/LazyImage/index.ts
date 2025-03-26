
export { LazyImage } from './LazyImage';
export { LazyImageWithPriority } from './LazyImageWithPriority';
export { preloadImages } from './preloadManager';
export { isImageLoaded, clearOffscreenImagesFromCache } from './cacheManager';
export type { LazyImageProps } from './types';

// Re-export for backwards compatibility
export { PRELOAD_PRIORITY_HIGH, PRELOAD_PRIORITY_MEDIUM, PRELOAD_PRIORITY_LOW } from './cacheManager';
