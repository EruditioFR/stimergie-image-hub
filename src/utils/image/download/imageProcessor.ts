
import { toast } from 'sonner';
import { ImageForZip, DownloadResult } from './types';
import { 
  fetchWithTimeout, 
  FETCH_TIMEOUT, 
  MAX_RETRIES, 
  RETRY_DELAY, 
  sleep, 
  transformToHDUrl 
} from './networkUtils';

/**
 * Process a single image with retries and multiple fetch strategies
 */
export async function processImage(image: ImageForZip, isHDDownload = false): Promise<DownloadResult | null> {
  if (!image.url) {
    console.error('Missing URL for image', image.id);
    return null;
  }
  
  const originalUrl = image.url;
  console.log(`[processImage] Processing image ID: ${image.id}, Title: ${image.title}, HD mode: ${isHDDownload}`);
  console.log(`[processImage] Original URL: ${originalUrl}`);
  console.log(`[processImage] URL contains '/JPG/': ${originalUrl.includes('/JPG/')}`);
  
  // Transformer l'URL pour le téléchargement HD en supprimant /JPG/ si nécessaire
  const processUrl = isHDDownload ? transformToHDUrl(originalUrl) : originalUrl;
  
  console.log(`[processImage] Process URL after HD transformation: ${processUrl}`);
  console.log(`[processImage] Processed URL contains '/JPG/': ${processUrl.includes('/JPG/')}`);
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title || image.id}`);
        const delay = RETRY_DELAY * Math.pow(1.5, retries - 1);
        await sleep(delay);
      }
      
      // Utiliser l'URL transformée pour le téléchargement
      const fetchUrl = processUrl;
      console.log(`[processImage] Attempting fetch with URL: ${fetchUrl}`);
      
      const response = await fetchWithTimeout(fetchUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*, */*;q=0.8',
          'Cache-Control': 'no-cache'
        }
      }, FETCH_TIMEOUT);
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error(`Empty blob received for image: ${image.title || image.id}`);
      }
      
      console.log(`[processImage] Successfully downloaded image: ${image.title || image.id}, Size: ${blob.size} bytes`);
      return { image, blob };
    } catch (error) {
      console.error(`Error downloading image ${image.title || image.id}:`, error);
      retries++;
    }
  }
  
  console.error(`All download attempts failed for image: ${image.title || image.id}`);
  return null;
}
