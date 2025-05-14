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
  options: RequestInit = {}, // Type the options parameter as RequestInit
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

/**
 * Transforme une URL standard en URL HD en supprimant le segment "/JPG/"
 * @param url L'URL originale 
 * @returns L'URL transformée pour le téléchargement HD
 */
export function transformToHDUrl(url: string): string {
  if (!url) return '';
  
  // Si l'URL contient déjà '/JPG/', on le supprime pour créer une URL HD
  if (url.includes('/JPG/')) {
    // Remplacer le segment "/JPG/" par "/"
    return url.replace('/JPG/', '/');
  }
  
  // Si l'URL ne contient pas le segment JPG, la retourner telle quelle
  return url;
}

/**
 * Vérifie si une URL est au format JPG
 * @param url L'URL à vérifier
 * @returns true si l'URL contient JPG, false sinon
 */
export function isJpgUrl(url: string): boolean {
  if (!url) return false;
  
  // Vérifier si l'URL contient le segment '/JPG/' caractéristique du format
  const hasJpgSegment = url.includes('/JPG/');
  
  // Vérifier si l'URL se termine par .jpg ou .jpeg (insensible à la casse)
  const hasJpgExtension = /\.(jpg|jpeg)$/i.test(url);
  
  return hasJpgSegment || hasJpgExtension;
}
