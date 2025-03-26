
/**
 * Génère les URLs pour les images selon le nouveau format avec gestion des erreurs CORS
 */

/**
 * Génère l'URL d'affichage pour une image (format PNG pour affichage)
 * Format: https://www.stimergie.fr/photos/[nom du dossier]/PNG/[titre].png
 */
export function generateDisplayImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn('Nom de dossier ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Si l'URL existe déjà sous format Dropbox, l'utiliser directement
  if (imageTitle.includes('dropbox.com') || folderName.includes('dropbox.com')) {
    return imageTitle || folderName;
  }
  
  // Encoder correctement les composants de l'URL pour éviter les problèmes avec les caractères spéciaux
  const encodedFolder = encodeURIComponent(folderName);
  const encodedTitle = encodeURIComponent(imageTitle);
  
  return `https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`;
}

/**
 * Génère l'URL de téléchargement pour une image (format original)
 * Format: https://www.stimergie.fr/photos/[nom_dossier]/[titre].jpg
 */
export function generateDownloadImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn('Nom de dossier ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Si l'URL existe déjà sous format Dropbox, l'utiliser directement
  if (imageTitle.includes('dropbox.com') || folderName.includes('dropbox.com')) {
    // S'assurer que c'est bien un lien de téléchargement direct
    const dropboxUrl = imageTitle || folderName;
    if (dropboxUrl.includes('dl=0')) {
      return dropboxUrl.replace('dl=0', 'dl=1');
    } else if (!dropboxUrl.includes('dl=1')) {
      return dropboxUrl + (dropboxUrl.includes('?') ? '&dl=1' : '?dl=1');
    }
    return dropboxUrl;
  }
  
  // Encoder correctement les composants de l'URL pour éviter les problèmes avec les caractères spéciaux
  const encodedFolder = encodeURIComponent(folderName);
  const encodedTitle = encodeURIComponent(imageTitle);
  
  return `https://www.stimergie.fr/photos/${encodedFolder}/${encodedTitle}.jpg`;
}

/**
 * Vérifie si une URL stimergie.fr est accessible, sinon retourne une URL alternative
 */
export async function validateAndFixImageUrl(url: string): Promise<string> {
  if (!url) return '';
  
  // Si c'est déjà une URL Dropbox, la retourner directement
  if (url.includes('dropbox.com')) {
    return url;
  }
  
  try {
    // Essayer de vérifier si l'URL est accessible
    const response = await fetch(url, { 
      method: 'HEAD', 
      mode: 'no-cors',
      cache: 'force-cache'
    });
    
    // Si l'URL semble fonctionner, la retourner
    return url;
  } catch (error) {
    console.warn(`URL inaccessible: ${url}`, error);
    
    // Essayer une alternative sans proxy
    if (url.includes('corsproxy.io')) {
      const decodedUrl = decodeURIComponent(url.split('corsproxy.io/?')[1]);
      return decodedUrl;
    }
    
    // En dernier recours, utiliser une image de remplacement
    return '/placeholder.png';
  }
}
