
/**
 * Utility functions for downloading individual images
 */

import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { clearAllCaches } from '../cacheManager';
import { fetchWithTimeout, FETCH_TIMEOUT, sleep } from './networkUtils';

/**
 * Download a single image with format options
 */
export type ImageDownloadFormat = 'original';

/**
 * Download a single image
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
    
    console.log(`Attempting to download image:`, cleanUrl);
    
    toast.loading('Téléchargement en cours...');
    
    // Primary download method: Using fetch with no-cors mode and retry logic
    try {
      // Always use no-cors mode to avoid CORS issues with the Stimergie server
      const response = await fetchWithTimeout(cleanUrl, {
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
      const defaultFilename = `image.jpg`;
      let finalFilename = filename || defaultFilename;
      
      // Ensure the filename has the correct extension
      if (!finalFilename.endsWith('.jpg') && !finalFilename.endsWith('.png')) {
        finalFilename = finalFilename.replace(/\.[^.]+$/, '.jpg') || `image.jpg`;
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
      form.action = cleanUrl;
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
    window.open(cleanUrl, '_blank');
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
