
/**
 * Network utilities for image downloads
 */

// Timeout configuration for downloads - reduces waiting time
export const FETCH_TIMEOUT = 30000; // 30 seconds timeout (reduced from 3 minutes)
export const MAX_RETRIES = 3; // Reduced from 5
export const RETRY_DELAY = 800; // Slightly reduced base delay

/**
 * Fetch with timeout and abort capabilities
 */
export async function fetchWithTimeout(
  url: string, 
  options = {}, 
  timeout = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a new options object with our signal and merge with passed options
  const fetchOptions = {
    ...options,
    signal,
    headers: {
      ...(options.headers || {}),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  };
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, fetchOptions);
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
