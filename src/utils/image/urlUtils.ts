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
 * Checks if a URL is from Dropbox
 */
export function isDropboxUrl(url: string): boolean {
  return url.includes('dropbox.com') || url.includes('dl.dropboxusercontent.com');
}

/**
 * Extracts direct download link from a Dropbox URL
 */
export function getDropboxDownloadUrl(url: string): string {
  // Si l'URL est vide, retourner une chaîne vide
  if (!url) return '';

  // If already a direct link, return as is
  if (url.includes('dl.dropboxusercontent.com') || url.includes('dl=1')) {
    return url;
  }
  
  // Convert to direct download link
  if (url.includes('?')) {
    return `${url}&dl=1`;
  } else {
    return `${url}?dl=1`;
  }
}

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
  // Ne pas générer de placeholder pour les URLs SVG
  if (originalUrl && isVectorImage(originalUrl)) {
    return originalUrl;
  }
  
  // Utiliser une image de placeholder PNG au lieu d'un SVG
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
 * @returns URL originale ou URL corrigée
 */
export function validateImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Vérifier si c'est déjà une URL valide
  try {
    new URL(url);
    
    // Éviter les URL qui pointent vers des placeholders SVG par défaut
    if (url.includes('data:image/svg+xml') || url.includes('placeholder.svg')) {
      console.warn('Placeholder SVG détecté:', url.substring(0, 50) + '...');
      return null;
    }
    
    // S'assurer que l'URL se termine par une extension d'image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => urlLower.includes(ext));
    
    if (!hasImageExtension) {
      console.warn('URL sans extension d\'image:', url);
      // Vérifier si c'est une URL stimergie qui devrait suivre le format spécifié
      if (url.includes('stimergie.fr/photos')) {
        // Ajouter l'extension .png pour les URLs de display
        if (url.includes('/PNG/') && !url.endsWith('.png')) {
          return `${url}.png`;
        }
        // Ajouter l'extension .jpg pour les URLs de téléchargement
        else if (!url.includes('/PNG/') && !url.endsWith('.jpg')) {
          return `${url}.jpg`;
        }
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
    domain: url ? extractDomain(url) : 'none'
  });
}
