
/**
 * Utility functions for image downloading
 */

import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { clearAllCaches } from './cacheManager';

// CORS proxy options - maintenant optionnel
const CORS_PROXY_URL = 'https://corsproxy.io/?';

// Timeout configuration for large downloads
const FETCH_TIMEOUT = 120000; // 2 minutes timeout for large files
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

/**
 * Download a single image
 */
export async function downloadImage(url: string, filename?: string): Promise<void> {
  try {
    // Clear any cached data first to ensure fresh downloads
    clearAllCaches();
    
    // Clean and encode URL
    const cleanUrl = url;
    
    console.log('Attempting to download image:', cleanUrl);
    
    toast.loading('Téléchargement en cours...');
    
    try {
      // Using fetch with blob() and saveAs for most reliable download method
      const response = await fetch(cleanUrl, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Use file-saver to trigger the download
      saveAs(blob, filename || 'image.jpg');
      
      toast.dismiss();
      toast.success('Téléchargement réussi');
      return;
    } catch (fetchError) {
      console.warn('Primary download method failed:', fetchError);
      // Continue to fallback methods
    }
    
    // Fallback method: Using a download link with blob URL
    try {
      const response = await fetch(cleanUrl, { 
        mode: 'no-cors',
        cache: 'no-store' 
      });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'image.jpg';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        toast.dismiss();
        toast.success('Téléchargement réussi');
      }, 100);
      
      return;
    } catch (blobError) {
      console.warn('Blob URL download failed:', blobError);
      // Try final fallback
    }
    
    // Last fallback: Direct link with download attribute
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.download = filename || 'image.jpg';
    link.target = '_blank'; // This should be removed to prevent opening in new tab
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      toast.dismiss();
      toast.success('Téléchargement commencé');
    }, 100);
    
  } catch (error) {
    toast.dismiss();
    console.error('Error downloading image:', error);
    toast.error('Erreur lors du téléchargement', {
      description: 'Impossible de télécharger cette image.'
    });
  }
}

/**
 * Fetch with timeout and retry logic for large files
 */
