
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Image } from '@/utils/image/types';

type ImageContextType = {
  images: Image[];
  setImages: React.Dispatch<React.SetStateAction<Image[]>>;
  addImages: (newImages: Image[]) => void;
  getImageById: (id: string) => Image | undefined;
};

const ImageContext = createContext<ImageContextType>({
  images: [],
  setImages: () => {},
  addImages: () => {},
  getImageById: () => undefined,
});

export const useImages = () => useContext(ImageContext);

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<Image[]>([]);

  // Fonction pour ajouter des images sans dupliquer les IDs
  const addImages = (newImages: Image[]) => {
    setImages(currentImages => {
      const currentIds = new Set(currentImages.map(img => img.id));
      const uniqueNewImages = newImages.filter(img => !currentIds.has(img.id));
      
      if (uniqueNewImages.length > 0) {
        console.log(`Ajout de ${uniqueNewImages.length} nouvelles images au contexte`);
        return [...currentImages, ...uniqueNewImages];
      }
      
      return currentImages;
    });
  };

  // Fonction pour récupérer une image par son ID
  const getImageById = (id: string) => {
    return images.find(img => img.id === id);
  };

  // Pour le débogage en développement
  useEffect(() => {
    console.log(`ImageContext contient ${images.length} images`);
  }, [images.length]);

  return (
    <ImageContext.Provider value={{ images, setImages, addImages, getImageById }}>
      {children}
    </ImageContext.Provider>
  );
};
