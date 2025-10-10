
// Cache time constants - Optimized for better performance
export const GALLERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes (was 3 minutes)
export const GALLERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes for React Query (was 15 seconds)

// Pagination constants
export const IMAGES_PER_PAGE = 100; // 100 images per page for pagination

// Cache size limits
export const MAX_CACHE_ENTRIES = 200; // Maximum number of cached image entries (LRU eviction)
