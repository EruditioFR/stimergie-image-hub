
/**
 * Re-export all download functionality from the new modular files
 */

export * from './imageProcessor';
export * from './networkUtils';
export * from './requestDownload';
export * from './singleImageDownloader';
export * from './zipCreator';
export * from './o2switchUploader';
export * from './storageUtils';
export * from './types';
export * from './semaphore';

// Re-implement downloadImagesAsZip if it's missing from exports
import { downloadImage } from './singleImageDownloader';
// Don't re-import ImageDownloadFormat to avoid the ambiguity
import { ImageForZip } from './types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createSemaphore } from './semaphore';

/**
 * Downloads multiple images and packages them into a ZIP file
 */
export async function downloadImagesAsZip(
  images: ImageForZip[],
  zipFilename: string,
  isHD: boolean = false
): Promise<void> {
  const zip = new JSZip();
  const semaphore = createSemaphore(5); // Limit concurrent downloads
  const promises: Promise<void>[] = [];

  for (const image of images) {
    const promise = (async () => {
      // Use the semaphore properly with the function pattern
      return await semaphore(async () => {
        try {
          // Create clean filename from image title
          const filename = image.title
            ? `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
            : `image_${image.id}.jpg`;

          // Fetch image as blob
          const response = await fetch(image.url, {
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'pragma': 'no-cache',
              'cache-control': 'no-cache'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch ${image.url}: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          
          // Add to zip
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error downloading image ${image.id}:`, error);
        }
      });
    })();
    
    promises.push(promise);
  }

  // Wait for all downloads to complete
  await Promise.all(promises);
  
  // Generate and save zip
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
  
  saveAs(zipBlob, zipFilename);
}
