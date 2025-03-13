
import React from 'react';

interface SelectedImage {
  id: string;
  src: string;
  alt: string;
}

interface SelectedImagesPreviewProps {
  selectedImages: SelectedImage[];
}

export function SelectedImagesPreview({ selectedImages }: SelectedImagesPreviewProps) {
  return (
    <div className="mt-4 bg-muted/30 p-4 rounded-lg">
      <h4 className="text-sm font-medium mb-2">Images sélectionnées ({selectedImages.length})</h4>
      <div className="flex flex-wrap gap-2">
        {selectedImages.slice(0, 5).map((image) => (
          <div key={image.id} className="w-16 h-16 rounded-md overflow-hidden relative">
            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          </div>
        ))}
        {selectedImages.length > 5 && (
          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
            <span className="text-sm">+{selectedImages.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
}
