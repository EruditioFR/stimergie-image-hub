
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { ImageForZip } from './types';
import { processImage } from './imageProcessor';
import { createSemaphore } from './semaphore';

// Constants for parallel downloads
const MAX_CONCURRENT_DOWNLOADS = 5;
const DOWNLOAD_CHUNK_SIZE = 10;

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
  
  const imgFolder = zip.folder('images');
  if (!imgFolder) {
    toast.error('Erreur lors de la création du fichier ZIP');
    return;
  }
  
  toast.loading('Préparation du ZIP...', {
    id: 'zip-download',
    duration: Infinity
  });
  
  for (let i = 0; i < images.length; i += DOWNLOAD_CHUNK_SIZE) {
    const chunk = images.slice(i, i + DOWNLOAD_CHUNK_SIZE);
    const semaphore = createSemaphore(MAX_CONCURRENT_DOWNLOADS);
    
    const downloadPromises = chunk.map(image => 
      semaphore(() => processImage(image))
    );
    
    const results = await Promise.allSettled(downloadPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const { image, blob } = result.value;
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
        
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
    
    toast.loading(`Compression du ZIP en cours...`, {
      id: 'zip-download',
      duration: Infinity
    });
    
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 3
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

