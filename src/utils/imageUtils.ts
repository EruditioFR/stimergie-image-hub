// Helper functions for image processing and formatting

/**
 * Parses tags from string to array format
 */
export const parseTagsString = (tagsString: string | null): string[] | null => {
  if (!tagsString) return null;
  try {
    // If it's already a JSON (format "[tag1, tag2]"), parse it
    if (tagsString.startsWith('[')) {
      return JSON.parse(tagsString);
    }
    // Otherwise split by comma (if it's a format "tag1,tag2")
    return tagsString.split(',').map(tag => tag.trim());
  } catch (e) {
    console.error('Error parsing tags:', e);
    return [tagsString]; // Fallback to a array with the original string
  }
};

/**
 * Formats images for the masonry grid display
 */
export const formatImagesForGrid = (images: any[] = []) => {
  return images.map(image => ({
    id: image.id.toString(),
    src: image.url_miniature || image.url, // Use thumbnail if available
    alt: image.title,
    title: image.title,
    author: 'User',
    tags: image.tags,
    orientation: image.orientation
  }));
};
