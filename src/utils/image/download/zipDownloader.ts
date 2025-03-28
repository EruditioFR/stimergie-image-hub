
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

/**
 * Download multiple images as a ZIP file
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
  
  // Process each image with retries
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    if (!image.url) {
      console.error('Missing URL for image', image.id);
      failureCount++;
      continue;
    }
    
    console.log(`Processing image ${i+1}/${images.length}: ${image.title} (${image.url})`);
    
    let success = false;
    let retries = 0;
    
    while (!success && retries <= MAX_RETRIES) {
      try {
        if (retries > 0) {
          console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title}`);
          const delay = RETRY_DELAY * Math.pow(2, retries - 1); // Exponential backoff
          await sleep(delay);
        }
        
        // Use no-cors mode to bypass CORS restrictions
        const response = await fetchWithTimeout(image.url, {
          method: 'GET',
          mode: 'no-cors', // Important: Set to no-cors to bypass CORS restrictions
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'follow',
        }, FETCH_TIMEOUT * 2); // Double timeout for large images
        
        // For no-cors, we get an opaque response
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error("Empty blob received");
        }
        
        // Create a safe filename based on the title or ID
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
        
        // Add the image to the ZIP
        imgFolder.file(`${safeTitle}.jpg`, blob);
        
        success = true;
        successCount++;
        console.log(`Added image ${safeTitle} to ZIP (${successCount}/${images.length})`);
      } catch (error) {
        console.error(`Error downloading image ${image.title}:`, error);
        retries++;
        
        if (retries > MAX_RETRIES) {
          failureCount++;
          console.error(`Failed to download image ${image.title} after ${MAX_RETRIES} retries`);
        }
      }
    }
    
    // Update loading message every 5 images or for the last one
    if (i % 5 === 0 || i === images.length - 1) {
      toast.loading(`Préparation du ZIP: ${successCount}/${images.length} images`, {
        id: 'zip-download',
        duration: Infinity
      });
    }
  }
  
  try {
    if (successCount === 0) {
      toast.dismiss('zip-download');
      toast.error('Aucune image n\'a pu être téléchargée');
      return;
    }
    
    console.log(`Generating ZIP with ${successCount} images (${failureCount} failed)`);
    
    // Generate and download the ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // Balanced between size and speed
      }
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
