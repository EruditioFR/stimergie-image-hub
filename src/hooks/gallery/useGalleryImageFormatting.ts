
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
    return images.map(image => {
      const srcUrl = image.display_url || image.url_miniature || image.url || '';
      // Maintenant on conserve toujours le champ url original pour les téléchargements
      const downloadUrl = image.url;
      
      const width = parseInt(image.width) || 0;
      const height = parseInt(image.height) || 0;
      
      let orientation = image.orientation || 'landscape';
      if (width > 0 && height > 0) {
        if (width > height) {
          orientation = 'landscape';
        } else if (height > width) {
          orientation = 'portrait';
        } else {
          orientation = 'square';
        }
      }
      
      console.log(`Image ${image.id} (${image.title}): dims=${width}x${height}, orientation=${orientation}`);

      return {
        id: image.id.toString(),
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
