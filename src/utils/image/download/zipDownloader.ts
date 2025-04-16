/**
 * Utility for downloading multiple images as a zip file
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { fetchWithTimeout, FETCH_TIMEOUT, MAX_RETRIES, RETRY_DELAY, sleep } from './networkUtils';

interface ImageForZip {
  url: string;
  title: string;
  id: string | number;
}

// Constants for parallel downloads
const MAX_CONCURRENT_DOWNLOADS = 5; // Maximum number of concurrent downloads
const DOWNLOAD_CHUNK_SIZE = 10; // Number of images to process per batch

/**
 * Process a single image with retries and multiple fetch strategies
 */
async function processImage(image: ImageForZip): Promise<{image: ImageForZip, blob: Blob} | null> {
  if (!image.url) {
    console.error('Missing URL for image', image.id);
    return null;
  }
  
  // Use the direct URL from Supabase
  const originalUrl = image.url;
  let retries = 0;
  
  // First try: direct fetch with cors mode
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title || image.id}`);
        const delay = RETRY_DELAY * Math.pow(1.5, retries - 1); // Exponential backoff
        await sleep(delay);
      }
      
      const response = await fetchWithTimeout(originalUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*, */*;q=0.8',
          'Cache-Control': 'no-cache'
        }
      }, FETCH_TIMEOUT);
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error(`Empty blob received for image: ${image.title || image.id}`);
      }
      
      return { image, blob };
    } catch (error) {
      console.error(`Error downloading image ${image.title || image.id}:`, error);
      retries++;
    }
  }
  
  // If all retries failed
  console.error(`All download attempts failed for image: ${image.title || image.id}`);
  return null;
}

/**
 * Download multiple images as a ZIP file with parallel downloading
 */
export async function downloadImagesAsZip(images: ImageForZip[], zipFilename: string): Promise<void> {
  console.log('Starting ZIP download for', images.length, 'images');
  
  if (!images || images.length === 0) {
    console.error('No images provided for ZIP download');
    toast.error('Aucune image à télécharger');
    return;
  }
  
  const zip = new JSZip();
  let successCount = 0;
  let failureCount = 0;
  
  // Create a folder for the images
  const imgFolder = zip.folder('images');
  if (!imgFolder) {
    toast.error('Erreur lors de la création du fichier ZIP');
    return;
  }
  
  // Show initial loading toast
  toast.loading('Préparation du ZIP...', {
    id: 'zip-download',
    duration: Infinity
  });
  
  // Process images in batches to limit memory usage
  for (let i = 0; i < images.length; i += DOWNLOAD_CHUNK_SIZE) {
    const chunk = images.slice(i, i + DOWNLOAD_CHUNK_SIZE);
    
    // Create a semaphore for limiting concurrent downloads
    const semaphore = createSemaphore(MAX_CONCURRENT_DOWNLOADS);
    
    // Process multiple images in parallel with semaphore control
    const downloadPromises = chunk.map(image => 
      semaphore(() => processImage(image))
    );
    
    // Wait for all downloads in the batch to complete
    const results = await Promise.allSettled(downloadPromises);
    
    // Process the results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const { image, blob } = result.value;
        
        // Create a safe filename based on title or ID
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
        
        // Add the image to the ZIP
        imgFolder.file(`${safeTitle}.jpg`, blob);
        successCount++;
      } else {
        failureCount++;
        console.error(`Failed to download image:`, 
          result.status === 'rejected' ? result.reason : 'Unknown error',
          chunk[index]?.title || chunk[index]?.id || 'Unknown image'
        );
      }
    });
    
    // Update the loading message
    toast.loading(`Préparation du ZIP: ${successCount}/${images.length} images`, {
      id: 'zip-download',
      duration: Infinity
    });
  }
  
  try {
    if (successCount === 0) {
      toast.dismiss('zip-download');
      toast.error('Aucune image n\'a pu être téléchargée');
      return;
    }
    
    console.log(`Generating ZIP with ${successCount} images (${failureCount} failed)`);
    
    // Update message during ZIP generation
    toast.loading(`Compression du ZIP en cours...`, {
      id: 'zip-download',
      duration: Infinity
    });
    
    // Generate and download the ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 3 // Lower level for faster generation (1-9, 9 being most compressed but slower)
      }
    });
    
    toast.loading(`Téléchargement du ZIP en cours...`, {
      id: 'zip-download',
      duration: Infinity
    });
    
    saveAs(zipBlob, zipFilename);
    
    toast.dismiss('zip-download');
    
    if (failureCount > 0) {
      toast.success(`ZIP téléchargé avec ${successCount} images`, {
        description: `${failureCount} images n'ont pas pu être incluses`
      });
    } else {
      toast.success(`ZIP téléchargé avec ${successCount} images`);
    }
  } catch (error) {
    console.error('Error generating ZIP:', error);
    toast.dismiss('zip-download');
    toast.error('Erreur lors de la création du fichier ZIP');
  }
}

/**
 * Creates a semaphore to limit concurrent operations
 */
function createSemaphore(maxConcurrent: number) {
  let currentJobs = 0;
  const queue: (() => void)[] = [];
  
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (currentJobs >= maxConcurrent) {
      // Wait for an available slot
      await new Promise<void>(resolve => {
        queue.push(resolve);
      });
    }
    
    currentJobs++;
    
    try {
      return await fn();
    } finally {
      currentJobs--;
      
      // Allow next operation in queue
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) next();
      }
    }
  };
}
