
import { toast } from 'sonner';
import { ImageForZip, DownloadResult } from './types';
import { fetchWithTimeout, FETCH_TIMEOUT, MAX_RETRIES, RETRY_DELAY, sleep } from './networkUtils';

/**
 * Process a single image with retries and multiple fetch strategies
 */
export async function processImage(image: ImageForZip): Promise<DownloadResult | null> {
  if (!image.url) {
    console.error('Missing URL for image', image.id);
    return null;
  }
  
  const originalUrl = image.url;
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry ${retries}/${MAX_RETRIES} for image ${image.title || image.id}`);
        const delay = RETRY_DELAY * Math.pow(1.5, retries - 1);
        await sleep(delay);
      }
      
      const response = await fetchWithTimeout(originalUrl, {
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
      
      return { image, blob };
    } catch (error) {
      console.error(`Error downloading image ${image.title || image.id}:`, error);
      retries++;
    }
  }
  
  console.error(`All download attempts failed for image: ${image.title || image.id}`);
  return null;
}

