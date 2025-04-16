
/**
 * Utility functions for handling image errors and URL validation
 */

import { toast } from 'sonner';

/**
 * Checks if an image URL is valid and provides detailed error information
 * @param url The URL to check
 * @param imageId Optional image ID for logging
 * @param imageTitle Optional image title for logging
 * @returns An object with validation status and error details
 */
export function validateImageUrl(url: string | undefined | null, imageId?: string | number, imageTitle?: string): { 
  isValid: boolean; 
  error?: string;
  url?: string;
} {
  // Check for empty URL
  if (!url) {
    const errorMessage = `Missing URL for image ${imageId || ''} ${imageTitle || ''}`;
    console.error(errorMessage);
    return { isValid: false, error: errorMessage };
  }

  // Check for malformed URL
  try {
    new URL(url);
  } catch (e) {
    const errorMessage = `Invalid URL format for image ${imageId || ''}: ${url}`;
    console.error(errorMessage);
    return { isValid: false, error: errorMessage, url };
  }

  // Check for expected patterns in Stimergie URLs
  if (url.includes('stimergie.fr/photos')) {
    // Verify the URL has all expected parts for a Stimergie image URL
    const urlParts = url.split('/photos/');
    
    if (urlParts.length !== 2) {
      return { 
        isValid: false, 
        error: `Malformed Stimergie URL - missing /photos/ path: ${url}`,
        url 
      };
    }
    
    // Check expected folder structure
    const pathParts = urlParts[1].split('/');
    if (pathParts.length < 2) {
      return { 
        isValid: false, 
        error: `Malformed Stimergie URL - incomplete path structure: ${url}`,
        url 
      };
    }
    
    // Check if this is a PNG URL and if it has the proper format
    if (url.includes('/PNG/')) {
      if (!url.toLowerCase().endsWith('.png')) {
        return { 
          isValid: false, 
          error: `PNG URL should end with .png extension: ${url}`,
          url: `${url}.png` // Suggested fix by adding the extension
        };
      }
    } 
    // For non-PNG URLs, they should end with a proper image extension
    else if (!url.toLowerCase().endsWith('.jpg') && !url.toLowerCase().endsWith('.jpeg')) {
      return { 
        isValid: false, 
        error: `Image URL should end with .jpg extension: ${url}`,
        url: `${url}.jpg` // Suggested fix by adding the extension
      };
    }
  }

  // URL seems valid
  return { isValid: true, url };
}

/**
 * Shows an error toast with details about URL issues
 * @param error The error message or error object
 * @param imageTitle Optional image title for the error message
 */
export function showImageUrlError(error: Error | string, imageTitle?: string) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  toast.error('Problème avec l\'URL de l\'image', {
    description: imageTitle 
      ? `${imageTitle}: ${errorMessage}`
      : errorMessage
  });
  
  console.error('Image URL error:', errorMessage);
}
