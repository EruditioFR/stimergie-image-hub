
// Network utilities for download operations
export const FETCH_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second delay between retries

/**
 * Sleep function to pause execution
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Transforms a standard URL to an HD URL by removing the /JPG/ segment
 */
export const transformToHDUrl = (url: string): string => {
  if (!url) return url;
  
  // If URL contains /JPG/ segment, remove it to get the HD version
  if (url.includes('/JPG/')) {
    return url.replace('/JPG/', '/');
  }
  
  return url;
};

/**
 * Checks if a URL is for a JPG image
 */
export const isJpgUrl = (url: string): boolean => {
  if (!url) return false;
  
  return url.toLowerCase().includes('.jpg') || 
         url.toLowerCase().includes('.jpeg') || 
         url.includes('/JPG/');
};

/**
 * Fetches URL with timeout
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([
    fetch(url, { ...options, signal }),
    timeoutPromise
  ]) as Promise<Response>;
}

/**
 * Fetches with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<Response> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${url}`);
        await sleep(delayMs * attempt); // Progressive delay
      }
      
      const response = await fetchWithTimeout(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch error (attempt ${attempt + 1}/${retries + 1}):`, error);
      lastError = error as Error;
    }
  }
  
  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}
