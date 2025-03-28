/**
 * Utility functions for image downloading
 */

import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Download a single image
 */
export async function downloadImage(url: string, filename?: string): Promise<void> {
  try {
    // Clean and encode URL
    let encodedUrl = encodeURI(decodeURI(url));
    const cleanUrl = encodedUrl.split('?')[0];
    
    console.log('Attempting to download image:', cleanUrl);
    
    // Primary download method: Fetch and use saveAs (most reliable on Chrome)
    try {
      toast.loading('Téléchargement en cours...');
      
      const response = await fetch(cleanUrl, {
        method: 'GET',
        mode: 'no-cors',
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
    
    // Second attempt: Use download attribute with anchor tag
    try {
      toast.loading('Téléchargement en cours...');
      
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = filename || 'image.jpg';
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
    
    // Third attempt: Use Blob URL with saveAs
    try {
      toast.loading('Téléchargement en cours...');
      
      // For cross-origin images that fail with fetch, try XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('GET', cleanUrl, true);
      xhr.responseType = 'blob';
      xhr.onload = function() {
        if (this.status === 200) {
          const blobUrl = URL.createObjectURL(this.response);
          const downloadFilename = filename || 'image.jpg';
          
          saveAs(this.response, downloadFilename);
          
          // Clean up the Blob URL
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          
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
    
    // Final fallback: Open in new tab with instructions
    toast.dismiss();
    window.open(cleanUrl, '_blank');
    toast.info('Image ouverte dans un nouvel onglet', {
      description: 'Pour télécharger: clic droit sur l\'image et sélectionnez "Enregistrer l\'image sous..."'
    });
    
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
