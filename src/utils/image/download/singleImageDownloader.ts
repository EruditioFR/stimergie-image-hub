
import { toast } from 'sonner';

export type ImageDownloadFormat = 'jpg' | 'png' | 'auto';

/**
 * Downloads an image from a given URL and saves it to the user's device
 * @param url URL of the image to download
 * @param filename Filename to use for the saved file
 * @param format Optional format to enforce for the downloaded file
 */
export async function downloadImage(url: string, filename: string, format: ImageDownloadFormat = 'auto'): Promise<void> {
  if (!url) {
    console.error('Download failed: URL is empty');
    toast.error('Échec du téléchargement', {
      description: 'L\'URL de l\'image est manquante.'
    });
    throw new Error('URL is empty');
  }

  console.log(`Downloading image from URL: ${url}`);
  console.log(`Saving as filename: ${filename}`);
  
  try {
    // Determine file extension based on format parameter or fallback to URL
    let fileExtension = '';
    
    if (format === 'jpg') {
      fileExtension = '.jpg';
    } else if (format === 'png') {
      fileExtension = '.png';
    } else {
      // Auto-determine from URL or default to png
      if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
        fileExtension = '.jpg';
      } else {
        fileExtension = '.png'; // Default to PNG
      }
    }
    
    // Ensure filename has the correct extension
    const filenameWithExtension = filename.endsWith(fileExtension) 
      ? filename 
      : filename.replace(/\.[^.]+$/, '') + fileExtension;
    
    // Fetch the image
    const response = await fetch(url, { 
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
    
    console.log('Download completed successfully');
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
