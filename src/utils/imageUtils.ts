
// Helper functions for image processing and formatting

/**
 * Parses tags from string to array format
 */
export const parseTagsString = (tagsString: string | null): string[] => {
  if (!tagsString) return [];
  
  try {
    // Si c'est déjà un JSON (format "[tag1, tag2]"), parse-le
    if (tagsString.startsWith('[')) {
      return JSON.parse(tagsString);
    }
    // Sinon, divise par des virgules (si c'est au format "tag1,tag2")
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  } catch (e) {
    console.error('Error parsing tags:', e);
    // Fallback à un tableau avec la chaîne originale si non vide
    return tagsString ? [tagsString] : [];
  }
};

/**
 * Formats images for the masonry grid display
 */
export const formatImagesForGrid = (images: any[] = []) => {
  return images.map(image => {
    // Parse tags if they're a string
    const tags = typeof image.tags === 'string' ? 
      parseTagsString(image.tags) : 
      (Array.isArray(image.tags) ? image.tags : []);
      
    return {
      id: image.id.toString(),
      src: image.url_miniature || image.url, // Use thumbnail if available
      alt: image.title,
      title: image.title,
      author: 'User',
      tags: tags,
      orientation: image.orientation
    };
  });
};
