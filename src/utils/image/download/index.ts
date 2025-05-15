
/**
 * Central module for image download functionality
 */

import { downloadImage as singleImageDownloader } from './singleImageDownloader';

/**
 * Downloads an image from a URL and saves it with the specified filename
 * 
 * @param url - The URL of the image to download
 * @param filename - The filename to save the image as
 * @returns A promise that resolves when the download is complete
 */
export const downloadImage = async (url: string, filename: string): Promise<void> => {
  return singleImageDownloader(url, filename);
};

// Export other download-related functions as needed
export * from './types';
