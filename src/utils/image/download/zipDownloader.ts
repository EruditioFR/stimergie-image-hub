
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

// Constantes pour les téléchargements parallèles
const MAX_CONCURRENT_DOWNLOADS = 5; // Nombre maximum de téléchargements simultanés
const DOWNLOAD_CHUNK_SIZE = 10; // Nombre d'images à traiter par lot

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
  
  // Message initial
  toast.loading(`Préparation du ZIP: 0/${images.length} images`, {
    id: 'zip-download',
    duration: Infinity
  });
  
  // Traitement des images par lots pour limiter l'utilisation de la mémoire
  for (let i = 0; i < images.length; i += DOWNLOAD_CHUNK_SIZE) {
    const chunk = images.slice(i, i + DOWNLOAD_CHUNK_SIZE);
    
    // Traiter plusieurs images en parallèle
    const downloadPromises = chunk.map(image => processImage(image));
    
    // Attendre que tous les téléchargements du lot soient terminés
    const results = await Promise.allSettled(downloadPromises);
    
    // Traiter les résultats
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const { image, blob } = result.value;
        
        // Créer un nom de fichier sécurisé basé sur le titre ou l'ID
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
        
        // Ajouter l'image au ZIP
        imgFolder.file(`${safeTitle}.jpg`, blob);
        successCount++;
      } else {
        failureCount++;
        console.error(`Failed to download image:`, result.status === 'rejected' ? result.reason : 'Unknown error');
      }
    });
    
    // Mettre à jour le message de chargement
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
    
    // Mise à jour du message pendant la génération
    toast.loading(`Compression du ZIP en cours...`, {
      id: 'zip-download',
      duration: Infinity
    });
    
    // Generate and download the ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 3 // Niveau plus bas pour accélérer la génération (1-9, 9 étant le plus compressé mais plus lent)
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
 * Process a single image with retries
 */
async function processImage(image: ImageForZip): Promise<{image: ImageForZip, blob: Blob} | null> {
  if (!image.url) {
    console.error('Missing URL for image', image.id);
    return null;
  }
  
  console.log(`Processing image: ${image.title} (${image.url})`);
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title}`);
        const delay = RETRY_DELAY * Math.pow(1.5, retries - 1); // Exponential backoff
        await sleep(delay);
      }
      
      // Use direct URL and no-cors mode to bypass CORS restrictions
      const response = await fetchWithTimeout(image.url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        mode: 'no-cors', // Important pour éviter les problèmes CORS
      }, FETCH_TIMEOUT); // Timeout réduit pour éviter les blocages
      
      // For no-cors, we get an opaque response
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error("Empty blob received");
      }
      
      return { image, blob };
      
    } catch (error) {
      console.error(`Error downloading image ${image.title}:`, error);
      retries++;
      
      if (retries > MAX_RETRIES) {
        return null;
      }
    }
  }
  
  return null;
}
