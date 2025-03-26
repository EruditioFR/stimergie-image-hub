
import React, { memo } from 'react';
import { ImageCard } from '@/components/ImageCard';
import { type ImageForGrid } from '@/types/image';

interface MasonryColumnProps {
  images: ImageForGrid[];
  isImageSelected: (id: string) => boolean;
  toggleImageSelection: (id: string) => void;
  onImageClick?: (image: ImageForGrid) => void;
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
  image: ImageForGrid;
  isSelected: boolean;
  onToggleSelection: () => void;
  onImageClick?: (image: ImageForGrid) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(image);
    }
  };
  
  // Prioritize the best available image URL
  const imageSrc = image.display_url || image.src;
  
  return (
    <div className="opacity-100 relative group">
      {/* Selection indicator - now larger and more visible */}
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
      
      <div onClick={handleClick}>
        <ImageCard 
          {...image} 
          className={`w-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
          orientation={image.orientation}
          onClick={handleClick}
          // Use best available image URL
          src={imageSrc}
          downloadUrl={image.download_url}
          // Provide a fallback for alt
          alt={image.alt || image.title || ""}
        />
      </div>
    </div>
  );
});
