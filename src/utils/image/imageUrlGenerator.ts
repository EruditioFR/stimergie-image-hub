
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
  
  // Ne pas normaliser le nom du dossier, conserver le format original
  const encodedFolder = encodeURIComponent(folderName);
  
  return `https://stimergie.fr/photos/${encodedFolder}/PNG/${imageTitle}.png`;
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
  
  // Ne pas normaliser le nom du dossier, conserver le format original
  const encodedFolder = encodeURIComponent(folderName);
  
  return `https://stimergie.fr/photos/${encodedFolder}/${imageTitle}.png`;
}

/**
 * Normalise une chaîne pour être utilisée dans une URL
 * - Remplace les espaces par des tirets
 * - Supprime les caractères spéciaux
 * - Convertit en minuscules
 * 
 * Note: Cette fonction est conservée pour la rétrocompatibilité mais n'est plus utilisée
 * dans la génération des URLs d'images.
 */
function normalizeForUrl(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-')     // Remplace les espaces par des tirets
    .replace(/-+/g, '-');     // Évite les tirets multiples
}
