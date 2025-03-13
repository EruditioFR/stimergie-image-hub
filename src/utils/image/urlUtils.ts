
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
 * Convertit une URL Dropbox en URL d'API Dropbox pour le téléchargement direct
 */
export function getDropboxDownloadUrl(url: string): string {
  // Transformer l'URL standard en URL de contenu direct
  // Format: de www.dropbox.com à dl.dropboxusercontent.com
  if (url.includes('www.dropbox.com')) {
    // Extraire le chemin de l'URL
    try {
      const urlObj = new URL(url);
      // Remplacer le domaine et adapter le chemin
      const newPath = urlObj.pathname.replace('/scl/fi/', '/').split('?')[0];
      return `https://dl.dropboxusercontent.com${newPath}`;
    } catch (error) {
      console.error("Erreur lors de la conversion de l'URL Dropbox:", error);
    }
  }
  
  // Si la conversion échoue ou si ce n'est pas une URL standard, utiliser la méthode de secours
  return url.includes('dl=0') 
    ? url.replace('dl=0', 'raw=1') 
    : url.includes('dl=1') 
      ? url.replace('dl=1', 'raw=1')
      : url.includes('raw=1')
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}raw=1`;
}

/**
 * Solution pour contourner les problèmes CORS avec les sources externes
 */
export function getProxiedUrl(url: string): string {
  // Utiliser un proxy CORS pour toutes les URL externes
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    // Pour Dropbox, utiliser un proxy qui préserve les en-têtes binaires
    if (url.includes('dropboxusercontent.com')) {
      const corsProxyUrl = 'https://images.weserv.nl/?url=' + encodeURIComponent(url);
      console.log(`URL Dropbox convertie via proxy spécial: ${corsProxyUrl}`);
      return corsProxyUrl;
    }
    
    // Pour les autres URLs
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log(`URL externe convertie via proxy: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // URLs internes - retourner telles quelles
  return url;
}