async function fetchWithTimeout(url: string, options = {}, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ensure a URL uses CORS proxy if needed
 */
function ensureCorsProxyForStimergieUrls(url: string): string {
  // Si l'URL est déjà proxy-fiée, ne rien changer
  if (url.includes('corsproxy.io')) {
    return url;
  }
  
  // Si c'est une URL Stimergie, ajouter le proxy CORS
  if (url.includes('stimergie.fr')) {
    return `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
  }
  
  // Sinon retourner l'URL telle quelle
  return url;
}

/**
 * Download multiple images as a ZIP file
 */
export async function downloadImagesAsZip(images: Array<{
  url: string;
  title?: string;
  id?: string | number;
}>, zipFilename: string = 'images.zip'): Promise<void> {
  try {
    toast.loading('Création du fichier ZIP en cours...', {
      id: 'creating-zip',
      duration: 120000 // Allow up to 2 minutes for large files
    });
    
    const zip = new JSZip();
    const folder = zip.folder('images');
    
    // If folder is null, throw an error
    if (!folder) {
      throw new Error('Failed to create folder in ZIP file');
    }
    
    // Download each image and add to ZIP
    const downloadPromises = images.map(async (image, index) => {
      try {
        // Préserver l'URL exacte sans la modifier
        const originalUrl = image.url;
        
        // Ajouter le proxy CORS si nécessaire
        const proxiedUrl = ensureCorsProxyForStimergieUrls(originalUrl);
        
        console.log(`Processing image ${index + 1}/${images.length}: ${originalUrl}`);
        console.log(`Using proxied URL: ${proxiedUrl}`);
        
        // Generate a unique filename
        let filename = `image_${index + 1}.jpg`;
        
        // Use provided title or ID for filename if available
        if (image.title) {
          // Clean the title for use as a filename
          filename = image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          // Determine extension from URL
          if (originalUrl.toLowerCase().endsWith('.png')) {
            filename += '.png';
          } else if (originalUrl.toLowerCase().endsWith('.svg')) {
            filename += '.svg';
          } else {
            filename += '.jpg';
          }
        } else if (image.id) {
          filename = `image_${image.id}.jpg`;
        }
        
        // Fetch the image with retry mechanism
        let blob: Blob | null = null;
        let attempts = 0;
        const maxAttempts = MAX_RETRIES;
        
        while (attempts < maxAttempts && !blob) {
          attempts++;
          try {
            console.log(`Attempt ${attempts}/${maxAttempts} to fetch image: ${proxiedUrl}`);
            
            const response = await fetchWithTimeout(proxiedUrl, {
              method: 'GET',
              credentials: 'omit',
              cache: 'no-store',
              redirect: 'follow',
              headers: {
                'Cache-Control': 'no-cache',
              }
            }, FETCH_TIMEOUT);
            
            if (!response.ok && response.type !== 'opaque') {
              console.warn(`Failed to fetch image on attempt ${attempts}: ${response.status} ${response.statusText}`);
              
              if (attempts < maxAttempts) {
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempts - 1)));
              }
              continue;
            }
            
            blob = await response.blob();
            
            if (blob.size === 0) {
              console.warn(`Image blob is empty, retrying... (${attempts}/${maxAttempts})`);
              blob = null;
              
              if (attempts < maxAttempts) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempts - 1)));
              }
              continue;
            }
            
            console.log(`Successfully downloaded image: ${filename} (${blob.size} bytes, type: ${blob.type})`);
          } catch (fetchError) {
            console.error(`Error fetching image on attempt ${attempts}:`, fetchError);
            
            if (attempts < maxAttempts) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempts - 1)));
            }
          }
        }
        
        if (!blob) {
          throw new Error(`Failed to download image after ${maxAttempts} attempts`);
        }
        
        // Add the image to the ZIP file
        folder.file(filename, blob);
        console.log(`Added to ZIP: ${filename} (${blob.size} bytes)`);
        
        return true;
      } catch (error) {
        console.error(`Error downloading image ${image.url}:`, error);
        return false;
      }
    });
    
    // Wait for all downloads to complete
    const results = await Promise.all(downloadPromises);
    const successCount = results.filter(success => success).length;
    
    // Log folder contents for debugging
    console.log("ZIP folder structure:");
    const fileList = Object.keys(folder.files);
    fileList.forEach(filename => {
      // Using the JSZip API to safely check file size
      const zipFile = folder.files[filename];
      const fileSize = zipFile ? "file present" : "unknown";
      console.log(`- ${filename}: ${fileSize}`);
    });
    
    if (fileList.length === 0) {
      console.error("No files were added to the ZIP");
      toast.dismiss('creating-zip');
      toast.error("Erreur lors de la création du ZIP", {
        description: "Aucune image n'a pu être téléchargée."
      });
      return;
    }
    
    // Generate the ZIP file with compression options for large files
    console.log("Generating ZIP file...");
    toast.loading("Compression des images en cours...", { 
      id: "compressing-zip",
      duration: 120000 // 2 minutes timeout for compression
    });
    
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (metadata) => {
      const percent = Math.floor(metadata.percent);
      if (percent % 10 === 0) {
        console.log(`ZIP compression: ${percent}%`);
      }
    });
    
    console.log(`ZIP file created: ${zipBlob.size} bytes`);
    toast.dismiss('creating-zip');
    toast.dismiss('compressing-zip');
    
    // Download the ZIP file
    saveAs(zipBlob, zipFilename);
    
    toast.success(`ZIP créé avec succès`, {
      description: `${successCount} image(s) sur ${images.length} téléchargée(s).`
    });
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    toast.dismiss('creating-zip');
    toast.dismiss('compressing-zip');
    toast.error('Erreur lors de la création du ZIP', {
      description: 'Impossible de créer l\'archive ZIP.'
    });
  }
}
