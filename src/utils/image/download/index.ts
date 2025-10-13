
/**
 * Re-export all download functionality from the new modular files
 */

export * from './imageProcessor';
export * from './networkUtils';
export * from './requestDownload';
// Import the type directly to avoid name conflicts
import type { ImageDownloadFormat as SingleImageDownloaderFormat } from './singleImageDownloader';
// Re-export the function and type with proper syntax for isolatedModules
export { downloadImage } from './singleImageDownloader';
// Use 'export type' for type re-exports
export type { ImageDownloadFormat } from './singleImageDownloader';
export * from './zipCreator';
export * from './o2switchUploader';
export * from './storageUtils';
export * from './types';
export * from './semaphore';

// Note: downloadImagesAsZip is exported from './zipCreator'
