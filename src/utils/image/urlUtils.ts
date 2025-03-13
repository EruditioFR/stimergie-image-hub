
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
  // Pour une URL partagée publique, utiliser la version dl=1
  // Cette approche fonctionne pour les liens partagés sans avoir besoin d'authentification
  return url.includes('dl=0') 
    ? url.replace('dl=0', 'dl=1') 
    : url.includes('dl=1') 
      ? url 
      : `${url}${url.includes('?') ? '&' : '?'}dl=1`;
}

/**
 * Solution pour contourner les problèmes CORS avec les sources externes
 */
export function getProxiedUrl(url: string): string {
  // Utiliser un proxy CORS pour toutes les URL externes
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log(`URL externe convertie via proxy: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // URLs internes - retourner telles quelles
  return url;
}
