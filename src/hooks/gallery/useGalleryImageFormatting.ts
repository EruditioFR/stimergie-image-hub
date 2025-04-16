
import { useCallback } from 'react';
import { Image } from '@/utils/image/types';

/**
 * Hook for handling image formatting and transformation logic
 */
export const useGalleryImageFormatting = () => {
  /**
   * Formats raw image data from the API for display in the gallery grid
   */
  const formatImagesForGrid = useCallback((images: any[] = []) => {
    console.log(`Formatting ${images.length} images for gallery display`);
    
    return images.map(image => {
      // Garantir que toutes les images ont un ID au format string
      const id = image.id ? String(image.id) : `img-${Math.random().toString(36).substring(2, 9)}`;
      
      // URLs pour affichage et téléchargement
      const srcUrl = image.display_url || image.url_miniature || image.url || '';
      const downloadUrl = image.url || image.download_url || srcUrl;
      
      // Dimensions et orientation
      const width = parseInt(image.width) || 0;
      const height = parseInt(image.height) || 0;
      
      let orientation = image.orientation || 'paysage';
      if (width > 0 && height > 0) {
        if (width > height) {
          orientation = 'paysage';
        } else if (height > width) {
          orientation = 'portrait';
        } else {
          orientation = 'carré';
        }
      }
      
      return {
        id: id,
        src: srcUrl,
        display_url: srcUrl,
        download_url: downloadUrl,
        alt: image.title || "Image sans titre",
        title: image.title || "Sans titre",
        author: image.created_by || 'Utilisateur',
        tags: image.tags || [],
        orientation: orientation,
        width: width,
        height: height,
        created_at: image.created_at || new Date().toISOString(),
        description: image.description || '',
        url_miniature: srcUrl,
        url: downloadUrl
      } as Image;
    });
  }, []);

  return { formatImagesForGrid };
};
