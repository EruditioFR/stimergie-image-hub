
// Main gallery service exports
import { fetchGalleryImages } from './gallery/imageService';
import { fetchTotalImagesCount } from './gallery/countService';
import { generateCacheKey } from './gallery/cacheUtils';
import { GALLERY_CACHE_TIME, IMAGES_PER_PAGE } from './gallery/constants';

export {
  fetchGalleryImages,
  fetchTotalImagesCount,
  generateCacheKey,
  GALLERY_CACHE_TIME,
  IMAGES_PER_PAGE
};
