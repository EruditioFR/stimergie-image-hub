
/**
 * Central module for image download functionality
 */

import { downloadImage as singleImageDownloader } from './singleImageDownloader';
import { downloadImagesAsZip } from './zipCreator';

/**
 * Downloads an image from a URL and saves it with the specified filename
 * 
 * @param url - The URL of the image to download
 * @param filename - The filename to save the image as
 * @param format - Optional format of the image file (defaults to jpg)
 * @param isHD - Optional flag to indicate if this is an HD download
 * @returns A promise that resolves when the download is complete
 */
export const downloadImage = async (
  url: string, 
  filename: string, 
  format: string = 'jpg', 
  isHD: boolean = false
): Promise<void> => {
  return singleImageDownloader(url, filename, format, isHD);
};

// Export other download-related functions
export * from './types';
export { downloadImagesAsZip };
