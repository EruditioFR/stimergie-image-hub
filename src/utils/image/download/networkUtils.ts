
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
