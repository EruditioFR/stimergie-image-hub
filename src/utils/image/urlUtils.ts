
/**
 * URL related utility functions
 */

// Available CORS proxies for rotation
const PROXIES = [
  'https://images.weserv.nl/?url=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

// Cache for best proxies
const bestProxyCache = new Map<string, string>();

/**
 * Gets a proxied URL to bypass CORS issues with improved proxy selection
 */
export function getProxiedUrl(url: string, forceProxy: boolean = false): string {
  // Si l'URL est vide, retourner une chaîne vide
  if (!url) return '';

  // Don't proxy if not needed
  if (!forceProxy && (url.includes(window.location.hostname) || url.startsWith('blob:') || url.startsWith('data:'))) {
    return url;
  }
  
  // For problematic domains or when proxy is forced, always use proxy
  const domain = extractDomain(url);
  
  // Select the best proxy for this domain (cached or default)
  let proxyIndex = 0;
  if (bestProxyCache.has(domain)) {
    const bestProxy = bestProxyCache.get(domain)!;
    proxyIndex = PROXIES.indexOf(bestProxy);
    if (proxyIndex === -1) proxyIndex = 0;
  }
  
  const selectedProxy = PROXIES[proxyIndex];
  return `${selectedProxy}${encodeURIComponent(url)}`;
}

/**
 * Updates the best proxy for a domain based on successful fetches
 */
export function updateBestProxy(domain: string, proxyUrl: string): void {
  // Extract which proxy was used
  for (let i = 0; i < PROXIES.length; i++) {
    if (proxyUrl.startsWith(PROXIES[i])) {
      bestProxyCache.set(domain, PROXIES[i]);
      break;
    }
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return url;
  }
}

/**
 * Generate a placeholder URL for an image
 * @param url Original image URL
 * @param width Width of the placeholder
 * @returns A URL for a small placeholder version of the image
 */
export function getPlaceholderUrl(originalUrl: string | null, size: number = 20): string {
  // Toujours utiliser une image PNG de placeholder, jamais de SVG
  return `/placeholder.png?size=${size}`;
}

/**
 * Check if the image is likely to be a vector format (SVG)
 */
export function isVectorImage(url: string | null | undefined): boolean {
  return url && url.toLowerCase().endsWith('.svg');
}

/**
 * Vérifie et valide une URL d'image
 * @param url URL à vérifier
 * @returns URL originale ou URL corrigée si valide, null sinon
 */
export function validateImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Rejeter les URLs SVG et les placeholders
  if (url.includes('data:image/svg+xml') || url.includes('placeholder.svg') || url.includes('placeholder.png')) {
    console.warn('URL rejetée (placeholder):', url.substring(0, 50) + '...');
    return null;
  }
  
  // Vérifier si c'est déjà une URL valide
  try {
    new URL(url);
    
    // S'assurer que l'URL se termine par une extension d'image valide
    const urlLower = url.toLowerCase();
    const isPng = urlLower.endsWith('.png');
    const isJpg = urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg');
    
    // Vérifier si c'est une URL stimergie qui doit suivre le format spécifié
    if (url.includes('stimergie.fr/photos')) {
      // Ajouter l'extension si nécessaire
      if (url.includes('/PNG/') && !isPng) {
        return `${url}.png`;
      } 
      else if (!url.includes('/PNG/') && !isJpg) {
        return `${url}.jpg`;
      }
    }
    
    // URL valide
    return url;
  } catch (e) {
    console.warn('URL invalide:', url);
    return null;
  }
}

/**
 * Affiche des informations de débogage sur une URL d'image
 */
export function debugImageUrl(url: string): void {
  console.log('Image URL Debug:', {
    url,
    isValid: Boolean(url) && url.startsWith('http'),
    length: url?.length || 0,
    containsSpecialChars: /[^a-zA-Z0-9\-_\.\/:]/.test(url),
    domain: url ? extractDomain(url) : 'none',
    isPNG: url.toLowerCase().endsWith('.png'),
    isJPG: url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg'),
    isStimergieFormat: url.includes('stimergie.fr/photos')
  });
}
