import { toast } from 'sonner';
import { transformToHDUrl, isJpgUrl } from './networkUtils';

export type ImageDownloadFormat = 'jpg' | 'png' | 'auto';

/**
 * Downloads an image from a given URL and saves it to the user's device
 */
export async function downloadImage(
  url: string, 
  filename: string, 
  format: ImageDownloadFormat = 'auto',
  isHD: boolean = false
): Promise<void> {
  if (!url) {
    console.error('Download failed: URL is empty');
    toast.error('Échec du téléchargement', {
      description: 'L\'URL de l\'image est manquante.'
    });
    throw new Error('URL is empty');
  }

  console.log(`[downloadImage] Downloading image from URL: ${url}`);
  console.log(`[downloadImage] URL contains '/JPG/': ${url.includes('/JPG/')}`);
  console.log(`[downloadImage] HD mode: ${isHD}`);
  
  // Si c'est un téléchargement HD, transformer l'URL en supprimant /JPG/
  const downloadUrl = isHD ? transformToHDUrl(url) : url;
  
  console.log(`[downloadImage] Final download URL: ${downloadUrl}`);
  console.log(`[downloadImage] Final URL contains '/JPG/': ${downloadUrl.includes('/JPG/')}`);
  console.log(`[downloadImage] Saving as filename: ${filename}`);
  
  try {
    // Determine file extension based on format parameter or fallback to URL
    let fileExtension = '';
    
    if (format === 'jpg') {
      fileExtension = '.jpg';
    } else if (format === 'png') {
      fileExtension = '.png';
    } else {
      // Auto-determine from URL or default to jpg (car ce sont majoritairement des JPG)
      if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') || url.includes('/JPG/')) {
        fileExtension = '.jpg';
      } else {
        fileExtension = '.jpg'; // Par défaut on privilégie JPG
      }
    }
    
    // Ensure filename has the correct extension
    const filenameWithExtension = filename.endsWith(fileExtension) 
      ? filename 
      : filename.replace(/\.[^.]+$/, '') + fileExtension;
    
    // Fetch the image - use exact URL without modification
    const response = await fetch(downloadUrl, { 
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'pragma': 'no-cache',
        'cache-control': 'no-cache'
      } 
    });
    
    if (!response || !response.ok) {
      throw new Error(`Server returned ${response?.status || 'no response'}`);
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Empty image data received');
    }
    
    // Create a download link and click it to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filenameWithExtension;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);
    
    console.log('[downloadImage] Download completed successfully');
    return;
  } catch (error) {
    console.error(`Error downloading image ${filename}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to download image: ${errorMessage} ${filename}`);
    
    toast.error('Échec du téléchargement', { 
      description: `Une erreur s'est produite: ${errorMessage}` 
    });
    
    throw error;
  }
}
