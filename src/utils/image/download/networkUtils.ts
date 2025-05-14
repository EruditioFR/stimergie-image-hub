
/**
 * Vérifie si une URL pointe vers une image JPG
 * @param url URL à vérifier
 * @returns boolean
 */
export function isJpgUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Vérifier si l'URL contient le segment /JPG/ ou se termine par .jpg ou .jpeg
    const lowercaseUrl = url.toLowerCase();
    
    return (
      lowercaseUrl.includes('/jpg/') || 
      lowercaseUrl.endsWith('.jpg') || 
      lowercaseUrl.endsWith('.jpeg')
    );
  } catch (error) {
    console.warn('Erreur lors de la vérification du format JPG:', error);
    return false;
  }
}

/**
 * Transforme une URL JPG standard en URL HD en supprimant le segment /JPG/
 * @param url URL JPG à transformer
 * @returns URL HD
 */
export function transformToHDUrl(url: string): string {
  if (url && url.includes('/JPG/')) {
    return url.replace('/JPG/', '/');
  }
  return url;
}

/**
 * Options pour les requêtes fetch
 */
export const fetchOptions = {
  headers: {
    'Accept': 'image/jpeg,image/jpg,image/*',
    'User-Agent': 'Image Downloader Client'
  },
  mode: 'cors' as RequestMode,
  cache: 'no-store' as RequestCache
};

/**
 * Constants for request timeouts and retries
 */
export const FETCH_TIMEOUT = 30000; // 30 seconds timeout
export const MAX_RETRIES = 3; // Number of retry attempts
export const RETRY_DELAY = 1000; // Base delay in ms between retries

/**
 * Sleep utility function to pause execution
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout functionality
 * @param resource The resource to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 */
export async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}
