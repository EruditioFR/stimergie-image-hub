
/**
 * Utility functions for generating image URLs
 */

// Generate URL for displaying an image
export function generateDisplayImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    return '';
  }
  
  // Return the URL to the PNG version from Dropbox if available
  // First check if we have a URL_miniature which is already a Dropbox URL
  if (imageTitle.includes('dropbox.com') || imageTitle.includes('dl.dropboxusercontent.com')) {
    return imageTitle;
  }
  
  // Since we're getting CORS errors, we'll use the URL_miniature field that already contains
  // Dropbox URLs in most cases, or fall back to using the direct Dropbox URLs
  // instead of trying to access stimergie.fr directly
  return imageTitle;
}

// Generate URL for downloading an image
export function generateDownloadImageUrl(folderName: string, imageTitle: string): string {
  if (!folderName || !imageTitle) {
    return '';
  }
  
  // Return the URL to the JPG version from Dropbox if available
  // First check if we have a URL which is already a Dropbox URL
  if (imageTitle.includes('dropbox.com') || imageTitle.includes('dl.dropboxusercontent.com')) {
    // Make sure it's a direct download link
    if (!imageTitle.includes('dl=1')) {
      return imageTitle.includes('?') ? `${imageTitle}&dl=1` : `${imageTitle}?dl=1`;
    }
    return imageTitle;
  }
  
  // Since direct access to stimergie.fr causes CORS issues, use the url field 
  // which often contains Dropbox URLs that work better with CORS
  return imageTitle;
}
