
import React, { memo } from 'react';
import { ImageCard } from '@/components/ImageCard';
import { Image } from '@/utils/image/types';
import { Link } from 'react-router-dom';

interface MasonryColumnProps {
  images: Image[];
  isImageSelected: (id: string) => boolean;
  toggleImageSelection: (id: string) => void;
  onImageClick?: (image: Image) => void;
}

// Composant optimisé avec memo pour éviter les re-renders inutiles
export const MasonryColumn = memo(function MasonryColumn({ 
  images, 
  isImageSelected, 
  toggleImageSelection,
  onImageClick 
}: MasonryColumnProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {images.map((image) => (
        <ImageItem 
          key={image.id}
          image={image}
          isSelected={isImageSelected(image.id)}
          onToggleSelection={() => toggleImageSelection(image.id)}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
});

// Sous-composant pour chaque image, également mémoïsé
const ImageItem = memo(function ImageItem({
  image,
  isSelected,
  onToggleSelection,
  onImageClick
}: {
  image: Image;
  isSelected: boolean;
  onToggleSelection: () => void;
  onImageClick?: (image: Image) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(image);
    }
  };
  
  // Utiliser directement les URLs spécifiques
  const imageSrc = image.display_url || image.src;
  const downloadUrl = image.download_url || image.src;

  // Vérifier si les dimensions sont cohérentes avec l'orientation déclarée
  const determineOrientation = () => {
    if (image.width && image.height) {
      // Déterminer l'orientation à partir des dimensions réelles
      if (image.width > image.height) {
        return 'paysage';
      } else if (image.height > image.width) {
        return 'portrait';
      } else {
        return 'carré';
      }
    }
    // Fallback sur l'orientation déclarée si disponible
    return image.orientation || 'paysage';
  };
  
  // L'orientation calculée en fonction des dimensions réelles
  const actualOrientation = determineOrientation();
  
  return (
    <div className="opacity-100 relative group">
      {/* Selection indicator */}
      <div 
        className={`absolute top-3 left-3 w-7 h-7 rounded-full z-10 border-2 cursor-pointer 
          flex items-center justify-center transition-colors 
          ${isSelected 
            ? 'bg-primary border-white scale-110' 
            : 'bg-white/60 border-white/70 group-hover:bg-white/90'
          }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelection();
        }}
      >
        {isSelected && (
          <span className="text-white font-bold text-xs">✓</span>
        )}
      </div>
      
      {/* Invisible larger hit area overlay for better selection UX */}
      <div 
        className="absolute top-0 left-0 w-1/4 h-1/4 min-w-[60px] min-h-[60px] z-5 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelection();
        }}
      />
      
      <div onClick={handleClick} className="w-full">
        <ImageCard 
          {...image} 
          className={`w-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
          onClick={handleClick}
          // Utiliser les URLs correctes
          src={imageSrc}
          downloadUrl={downloadUrl}
          // S'assurer que les propriétés requises ont toujours des valeurs
          title={image.title || "Sans titre"}
          author={image.author || "Inconnu"}
          alt={image.alt || image.title || "Image"}
          // Transmettre les dimensions d'origine et l'orientation calculée
          width={image.width}
          height={image.height}
          orientation={actualOrientation}
        />
      </div>
    </div>
  );
});
