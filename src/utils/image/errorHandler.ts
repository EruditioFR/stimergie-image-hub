/**
 * Utility functions for handling image URL errors
 */

interface ValidationResult {
  isValid: boolean;
  url: string | null;
  error: string | null;
}

/**
 * Validates if a URL is properly formatted and contains necessary components
 * @param url The image URL to validate
 * @param imageId ID of the image (for logging)
 * @param imageTitle Title of the image (for logging)
 * @returns ValidationResult with status and error info
 */
export function validateImageUrl(
  url: string,
  imageId: string | number,
  imageTitle: string
): { isValid: boolean; url: string | null; error: string | null } {
  // URL vide
  if (!url) {
    return {
      isValid: false,
      url: null,
      error: `URL vide pour image ${imageTitle} (ID: ${imageId})`
    };
  }
  
  // URL non sécurisée (http)
  if (url.startsWith('http:')) {
    // Essayer de convertir en https
    const httpsUrl = url.replace('http:', 'https:');
    return {
      isValid: true,
      url: httpsUrl,
      error: null
    };
  }
  
  // Vérifier que l'URL est au format JPG (plutôt que de vérifier la présence de /JPG/)
  // Cette logique est désormais séparée et gérée par les fonctions spécifiques
  
  // Si tout est OK
  return {
    isValid: true,
    url,
    error: null
  };
}
