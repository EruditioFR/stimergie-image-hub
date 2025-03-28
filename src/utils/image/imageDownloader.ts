
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
    // Properly encode URL components
    let encodedUrl = encodeURI(decodeURI(url));
    
    // Clean URL by removing query parameters
    const cleanUrl = encodedUrl.split('?')[0];
    
    console.log('Attempting to download image:', cleanUrl);
    
    // Create blob URL for download (most compatible method)
    try {
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = filename || 'image.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        toast.success('Téléchargement commencé');
      }, 100);
      
      console.log('Download initiated via anchor tag');
      return;
    } catch (anchorError) {
      console.warn('Anchor download failed, trying fetch method:', anchorError);
    }
    
    // Second try: fetch as blob and use saveAs
    try {
      const response = await fetch(cleanUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const blob = await response.blob();
      
      if (blob.size > 0) {
        // Generate default filename if not provided
        const downloadFilename = filename || 'image.jpg';
        
        saveAs(blob, downloadFilename);
        console.log('Download completed via fetch blob');
        toast.success('Image téléchargée');
        return;
      }
    } catch (fetchError) {
      console.warn('Fetch download failed, trying alternative method:', fetchError);
    }
    
    // Third attempt: Use iframe for download
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) throw new Error('Could not access iframe document');
      
      iframeDoc.open();
      iframeDoc.write(`<a href="${cleanUrl}" download="${filename || 'image.jpg'}" id="download-link">Download</a>`);
      iframeDoc.close();
      
      const downloadLink = iframeDoc.getElementById('download-link');
      if (downloadLink) {
        downloadLink.click();
        setTimeout(() => {
          document.body.removeChild(iframe);
          toast.success('Téléchargement commencé');
        }, 100);
        console.log('Download initiated via iframe');
        return;
      }
    } catch (iframeError) {
      console.warn('Iframe download failed:', iframeError);
    }
    
    // Final fallback: Open in new tab with instructions
    window.open(cleanUrl, '_blank');
    toast.info('Image ouverte dans un nouvel onglet', {
      description: 'Pour télécharger: maintenez l\'image et sélectionnez "Enregistrer l\'image"'
    });
    
  } catch (error) {
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
