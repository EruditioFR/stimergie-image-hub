
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
): ValidationResult {
  // Check if URL exists
  if (!url || url.trim() === '') {
    console.error(`Missing URL for image ${imageId}: ${imageTitle}`);
    return {
      isValid: false,
      url: null,
      error: `URL manquante pour l'image ${imageTitle}`
    };
  }

  // Log the URL being validated
  console.log(`Validating URL for image ${imageId}: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);

  try {
    // Check if URL is from stimergie.fr
    if (url.includes('stimergie.fr')) {
      // Make sure URL is properly encoded
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // If URL has spaces or special chars that should be encoded
      if (lastPart.includes(' ') || /[^\w\-\.\/]/.test(lastPart)) {
        // Replace the last part with properly encoded version
        urlParts[urlParts.length - 1] = encodeURIComponent(lastPart);
        const encodedUrl = urlParts.join('/');
        
        console.log(`URL reencoded: ${encodedUrl}`);
        
        return {
          isValid: true,
          url: encodedUrl,
          error: null
        };
      }
    }
    
    // If URL passed all checks
    return {
      isValid: true,
      url: url,
      error: null
    };
  } catch (error) {
    console.error(`Error validating URL for image ${imageId}:`, error);
    return {
      isValid: false,
      url: null,
      error: `Erreur de validation d'URL: ${error}`
    };
  }
}
