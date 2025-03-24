
// Main gallery service exports
import { fetchGalleryImages } from './gallery/imageService';
import { fetchTotalImageCount } from './gallery/countService';
import { generateCacheKey } from './gallery/cacheUtils';
import { GALLERY_CACHE_TIME, IMAGES_PER_PAGE } from './gallery/constants';

export {
  fetchGalleryImages,
  fetchTotalImageCount,
  generateCacheKey,
  GALLERY_CACHE_TIME,
  IMAGES_PER_PAGE
};
