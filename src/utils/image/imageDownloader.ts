
/**
 * Utility functions for image downloading
 */

import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { clearAllCaches } from './cacheManager';

/**
 * Download a single image
 */
export async function downloadImage(url: string, filename?: string): Promise<void> {
  try {
    // Clear any cached data first to ensure fresh downloads
    clearAllCaches();
    
    // Clean and encode URL
    let encodedUrl = encodeURI(decodeURI(url));
    const cleanUrl = encodedUrl.split('?')[0];
    
    console.log('Attempting to download image:', cleanUrl);
    
    // Primary download method: Fetch and use saveAs (most reliable on Chrome)
    try {
      toast.loading('Téléchargement en cours...');
      
      const response = await fetch(cleanUrl, {
        method: 'GET',
        mode: 'cors', // Try with cors first, not no-cors
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const blob = await response.blob();
      
      if (blob.size > 0) {
        const downloadFilename = filename || 'image.jpg';
        saveAs(blob, downloadFilename);
        console.log('Download completed via fetch blob');
        toast.dismiss();
        toast.success('Image téléchargée');
        return;
      } else {
        toast.dismiss();
        console.warn('Blob size was 0, trying alternative method');
      }
    } catch (fetchError) {
      toast.dismiss();
      console.warn('Fetch download failed, trying alternative method:', fetchError);
    }
    
    // Second attempt: Try a direct download link with download attribute
    try {
      toast.loading('Téléchargement en cours...');
      
      // Create a download link with the 'download' attribute
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = filename || 'image.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      // Force download attribute to work by embedding in document
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        toast.dismiss();
        toast.success('Téléchargement commencé');
      }, 100);
      
      console.log('Download initiated via anchor tag');
      return;
    } catch (anchorError) {
      toast.dismiss();
      console.warn('Anchor download failed, trying next method:', anchorError);
    }
    
    // Third attempt: Use file-saver directly with a new fetch
    try {
      toast.loading('Téléchargement en cours...');
      
      // Create a new Blob URL from the original URL
      const xhr = new XMLHttpRequest();
      xhr.open('GET', cleanUrl, true);
      xhr.responseType = 'blob';
      xhr.onload = function() {
        if (this.status === 200) {
          const downloadFilename = filename || 'image.jpg';
          saveAs(new Blob([this.response]), downloadFilename);
          
          toast.dismiss();
          toast.success('Image téléchargée');
          console.log('Download completed via XHR blob');
        } else {
          throw new Error(`XHR failed with status ${this.status}`);
        }
      };
      xhr.onerror = function() {
        throw new Error('XHR network error');
      };
      xhr.send();
      return;
    } catch (xhrError) {
      toast.dismiss();
      console.warn('XHR download failed, falling back to final method:', xhrError);
    }
    
    // Final fallback: Use Content-Disposition header with a dynamically created iframe
    try {
      toast.loading('Téléchargement en cours...');
      
      // Create a hidden form that targets a hidden iframe to force download
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = cleanUrl;
      form.style.display = 'none';
      
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'download';
      hiddenInput.value = '1';
      form.appendChild(hiddenInput);
      
      const iframe = document.createElement('iframe');
      iframe.name = 'download_iframe_' + Date.now();
      iframe.style.display = 'none';
      form.target = iframe.name;
      
      document.body.appendChild(form);
      document.body.appendChild(iframe);
      
      form.submit();
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        toast.dismiss();
        toast.success('Téléchargement commencé');
      }, 1000);
      
      return;
    } catch (formError) {
      toast.dismiss();
      console.warn('Form download failed, last resort:', formError);
      
      // Last resort: Fallback to blob URL with a download attribute
      try {
        const blob = new Blob([''], { type: 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'image.jpg';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        // Add a hidden form field to redirect to the actual URL with download flag
        link.setAttribute('data-downloadurl', cleanUrl);
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          
          // After the click, try to redirect to the real URL
          window.location.href = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'download=1';
          
          toast.dismiss();
          toast.success('Téléchargement commencé');
        }, 100);
        
        return;
      } catch (blobUrlError) {
        toast.dismiss();
        console.warn('Blob URL download failed:', blobUrlError);
        
        // Absolute last resort: Open in new tab with download instructions
        window.open(cleanUrl, '_blank');
        toast.info('Image ouverte dans un nouvel onglet', {
          description: 'Pour télécharger: clic droit sur l\'image et sélectionnez "Enregistrer l\'image sous..."'
        });
      }
    }
  } catch (error) {
    toast.dismiss();
    console.error('Error downloading image:', error);
    toast.error('Erreur lors du téléchargement', {
      description: 'Impossible de télécharger cette image. Essayez d\'ouvrir l\'image dans un nouvel onglet, puis de l\'enregistrer manuellement.'
    });
  }
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
    toast.info('Création du fichier ZIP en cours...');
    
    const zip = new JSZip();
    const folder = zip.folder('images');
    
    // If folder is null, throw an error
    if (!folder) {
      throw new Error('Failed to create folder in ZIP file');
    }
    
    // Download each image and add to ZIP
    const downloadPromises = images.map(async (image, index) => {
      try {
        // Clean URL by removing query parameters
        const cleanUrl = image.url.split('?')[0];
        
        // Generate a unique filename
        let filename = `image_${index + 1}.jpg`;
        
        // Use provided title or ID for filename if available
        if (image.title) {
          // Clean the title for use as a filename
          filename = image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg';
        } else if (image.id) {
          filename = `image_${image.id}.jpg`;
        }
        
        // Fetch the image
        const response = await fetch(cleanUrl, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-store',
          redirect: 'follow',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Add the image to the ZIP file
        folder.file(filename, blob);
        
        return true;
      } catch (error) {
        console.error(`Error downloading image ${image.url}:`, error);
        return false;
      }
    });
    
    // Wait for all downloads to complete
    const results = await Promise.all(downloadPromises);
    const successCount = results.filter(success => success).length;
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download the ZIP file
    saveAs(zipBlob, zipFilename);
    
    toast.success(`ZIP créé avec succès`, {
      description: `${successCount} image(s) sur ${images.length} téléchargée(s).`
    });
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    toast.error('Erreur lors de la création du ZIP', {
      description: 'Impossible de créer l\'archive ZIP.'
    });
  }
}
