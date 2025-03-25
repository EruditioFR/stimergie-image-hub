
/**
 * Génère les URLs pour les images selon le nouveau format
 */

/**
 * Génère l'URL d'affichage pour une image (format PNG pour affichage)
 * Format: https://stimergie.fr/photos/[nom du projet]/PNG/[titre].png
 */
export function generateDisplayImageUrl(projectName: string, imageTitle: string): string {
  if (!projectName || !imageTitle) {
    console.warn('Nom de projet ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Normaliser le nom du projet et le titre de l'image pour l'URL
  const normalizedProject = normalizeForUrl(projectName);
  const normalizedTitle = normalizeForUrl(imageTitle);
  
  return `https://stimergie.fr/photos/${normalizedProject}/PNG/${normalizedTitle}.png`;
}

/**
 * Génère l'URL de téléchargement pour une image (format original)
 * Format: https://stimergie.fr/photos/[nom du projet]/[titre].png
 */
export function generateDownloadImageUrl(projectName: string, imageTitle: string): string {
  if (!projectName || !imageTitle) {
    console.warn('Nom de projet ou titre d\'image manquant pour générer l\'URL');
    return '';
  }
  
  // Normaliser le nom du projet et le titre de l'image pour l'URL
  const normalizedProject = normalizeForUrl(projectName);
  const normalizedTitle = normalizeForUrl(imageTitle);
  
  return `https://stimergie.fr/photos/${normalizedProject}/${normalizedTitle}.png`;
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
