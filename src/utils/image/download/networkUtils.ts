
/**
 * Network utilities for image downloads
 */

// Timeout configuration for large downloads
export const FETCH_TIMEOUT = 180000; // 3 minutes timeout for large files
export const MAX_RETRIES = 5;
export const RETRY_DELAY = 1000; // 1 second

/**
 * Fetch with timeout and retry logic for large files
 */
export async function fetchWithTimeout(
  url: string, 
  options = {}, 
  timeout = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sleep utility for retry delays with exponential backoff
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
