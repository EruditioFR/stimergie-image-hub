
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
    console.error('[processImage] Missing URL for image', image.id);
    return null;
  }
  
  const originalUrl = image.url;
  console.log(`[processImage] Processing image ID: ${image.id}, Title: ${image.title}, HD mode: ${isHDDownload}`);
  console.log(`[processImage] Original URL: ${originalUrl}`);
  
  // Log if URL contains /JPG/ segment (important for HD downloads)
  if (originalUrl.includes('/JPG/')) {
    console.log(`[processImage] URL contains '/JPG/' segment, which is expected for SD downloads but not for HD`);
  }
  
  // Transformer l'URL pour le téléchargement HD en supprimant /JPG/ si nécessaire
  const processUrl = isHDDownload ? transformToHDUrl(originalUrl) : originalUrl;
  
  console.log(`[processImage] Process URL after transformation: ${processUrl}`);
  console.log(`[processImage] URL contains '/JPG/' after transformation: ${processUrl.includes('/JPG/')}`);
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`[processImage] Retry ${retries}/${MAX_RETRIES} for image ${image.title || image.id}`);
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
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 Image Downloader/2.0',
          'Referer': 'https://www.stimergie.fr/'
        }
      }, FETCH_TIMEOUT);
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        console.error(`[processImage] Empty blob received for image: ${image.title || image.id}`);
        throw new Error(`Empty blob received for image: ${image.title || image.id}`);
      }
      
      // Verify that the downloaded blob is actually an image
      if (!blob.type.startsWith('image/')) {
        console.warn(`[processImage] Downloaded blob may not be an image. Type: ${blob.type}`);
        
        // We'll continue anyway since some servers might not set the correct Content-Type
      }
      
      console.log(`[processImage] Successfully downloaded image: ${image.title || image.id}, Size: ${Math.round(blob.size / 1024)}KB, Type: ${blob.type}`);
      return { image, blob };
    } catch (error) {
      console.error(`[processImage] Error downloading image ${image.title || image.id}:`, error);
      retries++;
      
      // If it's the last retry and we've been trying with an HD URL, fall back to SD URL
      if (retries === MAX_RETRIES && isHDDownload && originalUrl !== processUrl) {
        console.log(`[processImage] Final attempt with original SD URL: ${originalUrl}`);
        try {
          const response = await fetchWithTimeout(originalUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-store',
            credentials: 'omit',
            headers: {
              'Accept': 'image/*, */*;q=0.8',
              'Cache-Control': 'no-cache',
              'User-Agent': 'Mozilla/5.0 Image Downloader/2.0',
              'Referer': 'https://www.stimergie.fr/'
            }
          }, FETCH_TIMEOUT);
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error(`Empty blob received for fallback image: ${image.title || image.id}`);
          }
          
          console.log(`[processImage] Successfully downloaded fallback image: ${image.title || image.id}, Size: ${Math.round(blob.size / 1024)}KB, Type: ${blob.type}`);
          return { image, blob };
        } catch (fallbackError) {
          console.error(`[processImage] Fallback download also failed:`, fallbackError);
        }
      }
    }
  }
  
  console.error(`[processImage] All download attempts failed for image: ${image.title || image.id}`);
  return null;
}
