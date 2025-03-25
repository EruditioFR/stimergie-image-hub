
/**
 * Génère les URLs pour les images selon le nouveau format
 */

/**
 * Génère l'URL d'affichage pour une image (format PNG pour affichage)
 * Format: https://stimergie.fr/photos/[nom du dossier]/PNG/[titre].png
 */
export function generateDisplayImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn('Nom de dossier ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Normaliser uniquement le nom du dossier, pas le titre de l'image
  const normalizedFolder = normalizeForUrl(folderName);
  
  return `https://stimergie.fr/photos/${normalizedFolder}/PNG/${imageTitle}.png`;
}

/**
 * Génère l'URL de téléchargement pour une image (format original)
 * Format: https://stimergie.fr/photos/[nom du dossier]/[titre].png
 */
export function generateDownloadImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    console.warn('Nom de dossier ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Normaliser uniquement le nom du dossier, pas le titre de l'image
  const normalizedFolder = normalizeForUrl(folderName);
  
  return `https://stimergie.fr/photos/${normalizedFolder}/${imageTitle}.png`;
}

/**
 * Normalise une chaîne pour être utilisée dans une URL
 * - Remplace les espaces par des tirets
 * - Supprime les caractères spéciaux
 * - Convertit en minuscules
 */
function normalizeForUrl(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-')     // Remplace les espaces par des tirets
    .replace(/-+/g, '-');     // Évite les tirets multiples
}
