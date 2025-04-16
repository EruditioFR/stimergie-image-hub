
import { useState } from 'react';

export function useImageSelection() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      if (prev.includes(id)) {
        return prev.filter(imgId => imgId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isImageSelected = (id: string) => {
    return selectedImages.includes(id);
  };

  const clearSelection = () => {
    setSelectedImages([]);
  };

  const selectAllImages = (imageIds: string[]) => {
    setSelectedImages(imageIds);
  };

  return {
    selectedImages,
    toggleImageSelection,
    isImageSelected,
    clearSelection,
    selectAllImages
  };
}
