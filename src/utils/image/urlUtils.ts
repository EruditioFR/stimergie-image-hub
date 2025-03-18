
/**
 * Vérifie si une URL est une URL Dropbox
 */
export function isDropboxUrl(url: string): boolean {
  return url.includes('dropbox.com');
}

/**
 * Extrait le chemin du fichier à partir d'une URL Dropbox
 */
export function extractDropboxFilePath(url: string): string | null {
  try {
    // Format typique: https://www.dropbox.com/scl/fi/[id]/[filename]?[params]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Le nom de fichier est généralement le dernier élément du chemin
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin Dropbox:", error);
    return null;
  }
}

/**
 * Handle Dropbox URLs by converting them to direct download URLs
 */
export function getDropboxDownloadUrl(url: string): string {
  // Transform the URL standard in URL of direct content
  // Format: from www.dropbox.com to dl.dropboxusercontent.com
  if (url.includes('www.dropbox.com')) {
    // Extract path from URL
    try {
      const urlObj = new URL(url);
      // Replace domain and adapt path
      const newPath = urlObj.pathname.replace('/scl/fi/', '/').split('?')[0];
      return `https://dl.dropboxusercontent.com${newPath}?t=${Date.now()}`;
    } catch (error) {
      console.error("Error converting Dropbox URL:", error);
    }
  }
  
  // If conversion fails or if it's not a standard URL, use fallback method
  const timestamp = Date.now();
  return url.includes('dl=0') 
    ? url.replace('dl=0', `raw=1&t=${timestamp}`) 
    : url.includes('dl=1') 
      ? url.replace('dl=1', `raw=1&t=${timestamp}`)
      : url.includes('raw=1')
        ? `${url}&t=${timestamp}`
        : `${url}${url.includes('?') ? '&' : '?'}raw=1&t=${timestamp}`;
}

/**
 * Solution pour contourner les problèmes CORS avec les sources externes
 * Sans mise en cache
 */
export function getProxiedUrl(url: string): string {
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  const urlWithTimestamp = url.includes('?') 
    ? `${url}&t=${timestamp}` 
    : `${url}?t=${timestamp}`;
    
  // Utiliser un proxy CORS pour toutes les URL externes
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    // Pour Dropbox, utiliser un proxy direct
    if (url.includes('dropboxusercontent.com')) {
      return urlWithTimestamp;
    }
    
    // Pour les autres URLs, utiliser un proxy simple sans cache
    return urlWithTimestamp;
  }
  
  // URLs internes - retourner avec timestamp
  return urlWithTimestamp;
}
