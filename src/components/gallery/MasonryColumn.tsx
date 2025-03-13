
import React from 'react';
import { ImageCard } from '@/components/ImageCard';

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  tags?: string[];
  orientation?: string;
}

interface MasonryColumnProps {
  images: Image[];
  isImageSelected: (id: string) => boolean;
  toggleImageSelection: (id: string) => void;
}

export function MasonryColumn({ 
  images, 
  isImageSelected, 
  toggleImageSelection 
}: MasonryColumnProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {images.map((image) => (
        <div 
          key={image.id}
          className="opacity-100 relative" 
        >
          <div 
            className={`absolute top-2 left-2 w-5 h-5 rounded-full z-10 border-2 cursor-pointer transition-colors ${
              isImageSelected(image.id) 
                ? 'bg-primary border-white' 
                : 'bg-white/50 border-white/70 hover:bg-white/80'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleImageSelection(image.id);
            }}
          />
          <ImageCard 
            {...image} 
            className={`w-full transition-all ${isImageSelected(image.id) ? 'ring-2 ring-primary ring-offset-1' : ''}`}
            orientation={image.orientation}
          />
        </div>
      ))}
    </div>
  );
}
