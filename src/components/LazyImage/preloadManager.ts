
/**
 * Preload utilities for the LazyImage component
 */
import { getImageCacheKey } from '@/utils/image/cacheManager';
import { 
  preloadQueue, 
  imageCache, 
  sessionImageCache, 
  isPreloading, 
  requestedImagesCache, 
  imageErrorCache,
  PRELOAD_BATCH_SIZE,
  PRELOAD_PRIORITY_MEDIUM
} from './cacheManager';

/**
 * Process the preload queue, loading images in order of priority
 */
export function processPreloadQueue() {
  if (isPreloading || preloadQueue.length === 0) return;
  
  isPreloading = true;
  
  // Sort by priority first, then by timestamp (FIFO for same priority)
  preloadQueue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp - b.timestamp;
  });
  
  // Take a batch of images to preload
  const batch = preloadQueue.splice(0, PRELOAD_BATCH_SIZE);
  
  // Start preloading the batch
  Promise.all(
    batch.map(item => {
      if (requestedImagesCache.has(item.url) || imageErrorCache.has(item.url)) {
        return Promise.resolve();
      }
      
      requestedImagesCache.add(item.url);
      
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          imageCache.set(item.url, item.url);
          const cacheKey = getImageCacheKey(item.url);
          sessionImageCache.setItem(cacheKey, item.url);
          resolve();
        };
        
        img.onerror = () => {
          imageErrorCache.add(item.url);
          resolve();
        };
        
        img.src = item.url;
      });
    })
  ).finally(() => {
    isPreloading = false;
    // Continue with next batch if available
    if (preloadQueue.length > 0) {
      setTimeout(processPreloadQueue, 100);
    }
  });
}

/**
 * Add an image to the preload queue with a specified priority
 */
export function queueImageForPreload(url: string, priority: number) {
  if (!url || requestedImagesCache.has(url) || imageErrorCache.has(url)) {
    return;
  }
  
  preloadQueue.push({
    url,
    priority,
    timestamp: Date.now()
  });
  
  // Start processing the queue if not already processing
  if (!isPreloading) {
    processPreloadQueue();
  }
}

/**
 * Preload multiple images with the same priority
 */
export function preloadImages(urls: string[], priority = PRELOAD_PRIORITY_MEDIUM): void {
  if (!urls || urls.length === 0) return;
  
  urls.forEach(url => {
    queueImageForPreload(url, priority);
  });
}
