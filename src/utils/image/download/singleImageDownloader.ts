
/**
 * Utility functions for downloading individual images
 */

import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { clearAllCaches } from '../cacheManager';
import { fetchWithTimeout, FETCH_TIMEOUT, sleep } from './networkUtils';

/**
 * Format options for image downloads
 */
export type ImageDownloadFormat = 'jpg' | 'png' | 'original';

/**
 * Download a single image with format options
 */
export async function downloadImage(
  url: string, 
  filename?: string, 
  format: ImageDownloadFormat = 'original'
): Promise<void> {
  try {
    // Clear any cached data first to ensure fresh downloads
    clearAllCaches();
    
    // Clean URL and prepare for download
    const cleanUrl = url;
    
    // Convert URL to PNG format if requested
    let downloadUrl = cleanUrl;
    let fileExtension = 'jpg';
    
    if (format === 'png') {
      // If it's a Stimergie URL, modify to access the PNG version
      if (url.includes('stimergie.fr') && !url.includes('/PNG/')) {
        downloadUrl = url.replace(/\/([^\/]+)\.jpg$/, '/PNG/$1.png');
        fileExtension = 'png';
      } else if (!url.includes('PNG') && !url.includes('.png')) {
        // For other URLs, just change the extension if it's not already PNG
        downloadUrl = url.replace(/\.(jpg|jpeg|webp)$/, '.png');
        fileExtension = 'png';
      }
    }
    
    console.log(`Attempting direct download image in ${format} format:`, downloadUrl);
    
    toast.loading('Téléchargement en cours...');
    
    // Primary download method: Using fetch with no-cors mode and retry logic
    try {
      // Always use no-cors mode to avoid CORS issues with the Stimergie server
      const response = await fetchWithTimeout(downloadUrl, {
        method: 'GET',
        mode: 'no-cors', // Important: Set to no-cors to bypass CORS restrictions
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      // For no-cors, we get an opaque response, we can't check status
      // Convert response to blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error("Empty blob received");
      }
      
      // Create filename with correct extension if not provided
      const defaultFilename = `image.${fileExtension}`;
      let finalFilename = filename || defaultFilename;
      
      // Ensure the filename has the correct extension
      if (format === 'png' && !finalFilename.endsWith('.png')) {
        finalFilename = finalFilename.replace(/\.[^.]+$/, '.png') || `image.png`;
      }
      
      // Use file-saver to trigger the download
      saveAs(blob, finalFilename);
      
      toast.dismiss();
      toast.success('Téléchargement réussi');
      return;
    } catch (fetchError) {
      console.warn('Primary download method failed:', fetchError);
      // Continue to fallback method
    }
    
    // Fallback method: Using a direct link with iframe
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = downloadUrl;
      form.target = '_blank';
      
      document.body.appendChild(form);
      form.submit();
      
      // Remove the elements
      setTimeout(() => {
        document.body.removeChild(iframe);
        document.body.removeChild(form);
        toast.dismiss();
        toast.success('Téléchargement commencé');
      }, 1000);
      
      return;
    } catch (directError) {
      console.warn('Direct link download failed:', directError);
    }
    
    // Last fallback: Using window.open
    window.open(downloadUrl, '_blank');
    toast.dismiss();
    toast.success('Téléchargement demandé');
    
  } catch (error) {
    toast.dismiss();
    console.error('Error downloading image:', error);
    toast.error('Erreur lors du téléchargement', {
      description: 'Impossible de télécharger cette image.'
    });
  }
}
