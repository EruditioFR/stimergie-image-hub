
import React from 'react';
import { ImageDetailModal } from '@/components/gallery/ImageDetailModal';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';

interface MasonryDetailModalProps {
  image: any;
  isOpen: boolean;
  onClose: () => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (isOpen: boolean) => void;
  selectedImages: string[];
  images: any[];
}

export function MasonryDetailModal({
  image,
  isOpen,
  onClose,
  isShareDialogOpen,
  setIsShareDialogOpen,
  selectedImages,
  images
}: MasonryDetailModalProps) {
  return (
    <>
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images}
      />
      
      <ImageDetailModal 
        image={image}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}
