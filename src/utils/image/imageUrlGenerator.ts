
/**
 * Génère les URLs pour les images selon le nouveau format
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
  
  return `https://www.stimergie.fr/photos/${folderName}/PNG/${imageTitle}.png`;
}

/**
 * Génère l'URL de téléchargement pour une image (format original)
 * Format: https://www.stimergie.fr/photos/[nom du dossier]/[titre].jpg
 */
export function generateDownloadImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn('Nom de dossier ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  return `https://www.stimergie.fr/photos/${folderName}/${imageTitle}.jpg`;
}
