
/**
 * Utility functions for downloading individual images
 */

import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { clearAllCaches } from '../cacheManager';

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
