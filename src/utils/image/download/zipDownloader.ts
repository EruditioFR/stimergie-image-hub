
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

/**
 * Process a single image with retries and multiple fetch strategies
 */
async function processImage(image: ImageForZip): Promise<{image: ImageForZip, blob: Blob} | null> {
  if (!image.url) {
    console.error('Missing URL for image', image.id);
    return null;
  }
  
  const originalUrl = image.url;
  
  // First try: XMLHttpRequest with credentials option for better CORS handling
  try {
    console.log(`Trying XMLHttpRequest for image: ${image.title || image.id}`);
    const blob = await fetchWithXHR(originalUrl);
    if (blob && blob.size > 0) {
      return { image, blob };
    }
  } catch (error) {
    console.warn(`XMLHttpRequest failed for ${image.title || image.id}:`, error);
  }
  
  // Second try: Using fetch API with different modes
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title || image.id}`);
        const delay = RETRY_DELAY * Math.pow(1.5, retries - 1); // Exponential backoff
        await sleep(delay);
      }
      
      // Try different modes based on retry attempt
      const mode = retries === MAX_RETRIES ? 'no-cors' : 'cors';
      
      // Use direct URL and appropriate mode based on retry count
      const response = await fetchWithTimeout(originalUrl, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        mode: mode as RequestMode,
        headers: {
          'Accept': 'image/*, */*;q=0.8',
          'Cache-Control': 'no-cache',
        }
      }, FETCH_TIMEOUT);
      
      // For no-cors, we get an opaque response
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
  
  // Final attempt: use Image element with canvas approach for CORS-friendly image loading
  try {
    console.log(`Using Image/Canvas approach for ${image.title || image.id}`);
    const blob = await loadImageViaCanvas(originalUrl);
    if (blob) {
      return { image, blob };
    }
  } catch (error) {
    console.error(`Canvas approach failed for ${image.title || image.id}:`, error);
  }
  
  // All methods failed
  return null;
}

/**
 * Fetch image using XMLHttpRequest for better CORS handling
 */
function fetchWithXHR(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.withCredentials = false;
    xhr.timeout = FETCH_TIMEOUT;
    
    // Set headers
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('Accept', 'image/*, */*;q=0.8');
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error(`Empty blob from XMLHttpRequest`));
        }
      } else {
        reject(new Error(`HTTP error ${xhr.status}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('XHR network error'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('XHR timeout'));
    };
    
    xhr.send();
  });
}

/**
 * Load image via Image element and Canvas to bypass CORS
 */
function loadImageViaCanvas(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), FETCH_TIMEOUT);
    
    // Setting crossOrigin to anonymous might help with CORS if the server supports it
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to blob
        canvas.toBlob(blob => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Generated empty blob'));
          }
        }, 'image/jpeg', 0.9);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load image'));
    };
    
    // Try to load the image with cache-busting query parameter
    img.src = `${url}${url.includes('?') ? '&' : '?'}nocache=${Date.now()}`;
  });
}
