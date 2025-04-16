
/**
 * Génère les URLs pour les images sur le serveur Stimergie
 */

/**
 * Génère l'URL d'affichage pour une image (format PNG pour affichage)
 * Format: https://www.stimergie.fr/photos/[nom du dossier]/PNG/[titre].png
 */
export function generateDisplayImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn(`Nom de dossier ou titre d'image manquant pour générer l'URL d'affichage: ${folderName || 'dossier manquant'} / ${imageTitle || 'titre manquant'}`);
    return '';
  }
  
  // Nettoyer le titre d'image pour l'URL (enlever l'extension si présente)
  const cleanImageTitle = imageTitle.replace(/\.(jpg|jpeg|png)$/i, '');
  
  // Encoder correctement les composants de l'URL pour éviter les problèmes avec les caractères spéciaux
  const encodedFolder = encodeURIComponent(folderName.trim());
  const encodedTitle = encodeURIComponent(cleanImageTitle.trim());
  
  // Ajouter un log pour le debugging
  console.log(`Generated display URL for ${imageTitle}: https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`);
  
  return `https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`;
}

/**
 * Génère l'URL de téléchargement pour une image en qualité normale (PNG)
 * Format: https://www.stimergie.fr/photos/[nom_dossier]/PNG/[titre].png
 */
export function generateDownloadImageSDUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn(`Nom de dossier ou titre d'image manquant pour générer l'URL de téléchargement SD: ${folderName || 'dossier manquant'} / ${imageTitle || 'titre manquant'}`);
    return '';
  }
  
  // Nettoyer le titre d'image pour l'URL (enlever l'extension si présente)
  const cleanImageTitle = imageTitle.replace(/\.(jpg|jpeg|png)$/i, '');
  
  const encodedFolder = encodeURIComponent(folderName.trim());
  const encodedTitle = encodeURIComponent(cleanImageTitle.trim());
  
  // Ajouter un log pour le debugging
  console.log(`Generated SD download URL for ${imageTitle}: https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`);
  
  return `https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`;
}

/**
 * Génère l'URL de téléchargement HD pour une image (format original)
 * Format: https://www.stimergie.fr/photos/[nom_dossier]/[titre].jpg
 */
export function generateDownloadImageHDUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn(`Nom de dossier ou titre d'image manquant pour générer l'URL de téléchargement HD: ${folderName || 'dossier manquant'} / ${imageTitle || 'titre manquant'}`);
    return '';
  }
  
  // Nettoyer le titre d'image pour l'URL (enlever l'extension si présente)
  const cleanImageTitle = imageTitle.replace(/\.(jpg|jpeg|png)$/i, '');
  
  const encodedFolder = encodeURIComponent(folderName.trim());
  const encodedTitle = encodeURIComponent(cleanImageTitle.trim());
  
  // Ajouter un log pour le debugging
  console.log(`Generated HD download URL for ${imageTitle}: https://www.stimergie.fr/photos/${encodedFolder}/${encodedTitle}.jpg`);
  
  return `https://www.stimergie.fr/photos/${encodedFolder}/${encodedTitle}.jpg`;
}

/**
 * Pour rétrocompatibilité - Alias de generateDownloadImageHDUrl
 * @deprecated Utiliser generateDownloadImageHDUrl à la place
 */
export function generateDownloadImageUrl(folderName: string, imageTitle: string): string {
  return generateDownloadImageHDUrl(folderName, imageTitle);
}

/**
 * Vérifie si une URL stimergie.fr est accessible, sinon retourne une URL alternative
 */
export async function validateAndFixImageUrl(url: string): Promise<string> {
  if (!url) return '';
  
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

/**
 * Décode l'URL si nécessaire (ex: URL avec proxy)
 */
export function decodeUrlIfNeeded(url: string): string {
  if (!url) return '';
  
  // Si l'URL utilise un proxy, extraire l'URL originale
  if (url.includes('corsproxy.io')) {
    return decodeURIComponent(url.split('corsproxy.io/?')[1]);
  }
  
  return url;
}
